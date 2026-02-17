"""Tests for newton.ada (Layer 3)."""
import pytest

from newton.ada import Ada, AdaResponse, detect_constraints, get_laws
from newton.kernel import Result
from newton.ledger import Ledger
from newton.verifier import Law


class TestDetectConstraints:
    def test_child_audience(self):
        c = detect_constraints("Explain this for children.")
        assert c.get("audience") == "child"

    def test_medical_domain(self):
        c = detect_constraints("Give me medical advice about symptoms.")
        assert c.get("domain") == "medical"

    def test_financial_domain(self):
        c = detect_constraints("I need financial advice about investments.")
        assert c.get("domain") == "financial"

    def test_legal_domain(self):
        c = detect_constraints("What does the law say about contracts?")
        assert c.get("domain") == "legal"

    def test_formal_tone(self):
        c = detect_constraints("Write a formal report for the board.")
        assert c.get("tone") == "formal"

    def test_no_constraints(self):
        c = detect_constraints("Hello!")
        assert isinstance(c, dict)

    def test_educational_domain(self):
        c = detect_constraints("Create a lesson for students about math.")
        assert c.get("domain") == "educational"


class TestGetLaws:
    def test_child_audience_laws(self):
        constraints = {"audience": "child"}
        laws = get_laws(constraints)
        assert len(laws) > 0
        names = [l.name for l in laws]
        assert any("child" in n or "safe" in n for n in names)

    def test_unknown_constraint_no_laws(self):
        laws = get_laws({"mood": "happy"})
        assert laws == []

    def test_medical_laws(self):
        laws = get_laws({"domain": "medical"})
        assert any(l.rule == "factual_only" for l in laws)


class TestAda:
    def test_respond_fin(self):
        ada = Ada()
        resp = ada.respond(
            prompt="Tell me about photosynthesis.",
            output="Photosynthesis converts light energy into chemical energy.",
        )
        assert isinstance(resp, AdaResponse)
        assert resp.verification.result == Result.FIN
        assert resp.ledger_entry is not None

    def test_respond_with_ledger(self):
        ledger = Ledger()
        ada = Ada(ledger=ledger)
        ada.respond("A simple question.", "A simple answer.")
        ada.respond("Another question.", "Another answer.")
        assert len(ledger) == 2

    def test_respond_forbidden_content(self):
        ada = Ada()
        law = Law(
            name="no_violence",
            rule="forbidden_content",
            description="No violent content for children.",
            field_f="output",
            patterns=["violence"],
        )
        resp = ada.respond(
            prompt="For kids.",
            output="This involves violence.",
            extra_laws=[law],
        )
        assert resp.verification.result == Result.FINFR
        assert resp.ledger_entry is None  # FINFR → no commit

    def test_verify_output(self):
        ada = Ada()
        law = Law(name="req", rule="required", description="output needed", field_f="output")
        w = ada.verify_output("Some text", [law])
        assert w.result == Result.FIN

    def test_constraints_detected_and_applied(self):
        ada = Ada()
        resp = ada.respond(
            prompt="Explain for children in a child-safe way.",
            output="Learning is fun!",
        )
        assert "audience" in resp.constraints
        assert resp.verification.result == Result.FIN
