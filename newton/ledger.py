"""
Layer 1 — Ledger
Append-only, hash-chained, immutable record of all commits.
Depends only on kernel utilities.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple

from newton.kernel import canonical_hash, now_ts


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class LedgerEntry:
    """A single immutable entry in the append-only ledger."""
    step: int
    timestamp: float
    intent: str
    payload: Dict[str, Any]
    payload_hash: str
    previous_hash: str
    entry_hash: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step": self.step,
            "timestamp": self.timestamp,
            "intent": self.intent,
            "payload": self.payload,
            "payload_hash": self.payload_hash,
            "previous_hash": self.previous_hash,
            "entry_hash": self.entry_hash,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "LedgerEntry":
        return cls(**d)


def _compute_entry_hash(
    step: int,
    timestamp: float,
    intent: str,
    payload_hash: str,
    previous_hash: str,
) -> str:
    """Deterministic hash for a ledger entry."""
    return canonical_hash({
        "step": step,
        "timestamp": timestamp,
        "intent": intent,
        "payload_hash": payload_hash,
        "previous_hash": previous_hash,
    })


# ---------------------------------------------------------------------------
# Ledger
# ---------------------------------------------------------------------------

class Ledger:
    """
    Append-only ledger with SHA-256 hash chaining.

    Invariants:
    - Entries are never mutated or deleted.
    - Each entry's hash covers its step, timestamp, intent, payload_hash,
      and the previous entry's hash → tamper-evident chain.
    - verify_chain() replays every hash to confirm integrity.
    """

    GENESIS = "GENESIS"

    def __init__(self) -> None:
        self.entries: List[LedgerEntry] = []
        self.last_hash: str = self.GENESIS

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def commit(self, intent: str, payload: Dict[str, Any]) -> LedgerEntry:
        """Append a new verified entry. Returns the created entry."""
        step = len(self.entries)
        ts = now_ts()
        payload_hash = canonical_hash(payload)
        entry_hash = _compute_entry_hash(
            step, ts, intent, payload_hash, self.last_hash
        )
        entry = LedgerEntry(
            step=step,
            timestamp=ts,
            intent=intent,
            payload=payload,
            payload_hash=payload_hash,
            previous_hash=self.last_hash,
            entry_hash=entry_hash,
        )
        self.entries.append(entry)
        self.last_hash = entry_hash
        return entry

    # ------------------------------------------------------------------
    # Integrity
    # ------------------------------------------------------------------

    def verify_chain(self) -> Tuple[bool, Optional[int]]:
        """
        Replay every entry hash.
        Returns (True, None) if chain is intact, else (False, first_bad_step).
        """
        prev_hash = self.GENESIS
        for entry in self.entries:
            if entry.previous_hash != prev_hash:
                return (False, entry.step)
            # Verify payload integrity: recompute hash from stored payload
            actual_payload_hash = canonical_hash(entry.payload)
            if actual_payload_hash != entry.payload_hash:
                return (False, entry.step)
            expected = _compute_entry_hash(
                entry.step,
                entry.timestamp,
                entry.intent,
                entry.payload_hash,
                entry.previous_hash,
            )
            if expected != entry.entry_hash:
                return (False, entry.step)
            prev_hash = entry.entry_hash
        return (True, None)

    def replay(self) -> bool:
        """Alias for verify_chain that returns a simple bool."""
        valid, _ = self.verify_chain()
        return valid

    # ------------------------------------------------------------------
    # Serialisation
    # ------------------------------------------------------------------

    def export_json(self) -> str:
        """Serialise ledger to a JSON string."""
        data = {
            "last_hash": self.last_hash,
            "entries": [e.to_dict() for e in self.entries],
        }
        return json.dumps(data, indent=2, default=str)

    def import_json(self, data: str) -> None:
        """
        Restore ledger from a JSON string.
        Raises ValueError if chain verification fails after import.
        """
        parsed = json.loads(data)
        self.entries = [LedgerEntry.from_dict(e) for e in parsed["entries"]]
        self.last_hash = parsed["last_hash"]
        valid, bad_step = self.verify_chain()
        if not valid:
            raise ValueError(
                f"Ledger chain integrity failure at step {bad_step} after import."
            )

    def __len__(self) -> int:
        return len(self.entries)

    def __getitem__(self, idx: int) -> LedgerEntry:
        return self.entries[idx]
