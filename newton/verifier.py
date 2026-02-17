"""
Layer 2 — Verifier
The Newton Law Gate. Verifies states and trajectories against Ω.
Depends on: kernel, ledger.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from newton.kernel import (
    BezierCurve,
    Constraint,
    Omega,
    Point,
    Result,
    Witness,
    canonical_hash,
    fg_ratio,
    now_ts,
)
from newton.ledger import Ledger


# ---------------------------------------------------------------------------
# Law system
# ---------------------------------------------------------------------------

@dataclass
class Law:
    """
    A constraint that must hold. Violation → finfr.

    rule types:
    - "ratio_le"         : field_f / field_g ≤ threshold
    - "range"            : threshold_min ≤ field ≤ threshold (threshold = max)
    - "required"         : field must exist and be truthy
    - "forbidden_content": text field must not contain any of patterns
    - "audience_safe"    : content appropriate for audience age  (advisory)
    - "factual_only"     : no unverifiable claims                (advisory)
    """
    name: str
    rule: str
    description: str
    threshold: float = 0.0
    threshold_min: float = 0.0
    field_f: str = ""       # numerator field for ratio laws / primary field
    field_g: str = ""       # denominator field for ratio laws
    patterns: List[str] = field(default_factory=list)  # for forbidden_content


# ---------------------------------------------------------------------------
# Core verification functions
# ---------------------------------------------------------------------------

def verify(state: Dict[str, Any], omega: Omega) -> Witness:
    """Verify a state dict against Omega. Converts dict values to a Point."""
    numeric_values = [
        float(v) for v in state.values() if isinstance(v, (int, float))
    ]
    if numeric_values:
        pt = Point(tuple(numeric_values))
        result, violations = omega.test(pt)
    else:
        result, violations = Result.FIN, []

    return Witness(
        result=result,
        timestamp=now_ts(),
        state_hash=canonical_hash(state),
        violations=violations,
        curve_samples=0,
    )


def verify_trajectory(
    curve: BezierCurve, omega: Omega, samples: int = 100
) -> Witness:
    """Verify an entire Bézier trajectory against Omega."""
    result, violations = omega.test_curve(curve, samples)
    state = {
        "p0": curve.p0.coords,
        "p3": curve.p3.coords,
    }
    return Witness(
        result=result,
        timestamp=now_ts(),
        state_hash=canonical_hash(state),
        violations=violations,
        curve_samples=samples,
    )


def verify_transition(
    current: Dict[str, Any],
    proposed: Dict[str, Any],
    laws: List[Law],
) -> Witness:
    """
    Verify a state transition from *current* to *proposed* against a list of Laws.
    The proposed state is checked; violations are collected across all laws.
    """
    violations: List[Dict[str, Any]] = []

    for law in laws:
        v = _check_law(proposed, law)
        if v:
            violations.append(v)

    result = Result.FINFR if violations else Result.FIN
    return Witness(
        result=result,
        timestamp=now_ts(),
        state_hash=canonical_hash(proposed),
        violations=violations,
        curve_samples=0,
    )


# ---------------------------------------------------------------------------
# Law evaluation
# ---------------------------------------------------------------------------

def _check_law(state: Dict[str, Any], law: Law) -> Optional[Dict[str, Any]]:
    """
    Evaluate a single law against *state*.
    Returns a violation dict if violated, else None.
    """
    try:
        if law.rule == "ratio_le":
            f_val = float(state.get(law.field_f, 0))
            g_val = float(state.get(law.field_g, 0))
            ratio, res = fg_ratio(f_val, g_val)
            effective_threshold = law.threshold if law.threshold > 0 else 1.0
            if ratio > effective_threshold:
                return {
                    "law": law.name,
                    "rule": law.rule,
                    "value": ratio,
                    "threshold": effective_threshold,
                    "description": law.description,
                }

        elif law.rule == "range":
            val = float(state.get(law.field_f, 0))
            if not (law.threshold_min <= val <= law.threshold):
                return {
                    "law": law.name,
                    "rule": law.rule,
                    "value": val,
                    "range": [law.threshold_min, law.threshold],
                    "description": law.description,
                }

        elif law.rule == "required":
            val = state.get(law.field_f)
            if not val and val != 0:
                return {
                    "law": law.name,
                    "rule": law.rule,
                    "field": law.field_f,
                    "description": law.description,
                }

        elif law.rule == "forbidden_content":
            text = str(state.get(law.field_f, "")).lower()
            for pattern in law.patterns:
                if pattern.lower() in text:
                    return {
                        "law": law.name,
                        "rule": law.rule,
                        "matched_pattern": pattern,
                        "description": law.description,
                    }

        elif law.rule in ("audience_safe", "factual_only"):
            # Advisory laws — always pass in this implementation.
            # Subclasses / cartridges can override.
            pass

    except (TypeError, ValueError) as exc:
        return {
            "law": law.name,
            "rule": law.rule,
            "error": str(exc),
            "description": law.description,
        }

    return None


# ---------------------------------------------------------------------------
# Verified commit helper
# ---------------------------------------------------------------------------

def verified_commit(
    ledger: Ledger,
    intent: str,
    proposed: Dict[str, Any],
    laws: List[Law],
    current: Optional[Dict[str, Any]] = None,
) -> Witness:
    """
    Verify *proposed* against *laws*, and only commit to *ledger* if FIN.
    Returns the witness (committed or not).
    INVARIANT 2: No commit without ledger entry.
    INVARIANT 3: No finfr state persists.
    """
    if current is None:
        current = {}
    witness = verify_transition(current, proposed, laws)
    if witness.result == Result.FIN:
        ledger.commit(intent, {**proposed, "witness": witness.to_dict()})
    return witness
