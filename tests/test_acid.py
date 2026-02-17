"""
Full ACID + Newton compliance suite.

ACID properties:
  A — Atomicity
  C — Consistency
  I — Isolation
  D — Durability

Newton invariants (10):
  1.  Atomicity
  2.  Consistency
  3.  Isolation
  4.  Durability
  5.  Determinism
  6.  Boundary
  7.  Diffability
  8.  Reversibility
  9.  Phase Loop
  10. 1==1 Invariant
  +   Ledger chain integrity
"""
import pytest

from newton.kernel import (
    BezierCurve, Constraint, Omega, Point, Result,
    canonical_hash, fg_ratio,
)
from newton.ledger import Ledger
from newton.tlm import TinyLM
from newton.verifier import Law, verify_transition, verified_commit


# ===========================================================================
# ACID Tests
# ===========================================================================

class TestACID:
    # -----------------------------------------------------------------------
    # A — Atomicity
    # -----------------------------------------------------------------------
    def test_atomicity_empty_ingest(self):
        """Empty/failed ingest → zero state change."""
        tlm = TinyLM()
        before_hash = tlm.state_hash()
        tlm.process("")
        after_hash = tlm.state_hash()
        assert before_hash == after_hash, "State changed on empty ingest."

    def test_atomicity_finfr_no_persist(self):
        """A finfr state must not be committed to the ledger."""
        ledger = Ledger()
        law = Law(name="req", rule="required", description="x must exist", field_f="x")
        w = verified_commit(ledger, "bad_op", proposed={}, laws=[law])
        assert w.result == Result.FINFR
        assert len(ledger) == 0, "finfr state was persisted."

    # -----------------------------------------------------------------------
    # C — Consistency
    # -----------------------------------------------------------------------
    def test_consistency_same_hash(self):
        """Same input → same hash, always."""
        payload = {"a": 1, "b": [2, 3], "c": {"d": "e"}}
        h1 = canonical_hash(payload)
        h2 = canonical_hash(payload)
        assert h1 == h2

    def test_consistency_ledger_chain(self):
        """Ledger chain remains valid after multiple commits."""
        ledger = Ledger()
        for i in range(10):
            law = Law(name="req", rule="required", description="v", field_f="v")
            verified_commit(ledger, f"op_{i}", {"v": i}, [law])
        valid, bad = ledger.verify_chain()
        assert valid is True
        assert bad is None

    # -----------------------------------------------------------------------
    # I — Isolation
    # -----------------------------------------------------------------------
    def test_isolation_separate_instances(self):
        """Separate TinyLM instances don't share state."""
        tlm1, tlm2 = TinyLM(), TinyLM()
        tlm1.process("model 1 data")
        assert tlm2.graph.node_count() == 0, "Instance isolation violated."

    def test_isolation_separate_ledgers(self):
        """Separate Ledger instances don't share entries."""
        l1, l2 = Ledger(), Ledger()
        l1.commit("op", {"a": 1})
        assert len(l2) == 0

    # -----------------------------------------------------------------------
    # D — Durability
    # -----------------------------------------------------------------------
    def test_durability_export_replay(self):
        """Export/replay preserves state exactly."""
        ledger = Ledger()
        ledger.commit("op_1", {"x": 1})
        ledger.commit("op_2", {"x": 2})
        exported = ledger.export_json()

        ledger2 = Ledger()
        ledger2.import_json(exported)
        assert len(ledger2) == 2
        assert ledger2[0].intent == "op_1"
        assert ledger2.last_hash == ledger.last_hash
        assert ledger2.replay() is True

    def test_durability_tlm_snapshot(self):
        """TinyLM snapshot/restore preserves state."""
        tlm = TinyLM()
        tlm.process("durable state test")
        snap = tlm.snapshot()
        node_count_before = tlm.graph.node_count()
        ledger_len_before = len(tlm.ledger)

        tlm2 = TinyLM()
        tlm2.restore(snap)
        assert tlm2.graph.node_count() == node_count_before
        assert len(tlm2.ledger) == ledger_len_before
        assert tlm2.ledger.replay() is True


# ===========================================================================
# Newton Invariant Tests
# ===========================================================================

