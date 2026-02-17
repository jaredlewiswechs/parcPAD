"""
Layer 0 — Kernel
Pure mathematical foundation: types, Bézier math, Ω test, hashing.
No dependencies on higher layers.
"""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Core enumerations
# ---------------------------------------------------------------------------

class Result(Enum):
    FIN = "fin"          # Admissible
    FINFR = "finfr"      # Forbidden
    PENDING = "pending"  # Not yet verified


# ---------------------------------------------------------------------------
# Geometric primitives
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Point:
    """A point in n-dimensional state space."""
    coords: Tuple[float, ...]

    def __getitem__(self, i: int) -> float:
        return self.coords[i]

    def __len__(self) -> int:
        return len(self.coords)

    def __repr__(self) -> str:  # pragma: no cover
        rounded = tuple(round(c, 6) for c in self.coords)
        return f"Point{rounded}"


@dataclass(frozen=True)
class BezierCurve:
    """
    Cubic Bézier: B(t) = (1-t)³P₀ + 3(1-t)²tH₁ + 3(1-t)t²H₂ + t³P₃

    P₀ = Root / kernel anchor  (immutable — INVARIANT 7)
    H₁ = Protection handle
    H₂ = Leverage handle
    P₃ = Terminus / commit point
    """
    p0: Point  # Root / kernel anchor
    h1: Point  # Protection handle
    h2: Point  # Leverage handle
    p3: Point  # Terminus / commit point

    def __post_init__(self) -> None:
        dims = {len(self.p0), len(self.h1), len(self.h2), len(self.p3)}
        if len(dims) != 1:
            raise ValueError("All Bézier control points must have the same dimensionality.")

    def evaluate(self, t: float) -> Point:
        """Evaluate curve at parameter t ∈ [0, 1]."""
        if not (0.0 <= t <= 1.0):
            raise ValueError(f"Parameter t={t} is outside [0, 1].")
        u = 1.0 - t
        coords = tuple(
            u ** 3 * self.p0[i]
            + 3 * u ** 2 * t * self.h1[i]
            + 3 * u * t ** 2 * self.h2[i]
            + t ** 3 * self.p3[i]
            for i in range(len(self.p0))
        )
        return Point(coords)

    def sample(self, n: int = 100) -> List[Point]:
        """Sample n+1 points along the curve (t = 0, 1/n, …, 1)."""
        return [self.evaluate(i / n) for i in range(n + 1)]


# ---------------------------------------------------------------------------
# Constraint system
# ---------------------------------------------------------------------------

@dataclass
class Constraint:
    """A single constraint g_i(x) ≤ 0."""
    name: str
    fn: Callable[[Point], float]
    description: str = ""


@dataclass
class Omega:
    """
    The admissible region Ω = {x : g_i(x) ≤ 0 for all constraints}.
    """
    constraints: List[Constraint]

    def test(self, point: Point) -> Tuple[Result, List[Dict[str, Any]]]:
        """Test if a point is in Ω. Returns (result, violations)."""
        violations: List[Dict[str, Any]] = []
        for c in self.constraints:
            val = c.fn(point)
            if val > 0:
                violations.append({
                    "constraint": c.name,
                    "value": val,
                    "description": c.description,
                })
        if violations:
            return (Result.FINFR, violations)
        return (Result.FIN, [])

    def test_curve(
        self, curve: BezierCurve, samples: int = 100
    ) -> Tuple[Result, List[Dict[str, Any]]]:
        """Test if the entire Bézier curve stays within Ω."""
        all_violations: List[Dict[str, Any]] = []
        for i, pt in enumerate(curve.sample(samples)):
            result, viols = self.test(pt)
            if result == Result.FINFR:
                for v in viols:
                    v["t"] = i / samples
                    v["point"] = pt.coords
                all_violations.extend(viols)
        if all_violations:
            return (Result.FINFR, all_violations)
        return (Result.FIN, [])


# ---------------------------------------------------------------------------
# Witness (proof artifact)
# ---------------------------------------------------------------------------

@dataclass
class Witness:
    """Proof artifact produced by a verification step."""
    result: Result
    timestamp: float
    state_hash: str
    violations: List[Dict[str, Any]]
    curve_samples: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "result": self.result.value,
            "timestamp": self.timestamp,
            "state_hash": self.state_hash,
            "violations": self.violations,
            "curve_samples": self.curve_samples,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Witness":
        return cls(
            result=Result(d["result"]),
            timestamp=d["timestamp"],
            state_hash=d["state_hash"],
            violations=d["violations"],
            curve_samples=d.get("curve_samples", 0),
        )


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def fg_ratio(f: float, g: float) -> Tuple[float, Result]:
    """
    Compute demand/capacity ratio.

    f = demand (numerator field)
    g = capacity (denominator field)
    Returns (ratio, result). ratio > 1.0 → FINFR.
    """
    if g <= 0:
        return (float("inf"), Result.FINFR)
    ratio = f / g
    if ratio > 1.0:
        return (ratio, Result.FINFR)
    return (ratio, Result.FIN)


def canonical_hash(obj: Any) -> str:
    """Deterministic SHA-256 hash (first 16 hex chars) of any JSON-serialisable object."""
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def now_ts() -> float:
    """Current wall-clock time as a float."""
    return time.time()
