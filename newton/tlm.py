"""
Layer 4 — TLM (Tiny Language Model)
Symbolic reasoning kernel operating in a 10-phase cycle (0→9→0).
Depends on: kernel, ledger.

Newton Invariants enforced here:
1.  Atomicity   — Failed/empty ingest → zero state change
2.  Consistency — Same input → same hash
3.  Isolation   — Separate instances don't interfere
4.  Durability  — Export/replay preserves state
5.  Determinism — Same input → same output, always
6.  Boundary    — No infinite loops, bounded growth
7.  Diffability — States can be compared
8.  Reversibility — Snapshot/restore works
9.  Phase Loop  — 0→9→0 cycle completes
10. 1==1 Invariant — Crystallisation uses goal equivalence
"""
from __future__ import annotations

import copy
import json
from dataclasses import dataclass, field, asdict
from enum import IntEnum
from typing import Any, Dict, List, Optional, Tuple

try:
    import networkx as nx
    _HAS_NX = True
except ImportError:  # pragma: no cover
    _HAS_NX = False

from newton.kernel import Result, canonical_hash, now_ts
from newton.ledger import Ledger


# ---------------------------------------------------------------------------
# Phase enumeration
# ---------------------------------------------------------------------------

class Phase(IntEnum):
    IDLE        = 0
    INGEST      = 1
    MELT        = 2
    LIFT        = 3
    COMPARE     = 4
    LEARN       = 5
    CRYSTALLIZE = 6
    VERIFY      = 7
    COMMIT      = 8
    RESET       = 9


# ---------------------------------------------------------------------------
# Atom (immutable token)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Atom:
    """Immutable symbolic token."""
    token: str
    tag: str = "UNK"      # POS-like tag
    weight: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {"token": self.token, "tag": self.tag, "weight": self.weight}

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Atom":
        return cls(**d)


# ---------------------------------------------------------------------------
# Simple graph wrapper (works with or without networkx)
# ---------------------------------------------------------------------------

class AtomGraph:
    """Directed graph of Atoms and weighted edges."""

    def __init__(self) -> None:
        if _HAS_NX:
            self._g: Any = nx.DiGraph()
        else:
            # Fallback: adjacency dict
            self._nodes: Dict[str, Atom] = {}
            self._edges: Dict[Tuple[str, str], float] = {}

    # Nodes
    def add_atom(self, atom: Atom) -> None:
        if _HAS_NX:
            self._g.add_node(atom.token, atom=atom)
        else:
            self._nodes[atom.token] = atom

    def has_atom(self, token: str) -> bool:
        if _HAS_NX:
            return self._g.has_node(token)
        return token in self._nodes

    def get_atom(self, token: str) -> Optional[Atom]:
        if _HAS_NX:
            data = self._g.nodes.get(token)
            return data["atom"] if data else None
        return self._nodes.get(token)

    def all_atoms(self) -> List[Atom]:
        if _HAS_NX:
            return [d["atom"] for _, d in self._g.nodes(data=True)]
        return list(self._nodes.values())

    # Edges
    def add_edge(self, src: str, dst: str, weight: float = 1.0) -> None:
        if _HAS_NX:
            self._g.add_edge(src, dst, weight=weight)
        else:
            self._edges[(src, dst)] = weight

    def edge_weight(self, src: str, dst: str) -> float:
        if _HAS_NX:
            data = self._g.edges.get((src, dst))
            return data["weight"] if data else 0.0
        return self._edges.get((src, dst), 0.0)

    def node_count(self) -> int:
        if _HAS_NX:
            return self._g.number_of_nodes()
        return len(self._nodes)

    def edge_count(self) -> int:
        if _HAS_NX:
            return self._g.number_of_edges()
        return len(self._edges)

    # Serialisation
    def to_dict(self) -> Dict[str, Any]:
        atoms = [a.to_dict() for a in self.all_atoms()]
        if _HAS_NX:
            edges = [
                {"src": u, "dst": v, "weight": d.get("weight", 1.0)}
                for u, v, d in self._g.edges(data=True)
            ]
        else:
            edges = [
                {"src": s, "dst": d, "weight": w}
                for (s, d), w in self._edges.items()
            ]
        return {"atoms": atoms, "edges": edges}

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "AtomGraph":
        g = cls()
        for a in d.get("atoms", []):
            g.add_atom(Atom.from_dict(a))
        for e in d.get("edges", []):
            g.add_edge(e["src"], e["dst"], e.get("weight", 1.0))
        return g


# ---------------------------------------------------------------------------
# TLM state snapshot
# ---------------------------------------------------------------------------

@dataclass
class TLMSnapshot:
    graph_dict: Dict[str, Any]
    pattern_counts: Dict[str, int]
    laws: List[Dict[str, Any]]
    ledger_json: str
    phase: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "graph_dict": self.graph_dict,
            "pattern_counts": self.pattern_counts,
            "laws": self.laws,
            "ledger_json": self.ledger_json,
            "phase": self.phase,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "TLMSnapshot":
        return cls(**d)


