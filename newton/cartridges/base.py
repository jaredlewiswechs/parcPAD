"""Base cartridge class."""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from newton.kernel import Result, Witness, canonical_hash, now_ts
from newton.ledger import Ledger
from newton.verifier import Law, verify_transition


class Cartridge(ABC):
    """
    Base class for all Newton cartridges.
    Each cartridge takes an intent string and returns a verified spec.
    """

    name: str = "base"
    trigger_keywords: List[str] = []

    def __init__(self, ledger: Optional[Ledger] = None) -> None:
        self.ledger = ledger if ledger is not None else Ledger()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, intent: str) -> Dict[str, Any]:
        """
        Generate spec from intent, verify it, log to ledger.
        Returns a dict with keys: operation, spec, witness, ledger_step.
        """
        t0 = time.monotonic()
        spec = self.process(intent)
        witness = self.verify(spec)
        elapsed_us = int((time.monotonic() - t0) * 1_000_000)

        log_payload = {
            "operation": f"cartridge_{self.name}",
            "payload": {"intent_hash": canonical_hash(intent)},
            "result": witness.result.value,
            "metadata": {"elapsed_us": elapsed_us},
        }

        entry = None
        if witness.result == Result.FIN:
            entry = self.ledger.commit(
                intent=f"cartridge_{self.name}",
                payload=log_payload,
            )

        return {
            "operation": f"cartridge_{self.name}",
            "spec": spec,
            "witness": witness.to_dict(),
            "ledger_step": entry.step if entry else None,
        }

    # ------------------------------------------------------------------
    # Subclass interface
    # ------------------------------------------------------------------

    @abstractmethod
    def process(self, intent: str) -> Dict[str, Any]:
        """Generate a spec dict from an intent string."""
        ...

    def verify(self, spec: Dict[str, Any]) -> Witness:
        """
        Verify the generated spec. Subclasses can override with
        cartridge-specific laws. Default: spec must be non-empty.
        """
        laws: List[Law] = [
            Law(
                name="spec_non_empty",
                rule="required",
                description="Generated spec must have content.",
                field_f="spec_type",
            )
        ]
        return verify_transition(current={}, proposed=spec, laws=laws)

    # ------------------------------------------------------------------
    # Keyword routing
    # ------------------------------------------------------------------

    @classmethod
    def matches(cls, intent: str) -> bool:
        """Return True if *intent* contains any trigger keyword."""
        intent_lower = intent.lower()
        return any(kw in intent_lower for kw in cls.trigger_keywords)
