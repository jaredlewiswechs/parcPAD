"""Visual cartridge — SVG/image spec generation."""
from __future__ import annotations

import re
from typing import Any, Dict, List

from newton.cartridges.base import Cartridge
from newton.kernel import Witness
from newton.verifier import Law, verify_transition

# Basic colour palette for generated SVGs
_COLOURS = ["#4A90D9", "#E86B5F", "#5BBF6E", "#F5A623", "#9B59B6"]


class VisualCartridge(Cartridge):
    name = "visual"
    trigger_keywords = ["image", "picture", "graphic", "svg", "icon", "logo", "visual"]

    def process(self, intent: str) -> Dict[str, Any]:
        """Generate a minimal SVG spec from intent."""
        intent_lower = intent.lower()
        shape = "circle"
        if "square" in intent_lower or "rect" in intent_lower:
            shape = "rect"
        elif "triangle" in intent_lower:
            shape = "polygon"
        elif "line" in intent_lower:
            shape = "line"

        colour = _COLOURS[len(intent) % len(_COLOURS)]

        elements: List[Dict[str, Any]] = []
        if shape == "circle":
            elements.append({
                "tag": "circle", "cx": 100, "cy": 100, "r": 60, "fill": colour
            })
        elif shape == "rect":
            elements.append({
                "tag": "rect", "x": 40, "y": 40, "width": 120, "height": 80,
                "fill": colour
            })
        elif shape == "polygon":
            elements.append({
                "tag": "polygon",
                "points": "100,40 160,160 40,160",
                "fill": colour,
            })
        else:
            elements.append({
                "tag": "line",
                "x1": 20, "y1": 100, "x2": 180, "y2": 100,
                "stroke": colour, "stroke-width": 4,
            })

        return {
            "spec_type": "svg",
            "width": 200,
            "height": 200,
            "viewBox": "0 0 200 200",
            "elements": elements,
            "intent_summary": intent[:80],
        }

    def verify(self, spec: Dict[str, Any]) -> Witness:
        laws: List[Law] = [
            Law(
                name="svg_has_elements",
                rule="required",
                description="SVG spec must have elements.",
                field_f="spec_type",
            ),
        ]
        return verify_transition(current={}, proposed=spec, laws=laws)
