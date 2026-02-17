"""
Cards, Stacks, Flows — HyperSchool data model.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from newton.cmfk import CMFKVector


@dataclass
class Card:
    """Atomic unit of educational content."""
    id: str
    title: str
    content: str                  # Markdown or rich content
    card_type: str                # "text", "quiz", "interactive", "video", "discussion"
    metadata: Dict[str, Any] = field(default_factory=dict)
    cmfk_target: Optional[CMFKVector] = None  # Expected understanding after this card

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "card_type": self.card_type,
            "metadata": self.metadata,
            "cmfk_target": self.cmfk_target.to_dict() if self.cmfk_target else None,
        }


@dataclass
class Flow:
    """Dynamic pathway rules (HyperLingo-driven)."""
    rules: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {"rules": self.rules}


@dataclass
class Stack:
    """Collection of Cards forming a lesson or module."""
    id: str
    title: str
    cards: List[Card] = field(default_factory=list)
    flow: Optional[Flow] = None
    teks_alignment: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "cards": [c.to_dict() for c in self.cards],
            "flow": self.flow.to_dict() if self.flow else None,
            "teks_alignment": self.teks_alignment,
        }

    def card_count(self) -> int:
        return len(self.cards)
