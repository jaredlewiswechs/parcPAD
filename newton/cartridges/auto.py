"""Auto cartridge — routes to the correct cartridge by keyword detection."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Type

from newton.cartridges.base import Cartridge
from newton.cartridges.visual import VisualCartridge
from newton.cartridges.sound import SoundCartridge
from newton.cartridges.sequence import SequenceCartridge
from newton.cartridges.data import DataCartridge
from newton.cartridges.rosetta import RosettaCartridge
from newton.ledger import Ledger

_REGISTRY: List[Type[Cartridge]] = [
    VisualCartridge,
    SoundCartridge,
    SequenceCartridge,
    DataCartridge,
    RosettaCartridge,
]


def auto_route(intent: str, ledger: Optional[Ledger] = None) -> Dict[str, Any]:
    """
    Detect the best cartridge for *intent* and run it.
    Falls back to RosettaCartridge if no keyword match is found.
    """
    for cls in _REGISTRY:
        if cls.matches(intent):
            return cls(ledger=ledger).run(intent)
    # Default fallback
    return RosettaCartridge(ledger=ledger).run(intent)


def list_cartridges() -> List[Dict[str, Any]]:
    """Return info about all registered cartridges."""
    return [
        {
            "name": cls.name,
            "trigger_keywords": cls.trigger_keywords,
        }
        for cls in _REGISTRY
    ]
