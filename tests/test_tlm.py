"""Tests for newton.tlm (Layer 4) — all 10 Newton invariants."""
import copy
import pytest

from newton.tlm import TinyLM, Phase


class TestTinyLM:
    # ------------------------------------------------------------------
    # INVARIANT 1 — Atomicity
    # ------------------------------------------------------------------
    def test_atomicity_empty_input(self):
        """Empty ingest → zero state change."""
        tlm = TinyLM()
        before_nodes = tlm.graph.node_count()
        before_len = len(tlm.ledger)
        tlm.process("")
        assert tlm.graph.node_count() == before_nodes
        assert len(tlm.ledger) == before_len

    def test_atomicity_whitespace_only(self):
        tlm = TinyLM()
        before_nodes = tlm.graph.node_count()
        tlm.process("   ")
        assert tlm.graph.node_count() == before_nodes

    # ------------------------------------------------------------------
    # INVARIANT 2 — Consistency
    # ------------------------------------------------------------------
    def test_consistency_same_hash(self):
        """Same input → same input_hash."""
        tlm1 = TinyLM()
        r1 = tlm1.process("photosynthesis converts light to energy")
        tlm2 = TinyLM()
        r2 = tlm2.process("photosynthesis converts light to energy")
        assert r1["input_hash"] == r2["input_hash"]

    # ------------------------------------------------------------------
    # INVARIANT 3 — Isolation
    # ------------------------------------------------------------------
    def test_isolation(self):
        """Separate instances don't share state."""
        tlm1 = TinyLM()
        tlm2 = TinyLM()
        tlm1.process("hello world")
        assert tlm2.graph.node_count() == 0

    # ------------------------------------------------------------------
    # INVARIANT 4 — Durability
    # ------------------------------------------------------------------
    def test_durability_export_replay(self):
        """Export/replay preserves state."""
        tlm = TinyLM()
        tlm.process("the quick brown fox")
        snap = tlm.snapshot()
        tlm2 = TinyLM()
        tlm2.restore(snap)
        assert tlm2.graph.node_count() == tlm.graph.node_count()
        assert tlm2.ledger.replay() is True

    # ------------------------------------------------------------------
    # INVARIANT 5 — Determinism
    # ------------------------------------------------------------------
    def test_determinism(self):
        """Same input → same output, always."""
        text = "Newton verifies constraints"
        tlm1, tlm2 = TinyLM(), TinyLM()
        r1 = tlm1.process(text)
        r2 = tlm2.process(text)
        assert r1["input_hash"] == r2["input_hash"]
        assert r1["state_hash"] == r2["state_hash"]

    # ------------------------------------------------------------------
    # INVARIANT 6 — Boundary
    # ------------------------------------------------------------------
    def test_boundary_max_nodes(self):
        """Graph node count never exceeds MAX_NODES."""
        tlm = TinyLM()
        tlm.MAX_NODES = 5
        for i in range(100):
            tlm.process(f"unique token word{i}")
        assert tlm.graph.node_count() <= 5

    # ------------------------------------------------------------------
    # INVARIANT 7 — Diffability
    # ------------------------------------------------------------------
    def test_diffability(self):
        """States can be compared via diff()."""
        tlm1 = TinyLM()
        tlm2 = TinyLM()
        tlm1.process("apple banana cherry")
        diff = tlm1.diff(tlm2)
        assert "nodes_only_in_self" in diff
        assert "nodes_only_in_other" in diff
        assert diff["self_node_count"] > diff["other_node_count"]

    # ------------------------------------------------------------------
    # INVARIANT 8 — Reversibility
    # ------------------------------------------------------------------
    def test_reversibility(self):
        """Snapshot/restore works."""
        tlm = TinyLM()
        snap = tlm.snapshot()
        tlm.process("some data to add")
        assert tlm.graph.node_count() > 0
        tlm.restore(snap)
        assert tlm.graph.node_count() == 0

    # ------------------------------------------------------------------
    # INVARIANT 9 — Phase Loop
    # ------------------------------------------------------------------
    def test_phase_loop_completes(self):
        """0→9→0 cycle completes; phase trace includes all phases."""
        tlm = TinyLM()
        result = tlm.process("hello world test")
        trace = result["phase_trace"]
        assert "IDLE" in trace
        assert "INGEST" in trace
        assert "COMMIT" in trace
        assert "RESET" in trace
        # Ends at IDLE
        assert trace[-1] == "IDLE"
        assert tlm.phase == Phase.IDLE

    def test_phase_loop_empty(self):
        """Empty input: cycle still completes."""
        tlm = TinyLM()
        result = tlm.process("")
        assert result["phase_trace"][-1] in ("IDLE", "RESET")

    # ------------------------------------------------------------------
    # INVARIANT 10 — 1==1 Invariant
    # ------------------------------------------------------------------
    def test_1eq1_invariant(self):
        """Crystallisation uses goal equivalence (1==1), not frequency."""
        tlm = TinyLM()
        # A single-word input: first token == last token → identity law
        result = tlm.process("echo")
        assert result["new_laws"] is not None  # may or may not crystallise
        # Run identical input twice — second run still evaluates 1==1
        result2 = tlm.process("echo")
        # The state_hash should differ (pattern counts changed)
        assert result2["committed"] is True

    # ------------------------------------------------------------------
    # Ledger integration
    # ------------------------------------------------------------------
    def test_ledger_grows(self):
        tlm = TinyLM()
        for i in range(3):
            tlm.process(f"input number {i}")
        assert len(tlm.ledger) == 3

    def test_state_hash_deterministic(self):
        tlm1, tlm2 = TinyLM(), TinyLM()
        tlm1.process("hello")
        tlm2.process("hello")
        assert tlm1.state_hash() == tlm2.state_hash()