class TestNewtonInvariants:
    # -----------------------------------------------------------------------
    # 1. Atomicity (same as ACID-A, validated here too)
    # -----------------------------------------------------------------------
    def test_newton_atomicity(self):
        tlm = TinyLM()
        h0 = tlm.state_hash()
        tlm.process("")
        assert tlm.state_hash() == h0

    # -----------------------------------------------------------------------
    # 2. Consistency
    # -----------------------------------------------------------------------
    def test_newton_consistency(self):
        text = "identical input text"
        t1, t2 = TinyLM(), TinyLM()
        r1 = t1.process(text)
        r2 = t2.process(text)
        assert r1["input_hash"] == r2["input_hash"]
        assert r1["state_hash"] == r2["state_hash"]

    # -----------------------------------------------------------------------
    # 3. Isolation
    # -----------------------------------------------------------------------
    def test_newton_isolation(self):
        t1, t2 = TinyLM(), TinyLM()
        t1.process("unique data for model one")
        assert "unique" not in {a.token for a in t2.graph.all_atoms()}

    # -----------------------------------------------------------------------
    # 4. Durability
    # -----------------------------------------------------------------------
    def test_newton_durability(self):
        tlm = TinyLM()
        tlm.process("durable")
        snap = tlm.snapshot()
        tlm2 = TinyLM()
        tlm2.restore(snap)
        assert tlm2.state_hash() == tlm.state_hash()

    # -----------------------------------------------------------------------
    # 5. Determinism
    # -----------------------------------------------------------------------
    def test_newton_determinism(self):
        text = "the same sentence every time"
        results = []
        for _ in range(5):
            tlm = TinyLM()
            r = tlm.process(text)
            results.append(r["state_hash"])
        assert len(set(results)) == 1, "Non-deterministic output."

    # -----------------------------------------------------------------------
    # 6. Boundary
    # -----------------------------------------------------------------------
    def test_newton_boundary(self):
        tlm = TinyLM()
        tlm.MAX_NODES = 10
        for i in range(200):
            tlm.process(f"word{i} extra{i} token{i}")
        assert tlm.graph.node_count() <= 10

    # -----------------------------------------------------------------------
    # 7. Diffability
    # -----------------------------------------------------------------------
    def test_newton_diffability(self):
        t1, t2 = TinyLM(), TinyLM()
        t1.process("apples oranges bananas")
        diff = t1.diff(t2)
        assert diff["self_node_count"] > 0
        assert diff["other_node_count"] == 0
        assert len(diff["nodes_only_in_self"]) > 0

    # -----------------------------------------------------------------------
    # 8. Reversibility
    # -----------------------------------------------------------------------
    def test_newton_reversibility(self):
        tlm = TinyLM()
        snap0 = tlm.snapshot()
        tlm.process("added some data")
        assert tlm.graph.node_count() > 0
        tlm.restore(snap0)
        assert tlm.graph.node_count() == 0

    # -----------------------------------------------------------------------
    # 9. Phase Loop
    # -----------------------------------------------------------------------
    def test_newton_phase_loop(self):
        from newton.tlm import Phase
        tlm = TinyLM()
        r = tlm.process("phase loop test")
        trace = r["phase_trace"]
        # Must start and end at IDLE
        assert trace[0] == Phase.IDLE.name
        assert trace[-1] == Phase.IDLE.name
        # COMMIT must appear
        assert Phase.COMMIT.name in trace

    # -----------------------------------------------------------------------
    # 10. 1==1 Invariant
    # -----------------------------------------------------------------------
    def test_newton_1eq1_invariant(self):
        """Crystallisation uses goal equivalence, not frequency."""
        # Process the same single token: identity law should potentially crystallise
        tlm = TinyLM()
        r = tlm.process("equal")
        # The key property: committed must be True (cycle completed)
        assert r["committed"] is True
        assert r["phase_trace"].count("CRYSTALLIZE") == 1

    # -----------------------------------------------------------------------
    # Ledger chain integrity
    # -----------------------------------------------------------------------
    def test_ledger_chain(self):
        """Replay produces identical state."""
        ledger = Ledger()
        for i in range(5):
            ledger.commit(f"step_{i}", {"value": i * 10})
        valid, bad = ledger.verify_chain()
        assert valid is True
        assert bad is None

    def test_ledger_replay_identical(self):
        ledger = Ledger()
        for i in range(3):
            ledger.commit(f"op_{i}", {"x": i})
        original_last_hash = ledger.last_hash
        exported = ledger.export_json()
        replayed = Ledger()
        replayed.import_json(exported)
        assert replayed.last_hash == original_last_hash
        assert replayed.replay() is True


# ===========================================================================
# Integration Tests
# ===========================================================================

class TestIntegration:
    def test_fg_ratio_finfr(self):
        """f/g > 1 is always finfr."""
        ratio, result = fg_ratio(f=1.5, g=1.0)
        assert result == Result.FINFR
        assert ratio > 1.0

    def test_fg_ratio_fin(self):
        ratio, result = fg_ratio(f=0.9, g=1.0)
        assert result == Result.FIN
        assert ratio <= 1.0

    def test_bezier_omega_inside(self):
        """Curve entirely inside Ω → fin."""
        omega = Omega(constraints=[
            Constraint(name="upper", fn=lambda p: p[0] - 1.0),
            Constraint(name="lower", fn=lambda p: -p[0]),
        ])
        c = BezierCurve(
            p0=Point((0.1,)), h1=Point((0.3,)),
            h2=Point((0.7,)), p3=Point((0.9,)),
        )
        result, _ = omega.test_curve(c)
        assert result == Result.FIN

    def test_curve_violation_witness(self):
        """Curve partially outside Ω → finfr with witness."""
        omega = Omega(constraints=[
            Constraint(name="cap", fn=lambda p: p[0] - 0.5),
        ])
        c = BezierCurve(
            p0=Point((0.0,)), h1=Point((0.5,)),
            h2=Point((1.0,)), p3=Point((1.5,)),
        )
        from newton.verifier import verify_trajectory
        w = verify_trajectory(c, omega)
        assert w.result == Result.FINFR
        assert len(w.violations) > 0
        assert w.curve_samples == 100

    def test_full_pipeline(self):
        """Input → Ada → Newton → Ledger → Response."""
        from newton.ada import Ada
        from newton.ledger import Ledger

        ledger = Ledger()
        ada = Ada(ledger=ledger)
        resp = ada.respond(
            prompt="Explain gravity to a student.",
            output="Gravity is the force that attracts objects with mass toward each other.",
        )
        assert resp.verification.result == Result.FIN
        assert resp.ledger_entry is not None
        assert len(ledger) == 1

    def test_cartridge_chain(self):
        """Intent → Cartridge → Verify → Ledger."""
        from newton.cartridges.visual import VisualCartridge
        ledger = Ledger()
        cart = VisualCartridge(ledger=ledger)
        result = cart.run("create a circle image")
        assert result["witness"]["result"] == "fin"
        assert result["ledger_step"] is not None
        assert len(ledger) == 1
