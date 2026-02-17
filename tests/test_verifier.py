"""Tests for newton.verifier (Layer 2)."""
import pytest

from newton.kernel import (
    BezierCurve, Constraint, Omega, Point, Result,
)
from newton.ledger import Ledger
from newton.verifier import Law, verify, verify_trajectory, verify_transition, verified_commit


class TestVerify:
    def _box_omega(self):
        return Omega(constraints=[
            Constraint(name="upper", fn=lambda p: p[0] - 1.0),
            Constraint(name="lower", fn=lambda p: -p[0]),
        ])

    def test_state_inside_omega(self):
        omega = self._box_omega()
        w = verify({"x": 0.5}, omega)
        assert w.result == Result.FIN
        assert w.violations == []

    def test_state_outside_omega(self):
        omega = self._box_omega()
        w = verify({"x": 1.5}, omega)
        assert w.result == Result.FINFR

    def test_non_numeric_state(self):
        omega = Omega(constraints=[])
        w = verify({"text": "hello"}, omega)
        assert w.result == Result.FIN  # no numeric dims → no violations

    def test_state_hash_deterministic(self):
        omega = Omega(constraints=[])
        w1 = verify({"x": 1}, omega)
        w2 = verify({"x": 1}, omega)
        assert w1.state_hash == w2.state_hash


class TestVerifyTrajectory:
    def _box_omega(self, lo=0.0, hi=1.0):
        return Omega(constraints=[
            Constraint(name="upper", fn=lambda p: p[0] - hi),
            Constraint(name="lower", fn=lambda p: lo - p[0]),
        ])

    def test_curve_inside(self):
        omega = self._box_omega()
        c = BezierCurve(
            p0=Point((0.1,)), h1=Point((0.3,)),
            h2=Point((0.7,)), p3=Point((0.9,)),
        )
        w = verify_trajectory(c, omega)
        assert w.result == Result.FIN

    def test_curve_outside(self):
        omega = self._box_omega(lo=0.0, hi=0.5)
        c = BezierCurve(
            p0=Point((0.0,)), h1=Point((0.5,)),
            h2=Point((1.0,)), p3=Point((1.2,)),
        )
        w = verify_trajectory(c, omega)
        assert w.result == Result.FINFR
        assert w.curve_samples == 100


class TestLaws:
    def test_ratio_le_fin(self):
        law = Law(name="debt_cap", rule="ratio_le", description="debt/assets ≤ 1",
                  field_f="debt", field_g="assets", threshold=1.0)
        w = verify_transition({}, {"debt": 0.5, "assets": 1.0}, [law])
        assert w.result == Result.FIN

    def test_ratio_le_finfr(self):
        law = Law(name="debt_cap", rule="ratio_le", description="debt/assets ≤ 1",
                  field_f="debt", field_g="assets", threshold=1.0)
        w = verify_transition({}, {"debt": 1.5, "assets": 1.0}, [law])
        assert w.result == Result.FINFR
        assert any("debt_cap" in v.get("law", "") for v in w.violations)

    def test_range_fin(self):
        law = Law(name="temp_range", rule="range", description="temp in [0,100]",
                  field_f="temp", threshold_min=0.0, threshold=100.0)
        w = verify_transition({}, {"temp": 37.0}, [law])
        assert w.result == Result.FIN

    def test_range_finfr(self):
        law = Law(name="temp_range", rule="range", description="temp in [0,100]",
                  field_f="temp", threshold_min=0.0, threshold=100.0)
        w = verify_transition({}, {"temp": 150.0}, [law])
        assert w.result == Result.FINFR

    def test_required_present(self):
        law = Law(name="name_required", rule="required", description="name must exist",
                  field_f="name")
        w = verify_transition({}, {"name": "Alice"}, [law])
        assert w.result == Result.FIN

    def test_required_missing(self):
        law = Law(name="name_required", rule="required", description="name must exist",
                  field_f="name")
        w = verify_transition({}, {}, [law])
        assert w.result == Result.FINFR

    def test_forbidden_content_clean(self):
        law = Law(name="no_bad", rule="forbidden_content", description="no bad words",
                  field_f="text", patterns=["badword"])
        w = verify_transition({}, {"text": "Hello world"}, [law])
        assert w.result == Result.FIN

    def test_forbidden_content_violation(self):
        law = Law(name="no_bad", rule="forbidden_content", description="no bad words",
                  field_f="text", patterns=["badword"])
        w = verify_transition({}, {"text": "Hello badword here"}, [law])
        assert w.result == Result.FINFR


class TestVerifiedCommit:
    def test_fin_commits(self):
        ledger = Ledger()
        law = Law(name="req", rule="required", description="x needed", field_f="x")
        w = verified_commit(ledger, "test", {"x": 1}, [law])
        assert w.result == Result.FIN
        assert len(ledger) == 1

    def test_finfr_no_commit(self):
        ledger = Ledger()
        law = Law(name="req", rule="required", description="x needed", field_f="x")
        w = verified_commit(ledger, "test", {}, [law])
        assert w.result == Result.FINFR
        assert len(ledger) == 0  # INVARIANT 3: no finfr persists
