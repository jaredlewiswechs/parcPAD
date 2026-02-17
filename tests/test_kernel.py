"""Tests for newton.kernel (Layer 0)."""
import math
import pytest

from newton.kernel import (
    BezierCurve, Constraint, Omega, Point, Result, Witness,
    canonical_hash, fg_ratio, now_ts,
)


# ---------------------------------------------------------------------------
# Point
# ---------------------------------------------------------------------------

class TestPoint:
    def test_coords(self):
        p = Point((1.0, 2.0, 3.0))
        assert p[0] == 1.0
        assert p[1] == 2.0
        assert len(p) == 3

    def test_frozen(self):
        p = Point((1.0,))
        with pytest.raises((AttributeError, TypeError)):
            p.coords = (2.0,)  # type: ignore


# ---------------------------------------------------------------------------
# BezierCurve
# ---------------------------------------------------------------------------

class TestBezierCurve:
    def _unit_curve(self):
        return BezierCurve(
            p0=Point((0.0,)),
            h1=Point((0.33,)),
            h2=Point((0.66,)),
            p3=Point((1.0,)),
        )

    def test_endpoints(self):
        c = self._unit_curve()
        assert c.evaluate(0.0).coords == pytest.approx((0.0,))
        assert c.evaluate(1.0).coords == pytest.approx((1.0,))

    def test_midpoint(self):
        c = self._unit_curve()
        mid = c.evaluate(0.5)
        assert 0.4 < mid[0] < 0.6

    def test_sample_length(self):
        c = self._unit_curve()
        pts = c.sample(50)
        assert len(pts) == 51  # 0..50

    def test_dim_mismatch_raises(self):
        with pytest.raises(ValueError):
            BezierCurve(
                p0=Point((0.0, 0.0)),
                h1=Point((0.5,)),
                h2=Point((0.5,)),
                p3=Point((1.0,)),
            )

    def test_t_out_of_range(self):
        c = self._unit_curve()
        with pytest.raises(ValueError):
            c.evaluate(1.5)

    def test_p0_is_stable(self):
        """INVARIANT 7: P₀ never moves."""
        c = self._unit_curve()
        assert c.p0 == Point((0.0,))
        assert c.evaluate(0.0) == c.p0


# ---------------------------------------------------------------------------
# Omega
# ---------------------------------------------------------------------------

class TestOmega:
    def _box_omega(self, lo=0.0, hi=1.0):
        """Ω = {x : lo ≤ x[0] ≤ hi}."""
        return Omega(constraints=[
            Constraint(name="lower_bound", fn=lambda p: lo - p[0], description="x ≥ lo"),
            Constraint(name="upper_bound", fn=lambda p: p[0] - hi, description="x ≤ hi"),
        ])

    def test_point_inside(self):
        omega = self._box_omega()
        result, viols = omega.test(Point((0.5,)))
        assert result == Result.FIN
        assert viols == []

    def test_point_outside(self):
        omega = self._box_omega()
        result, viols = omega.test(Point((1.5,)))
        assert result == Result.FINFR
        assert len(viols) > 0

    def test_curve_inside(self):
        omega = self._box_omega()
        c = BezierCurve(
            p0=Point((0.0,)), h1=Point((0.25,)),
            h2=Point((0.75,)), p3=Point((1.0,)),
        )
        result, _ = omega.test_curve(c)
        assert result == Result.FIN

    def test_curve_partly_outside(self):
        omega = self._box_omega(lo=0.0, hi=0.8)
        c = BezierCurve(
            p0=Point((0.0,)), h1=Point((0.5,)),
            h2=Point((1.0,)), p3=Point((1.2,)),
        )
        result, viols = omega.test_curve(c)
        assert result == Result.FINFR
        assert any("t" in v for v in viols)


# ---------------------------------------------------------------------------
# f/g ratio
# ---------------------------------------------------------------------------

class TestFGRatio:
    def test_fin(self):
        ratio, result = fg_ratio(0.5, 1.0)
        assert result == Result.FIN
        assert ratio == pytest.approx(0.5)

    def test_finfr(self):
        ratio, result = fg_ratio(1.5, 1.0)
        assert result == Result.FINFR
        assert ratio == pytest.approx(1.5)

    def test_zero_capacity(self):
        ratio, result = fg_ratio(1.0, 0.0)
        assert result == Result.FINFR
        assert ratio == float("inf")

    def test_negative_capacity(self):
        _, result = fg_ratio(1.0, -1.0)
        assert result == Result.FINFR

    def test_exact_one(self):
        ratio, result = fg_ratio(1.0, 1.0)
        assert result == Result.FIN  # exactly 1.0 is admissible


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------

class TestCanonicalHash:
    def test_deterministic(self):
        h1 = canonical_hash({"a": 1, "b": [2, 3]})
        h2 = canonical_hash({"a": 1, "b": [2, 3]})
        assert h1 == h2

    def test_different_data(self):
        h1 = canonical_hash({"a": 1})
        h2 = canonical_hash({"a": 2})
        assert h1 != h2

    def test_key_order_independence(self):
        h1 = canonical_hash({"a": 1, "b": 2})
        h2 = canonical_hash({"b": 2, "a": 1})
        assert h1 == h2

    def test_length(self):
        h = canonical_hash("test")
        assert len(h) == 16


# ---------------------------------------------------------------------------
# Witness
# ---------------------------------------------------------------------------

class TestWitness:
    def test_round_trip(self):
        w = Witness(
            result=Result.FIN,
            timestamp=1.0,
            state_hash="abc",
            violations=[],
            curve_samples=100,
        )
        d = w.to_dict()
        w2 = Witness.from_dict(d)
        assert w2.result == Result.FIN
        assert w2.state_hash == "abc"
        assert w2.curve_samples == 100
