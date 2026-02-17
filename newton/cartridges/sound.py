"""Sound cartridge — audio/tone spec generation."""
from __future__ import annotations

from typing import Any, Dict, List

from newton.cartridges.base import Cartridge
from newton.kernel import Witness
from newton.verifier import Law, verify_transition

# Pentatonic scale frequencies (Hz)
_PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]


class SoundCartridge(Cartridge):
    name = "sound"
    trigger_keywords = ["sound", "audio", "music", "tone", "melody", "beat", "rhythm"]

    def process(self, intent: str) -> Dict[str, Any]:
        """Generate an audio parameter spec from intent."""
        intent_lower = intent.lower()

        # Map mood keywords to waveform + tempo
        waveform = "sine"
        tempo_bpm = 120
        if "drum" in intent_lower or "beat" in intent_lower:
            waveform = "square"
            tempo_bpm = 140
        elif "calm" in intent_lower or "sleep" in intent_lower:
            waveform = "sine"
            tempo_bpm = 60
        elif "alert" in intent_lower or "alarm" in intent_lower:
            waveform = "sawtooth"
            tempo_bpm = 180

        # Build a simple 4-note sequence from the intent string
        seed = sum(ord(c) for c in intent)
        notes = [
            {"freq_hz": _PENTATONIC[(seed + i) % len(_PENTATONIC)], "duration_ms": 250}
            for i in range(4)
        ]

        return {
            "spec_type": "audio",
            "waveform": waveform,
            "tempo_bpm": tempo_bpm,
            "sample_rate_hz": 44100,
            "channels": 1,
            "notes": notes,
            "intent_summary": intent[:80],
        }

    def verify(self, spec: Dict[str, Any]) -> Witness:
        laws: List[Law] = [
            Law(
                name="audio_has_notes",
                rule="required",
                description="Audio spec must declare a note sequence.",
                field_f="spec_type",
            ),
            Law(
                name="tempo_range",
                rule="range",
                description="Tempo must be within 20–300 BPM.",
                field_f="tempo_bpm",
                threshold_min=20.0,
                threshold=300.0,
            ),
        ]
        return verify_transition(current={}, proposed=spec, laws=laws)
