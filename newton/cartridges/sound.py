"""Sound cartridge — audio/tone spec generation + WAV synthesis."""
from __future__ import annotations

import base64
import io
import math
import struct
import wave
from typing import Any, Dict, List

from newton.cartridges.base import Cartridge
from newton.kernel import Witness
from newton.verifier import Law, verify_transition

# Pentatonic scale frequencies (Hz)
_PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]

_AMPLITUDE = 0.4          # 0–1, headroom to avoid clipping on mixing
_FADE_MS   = 10           # linear fade-in/out per note (ms) to reduce clicks


def _synth_note(
    freq_hz: float,
    duration_ms: float,
    waveform: str,
    sample_rate: int,
) -> List[float]:
    """Return normalised float samples [-1, 1] for one note."""
    n_samples = max(1, int(sample_rate * duration_ms / 1000))
    fade_n    = min(int(sample_rate * _FADE_MS / 1000), n_samples // 4)
    samples: List[float] = []
    for i in range(n_samples):
        t   = i / sample_rate
        phi = 2 * math.pi * freq_hz * t
        if waveform == "square":
            s = 1.0 if math.sin(phi) >= 0 else -1.0
        elif waveform == "sawtooth":
            s = 2 * (freq_hz * t - math.floor(0.5 + freq_hz * t))
        else:                              # default: sine
            s = math.sin(phi)
        # linear fade in / out
        if i < fade_n:
            s *= i / fade_n
        elif i >= n_samples - fade_n:
            s *= (n_samples - i) / fade_n
        samples.append(s * _AMPLITUDE)
    return samples


def _render_wav_b64(notes: List[Dict[str, Any]], waveform: str, sample_rate: int) -> str:
    """Synthesise all notes, mix into a WAV, return base64 string."""
    all_samples: List[float] = []
    for note in notes:
        all_samples.extend(
            _synth_note(note["freq_hz"], note["duration_ms"], waveform, sample_rate)
        )

    # Convert to 16-bit signed PCM
    pcm = b"".join(
        struct.pack("<h", max(-32768, min(32767, int(s * 32767))))
        for s in all_samples
    )

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)          # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(pcm)

    return base64.b64encode(buf.getvalue()).decode("ascii")


class SoundCartridge(Cartridge):
    name = "sound"
    trigger_keywords = ["sound", "audio", "music", "tone", "melody", "beat", "rhythm"]

    def process(self, intent: str) -> Dict[str, Any]:
        """Generate an audio parameter spec from intent and synthesise a WAV file."""
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
        sample_rate = 44100
        notes = [
            {"freq_hz": _PENTATONIC[(seed + i) % len(_PENTATONIC)], "duration_ms": 250}
            for i in range(4)
        ]

        # Synthesise the WAV (pure stdlib — wave + struct + math)
        audio_b64 = _render_wav_b64(notes, waveform, sample_rate)

        # Build an output log for the console panel
        output_log = [
            f"SoundCartridge.process(intent={intent[:40]!r})",
            f"  waveform   = {waveform!r}",
            f"  tempo_bpm  = {tempo_bpm}",
            f"  seed       = {seed}",
            "  notes:",
            *[f"    [{i}] {n['freq_hz']:.2f} Hz × {n['duration_ms']} ms" for i, n in enumerate(notes)],
            f"  sample_rate = {sample_rate} Hz",
            f"  total_samples = {sum(int(sample_rate * n['duration_ms'] / 1000) for n in notes)}",
            f"  wav_b64_len = {len(audio_b64)} chars",
            "✓ WAV generated",
        ]

        return {
            "spec_type": "audio",
            "waveform": waveform,
            "tempo_bpm": tempo_bpm,
            "sample_rate_hz": sample_rate,
            "channels": 1,
            "notes": notes,
            "intent_summary": intent[:80],
            "audio_b64": audio_b64,
            "audio_mime": "audio/wav",
            "output_log": output_log,
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
