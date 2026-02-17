"""
Layer 5 — CMFK
Cognitive shape vector for diagnosing understanding.
Depends on: kernel types only.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# CMFK Vector
# ---------------------------------------------------------------------------

@dataclass
class CMFKVector:
    """
    4-dimensional cognitive shape vector.
    All values ∈ [0, 1].
    """
    c: float  # Correctness    — how correct the statement is
    m: float  # Misconception  — strength of misconception
    f: float  # Fog            — how unclear/ambiguous
    k: float  # Knowingness    — how confident the user seems

    def __post_init__(self) -> None:
        for name, val in [("c", self.c), ("m", self.m), ("f", self.f), ("k", self.k)]:
            if not (0.0 <= val <= 1.0):
                raise ValueError(f"CMFK.{name}={val} out of [0, 1].")

    def shape(self) -> str:
        """Human-readable cognitive shape diagnosis."""
        if self.c > 0.8 and self.m < 0.2 and self.f < 0.2:
            return "CLEAR"          # Knows it, says it right
        if self.m > 0.5:
            return "MISCONCEPTION"  # Confidently wrong
        if self.f > 0.5:
            return "FOG"            # Uncertain, needs scaffolding
        if self.k > 0.8 and self.c < 0.5:
            return "OVERCONFIDENT"  # Thinks they know, don't
        return "DEVELOPING"

    def to_dict(self) -> Dict[str, float]:
        return {"c": self.c, "m": self.m, "f": self.f, "k": self.k}

    @classmethod
    def from_dict(cls, d: Dict[str, float]) -> "CMFKVector":
        return cls(c=d["c"], m=d["m"], f=d["f"], k=d["k"])


# ---------------------------------------------------------------------------
# Heuristic parser
# ---------------------------------------------------------------------------

# Signals that hint at fog / uncertainty
_FOG_SIGNALS = re.compile(
    r"\b(not sure|unclear|confused|maybe|perhaps|i think|i guess|"
    r"kind of|sort of|i don't know|don't understand|what is|how does|"
    r"can you explain|help me|what does)\b",
    re.I,
)

# Signals that hint at misconception (asserting something typically wrong)
_MISCONCEPTION_SIGNALS = re.compile(
    r"\b(always|never|everyone knows|obviously|definitely|"
    r"certainly|must be|has to be|proves that|is definitely|"
    r"i know that|it's a fact)\b",
    re.I,
)

# Signals of correctness (hedged, empirical language)
_CORRECTNESS_SIGNALS = re.compile(
    r"\b(research shows|studies indicate|evidence suggests|"
    r"according to|it is known|data shows|proven|empirically|"
    r"in general|typically|usually|often)\b",
    re.I,
)

# Knowingness signals (assertive / confident language)
_KNOWINGNESS_SIGNALS = re.compile(
    r"\b(i know|i am sure|i'm certain|i believe|i understand|"
    r"clearly|obviously|of course|it is clear that)\b",
    re.I,
)


def parse_cmfk(text: str) -> CMFKVector:
    """
    Heuristically estimate a CMFK vector from free-form *text*.

    Scoring:
    - Each matched signal type increments a raw score.
    - Scores are normalised to [0, 1] using a sigmoid-like cap.
    """
    text_lower = text.lower()
    word_count = max(len(text_lower.split()), 1)

    fog_hits = len(_FOG_SIGNALS.findall(text_lower))
    misc_hits = len(_MISCONCEPTION_SIGNALS.findall(text_lower))
    corr_hits = len(_CORRECTNESS_SIGNALS.findall(text_lower))
    know_hits = len(_KNOWINGNESS_SIGNALS.findall(text_lower))

    def norm(hits: int) -> float:
        # Soft cap: each hit contributes ~0.2, capped at 1.0
        return min(hits * 0.2, 1.0)

    f = norm(fog_hits)
    m = norm(misc_hits)
    c = norm(corr_hits)
    k = norm(know_hits)

    # Correctness gets a baseline boost for short, factual-looking statements
    if corr_hits == 0 and fog_hits == 0 and misc_hits == 0 and word_count <= 10:
        c = 0.5  # neutral baseline

    return CMFKVector(c=c, m=m, f=f, k=k)


# ---------------------------------------------------------------------------
# BILL teaching sequence
# ---------------------------------------------------------------------------

@dataclass
class BILLDiagnosis:
    """Full diagnostic result for the BILL teaching pipeline."""
    vector: CMFKVector
    shape: str
    steps: List[str]   # Ordered teaching actions


def bill_diagnose(text: str) -> BILLDiagnosis:
    """
    BILL Protocol:
    1. Parse → CMFK vector
    2. Interpret → shape
    3. Correct → gently fix misconceptions
    4. Clarify → reduce fog
    5. Stabilize → build confidence last
    """
    vector = parse_cmfk(text)
    shape = vector.shape()

    steps: List[str] = ["Parse: CMFK vector computed."]

    if shape == "CLEAR":
        steps.append("Interpret: Learner demonstrates solid understanding.")
        steps.append("Stabilize: Reinforce and extend the concept.")

    elif shape == "MISCONCEPTION":
        steps.append("Interpret: Strong misconception detected.")
        steps.append(
            "Correct: Gently surface the conflicting evidence without judgment."
        )
        steps.append("Clarify: Provide a concrete counter-example.")
        steps.append("Stabilize: Rebuild the correct mental model step by step.")

    elif shape == "FOG":
        steps.append("Interpret: Learner is uncertain — scaffolding needed.")
        steps.append("Clarify: Break the concept into smaller, named pieces.")
        steps.append("Correct: Address any partial errors encountered.")
        steps.append("Stabilize: Confirm understanding with a simple check question.")

    elif shape == "OVERCONFIDENT":
        steps.append("Interpret: Learner is confident but likely incorrect.")
        steps.append(
            "Correct: Introduce a thought experiment to surface the gap."
        )
        steps.append("Clarify: Show the standard framing with evidence.")
        steps.append("Stabilize: Acknowledge partial knowledge; build from there.")

    else:  # DEVELOPING
        steps.append("Interpret: Learner is building understanding.")
        steps.append("Clarify: Add structure — definitions, examples, analogies.")
        steps.append("Stabilize: Encourage and check understanding.")

    return BILLDiagnosis(vector=vector, shape=shape, steps=steps)
