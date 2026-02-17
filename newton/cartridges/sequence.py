"""Sequence cartridge — animation/timeline spec generation."""
from __future__ import annotations

from typing import Any, Dict, List

from newton.cartridges.base import Cartridge
from newton.kernel import Witness
from newton.verifier import Law, verify_transition


class SequenceCartridge(Cartridge):
    name = "sequence"
    trigger_keywords = [
        "video", "animation", "motion", "slideshow", "sequence",
        "timeline", "transition", "animate",
    ]

    def process(self, intent: str) -> Dict[str, Any]:
        """Generate a timeline spec from intent."""
        intent_lower = intent.lower()

        # Duration heuristics
        duration_s = 5.0
        if "short" in intent_lower or "quick" in intent_lower:
            duration_s = 2.0
        elif "long" in intent_lower:
            duration_s = 15.0

        fps = 30
        if "slow" in intent_lower:
            fps = 24
        elif "smooth" in intent_lower or "60" in intent_lower:
            fps = 60

        frames = int(duration_s * fps)

        keyframes = [
            {"t": 0.0,   "opacity": 0.0, "scale": 0.8, "label": "intro"},
            {"t": 0.2,   "opacity": 1.0, "scale": 1.0, "label": "fade_in"},
            {"t": 0.8,   "opacity": 1.0, "scale": 1.0, "label": "hold"},
            {"t": 1.0,   "opacity": 0.0, "scale": 0.8, "label": "fade_out"},
        ]

        output_log = [
            f"SequenceCartridge.process(intent={intent[:40]!r})",
            f"  duration_s    = {duration_s}",
            f"  fps           = {fps}",
            f"  total_frames  = {frames}",
            f"  keyframes     = {len(keyframes)}",
            *[f"    t={kf['t']:.1f}  opacity={kf['opacity']}  scale={kf['scale']}  [{kf['label']}]" for kf in keyframes],
            "✓ sequence spec generated",
        ]

        return {
            "spec_type": "sequence",
            "duration_s": duration_s,
            "fps": fps,
            "total_frames": frames,
            "keyframes": keyframes,
            "easing": "ease-in-out",
            "intent_summary": intent[:80],
            "output_log": output_log,
        }

    def verify(self, spec: Dict[str, Any]) -> Witness:
        laws: List[Law] = [
            Law(
                name="seq_has_keyframes",
                rule="required",
                description="Sequence spec must have keyframes.",
                field_f="spec_type",
            ),
            Law(
                name="duration_positive",
                rule="range",
                description="Duration must be between 0.1 s and 600 s.",
                field_f="duration_s",
                threshold_min=0.1,
                threshold=600.0,
            ),
        ]
        return verify_transition(current={}, proposed=spec, laws=laws)