# ---------------------------------------------------------------------------
# TinyLM
# ---------------------------------------------------------------------------

class TinyLM:
    """
    Tiny Language Model — symbolic reasoning kernel.

    Usage:
        tlm = TinyLM()
        result = tlm.process("photosynthesis converts light to energy")
    """

    # Hard cap on graph node growth (INVARIANT 6 — Boundary)
    MAX_NODES = 10_000

    def __init__(self, ledger: Optional[Ledger] = None) -> None:
        self.ledger = ledger if ledger is not None else Ledger()
        self.graph = AtomGraph()
        self.pattern_counts: Dict[str, int] = {}
        self.laws: List[Dict[str, Any]] = []
        self._phase: Phase = Phase.IDLE
        self._tx_buffer: List[Atom] = []    # pending atoms for this cycle

    # ------------------------------------------------------------------
    # Phase cycle
    # ------------------------------------------------------------------

    @property
    def phase(self) -> Phase:
        return self._phase

    def _set_phase(self, p: Phase) -> None:
        self._phase = p

    def process(self, text: str) -> Dict[str, Any]:
        """
        Run a complete 0→9→0 phase cycle on *text*.
        Returns a result dict with the witness and any crystallised laws.
        INVARIANT 9 — Phase Loop always completes.
        """
        result: Dict[str, Any] = {
            "input_hash": canonical_hash(text),
            "new_laws": [],
            "committed": False,
            "phase_trace": [],
        }

        # Phase 0: IDLE
        self._set_phase(Phase.IDLE)
        result["phase_trace"].append(Phase.IDLE.name)

        # Phase 1: INGEST — INVARIANT 1 (Atomicity): empty → zero change
        self._set_phase(Phase.INGEST)
        result["phase_trace"].append(Phase.INGEST.name)
        if not text or not text.strip():
            self._set_phase(Phase.RESET)
            result["phase_trace"].append(Phase.RESET.name)
            self._set_phase(Phase.IDLE)
            return result

        # Phase 2: MELT — token → syntax
        self._set_phase(Phase.MELT)
        result["phase_trace"].append(Phase.MELT.name)
        tokens = self._tokenise(text)
        atoms = [self._tag_atom(tok) for tok in tokens]

        # Phase 3: LIFT — syntax → intent
        self._set_phase(Phase.LIFT)
        result["phase_trace"].append(Phase.LIFT.name)
        intent = self._extract_intent(atoms)

        # Phase 4: COMPARE — check patterns  (INVARIANT 5 — Determinism)
        self._set_phase(Phase.COMPARE)
        result["phase_trace"].append(Phase.COMPARE.name)
        pattern_key = canonical_hash({"tokens": tokens, "intent": intent})

        # Phase 5: LEARN — update counts
        self._set_phase(Phase.LEARN)
        result["phase_trace"].append(Phase.LEARN.name)
        self.pattern_counts[pattern_key] = self.pattern_counts.get(pattern_key, 0) + 1

        # Populate tx_buffer (respects MAX_NODES — INVARIANT 6)
        # Account for both existing nodes and pending buffer entries.
        self._tx_buffer = []
        for atom in atoms:
            if (
                not self.graph.has_atom(atom.token)
                and (self.graph.node_count() + len(self._tx_buffer)) < self.MAX_NODES
            ):
                self._tx_buffer.append(atom)

        # Phase 6: CRYSTALLIZE — form laws if 1==1 (INVARIANT 10)
        self._set_phase(Phase.CRYSTALLIZE)
        result["phase_trace"].append(Phase.CRYSTALLIZE.name)
        new_laws = self._crystallise(atoms, intent)
        result["new_laws"] = new_laws

        # Phase 7: VERIFY — validate state
        self._set_phase(Phase.VERIFY)
        result["phase_trace"].append(Phase.VERIFY.name)
        state_hash = canonical_hash({
            "atoms": [a.to_dict() for a in atoms],
            "intent": intent,
            "pattern_counts": dict(sorted(self.pattern_counts.items())),
        })

        # Phase 8: COMMIT — apply transaction (INVARIANT 4 — Durability)
        self._set_phase(Phase.COMMIT)
        result["phase_trace"].append(Phase.COMMIT.name)
        for atom in self._tx_buffer:
            self.graph.add_atom(atom)
        # Add sequential edges between adjacent atoms
        for i in range(len(atoms) - 1):
            self.graph.add_edge(atoms[i].token, atoms[i + 1].token)
        self.laws.extend(new_laws)
        self._tx_buffer = []

        # Append to ledger
        entry = self.ledger.commit(
            intent=f"tlm_process:{state_hash}",
            payload={
                "input_hash": result["input_hash"],
                "state_hash": state_hash,
                "node_count": self.graph.node_count(),
                "new_laws": len(new_laws),
            },
        )
        result["committed"] = True
        result["ledger_step"] = entry.step
        result["state_hash"] = state_hash

        # Phase 9: RESET → back to IDLE (Phase Loop)
        self._set_phase(Phase.RESET)
        result["phase_trace"].append(Phase.RESET.name)
        self._set_phase(Phase.IDLE)
        result["phase_trace"].append(Phase.IDLE.name)

        return result

    # ------------------------------------------------------------------
    # Phase internals
    # ------------------------------------------------------------------

    def _tokenise(self, text: str) -> List[str]:
        """Simple whitespace + punctuation tokenisation."""
        import re
        tokens = re.findall(r"[a-zA-Z0-9']+", text.lower())
        return tokens

    def _tag_atom(self, token: str) -> Atom:
        """Assign a lightweight POS-like tag."""
        STOP_WORDS = {
            "the", "a", "an", "is", "are", "was", "were", "be",
            "to", "of", "and", "or", "in", "on", "at", "it",
        }
        VERBS = {"converts", "produces", "transforms", "creates", "uses", "makes"}
        if token in STOP_WORDS:
            tag = "STOP"
        elif token in VERBS or token.endswith("ing") or token.endswith("ed"):
            tag = "VB"
        elif token[0].isupper() if token else False:
            tag = "NNP"
        else:
            tag = "NN"
        return Atom(token=token, tag=tag, weight=1.0)

    def _extract_intent(self, atoms: List[Atom]) -> str:
        """Extract a simple intent label from atoms."""
        content_atoms = [a.token for a in atoms if a.tag not in ("STOP",)]
        if len(content_atoms) >= 2:
            return f"{content_atoms[0]}_{content_atoms[-1]}"
        if content_atoms:
            return content_atoms[0]
        return "unknown"

    def _crystallise(
        self, atoms: List[Atom], intent: str
    ) -> List[Dict[str, Any]]:
        """
        INVARIANT 10 — 1==1 Invariant.
        Form a law when goal equivalence holds: the intent pattern
        matches a known verifiable goal template (1==1, identity).
        """
        laws: List[Dict[str, Any]] = []
        # Identity gate: if intent resolves to a simple X==X structure
        # (same token appears as both first and last content word), crystallise.
        content = [a.token for a in atoms if a.tag not in ("STOP",)]
        if len(content) >= 1 and content[0] == content[-1]:
            laws.append({
                "law": f"identity:{content[0]}",
                "rule": "1==1",
                "intent": intent,
                "atoms": len(atoms),
            })
        return laws

    # ------------------------------------------------------------------
    # Snapshot / restore (INVARIANT 8 — Reversibility)
    # ------------------------------------------------------------------

    def snapshot(self) -> TLMSnapshot:
        """Capture complete state for later restore."""
        return TLMSnapshot(
            graph_dict=self.graph.to_dict(),
            pattern_counts=copy.deepcopy(self.pattern_counts),
            laws=copy.deepcopy(self.laws),
            ledger_json=self.ledger.export_json(),
            phase=self._phase.value,
        )

    def restore(self, snap: TLMSnapshot) -> None:
        """Restore to a previously captured snapshot."""
        self.graph = AtomGraph.from_dict(snap.graph_dict)
        self.pattern_counts = copy.deepcopy(snap.pattern_counts)
        self.laws = copy.deepcopy(snap.laws)
        self.ledger = Ledger()
        self.ledger.import_json(snap.ledger_json)
        self._phase = Phase(snap.phase)

    # ------------------------------------------------------------------
    # Diffability (INVARIANT 7)
    # ------------------------------------------------------------------

    def diff(self, other: "TinyLM") -> Dict[str, Any]:
        """Return a structural diff between two TinyLM instances."""
        self_atoms = {a.token for a in self.graph.all_atoms()}
        other_atoms = {a.token for a in other.graph.all_atoms()}
        return {
            "nodes_only_in_self": sorted(self_atoms - other_atoms),
            "nodes_only_in_other": sorted(other_atoms - self_atoms),
            "shared_nodes": len(self_atoms & other_atoms),
            "self_node_count": self.graph.node_count(),
            "other_node_count": other.graph.node_count(),
            "self_ledger_len": len(self.ledger),
            "other_ledger_len": len(other.ledger),
        }

    # ------------------------------------------------------------------
    # State hash (INVARIANT 2 — Consistency)
    # ------------------------------------------------------------------

    def state_hash(self) -> str:
        """Deterministic hash of current state."""
        return canonical_hash({
            "nodes": sorted(a.to_dict()["token"] for a in self.graph.all_atoms()),
            "pattern_counts": dict(sorted(self.pattern_counts.items())),
            "law_count": len(self.laws),
        })
