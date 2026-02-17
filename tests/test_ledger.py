"""Tests for newton.ledger (Layer 1)."""
import json
import pytest

from newton.ledger import Ledger, LedgerEntry


class TestLedger:
    def test_initial_state(self):
        ledger = Ledger()
        assert len(ledger) == 0
        assert ledger.last_hash == Ledger.GENESIS

    def test_commit_returns_entry(self):
        ledger = Ledger()
        entry = ledger.commit("test_intent", {"key": "value"})
        assert isinstance(entry, LedgerEntry)
        assert entry.step == 0
        assert entry.intent == "test_intent"
        assert entry.payload["key"] == "value"
        assert entry.previous_hash == Ledger.GENESIS

    def test_chain_grows(self):
        ledger = Ledger()
        for i in range(5):
            ledger.commit(f"intent_{i}", {"i": i})
        assert len(ledger) == 5

    def test_chain_links(self):
        ledger = Ledger()
        e0 = ledger.commit("step0", {})
        e1 = ledger.commit("step1", {})
        assert e1.previous_hash == e0.entry_hash

    def test_verify_chain_empty(self):
        ledger = Ledger()
        valid, bad_step = ledger.verify_chain()
        assert valid is True
        assert bad_step is None

    def test_verify_chain_valid(self):
        ledger = Ledger()
        for i in range(3):
            ledger.commit(f"op_{i}", {"x": i})
        valid, bad_step = ledger.verify_chain()
        assert valid is True
        assert bad_step is None

    def test_verify_chain_tampered(self):
        ledger = Ledger()
        ledger.commit("op1", {"a": 1})
        ledger.commit("op2", {"b": 2})
        # Tamper with entry 0's hash directly
        ledger.entries[0] = LedgerEntry(
            step=ledger.entries[0].step,
            timestamp=ledger.entries[0].timestamp,
            intent=ledger.entries[0].intent,
            payload={"a": 999},   # tampered
            payload_hash=ledger.entries[0].payload_hash,
            previous_hash=ledger.entries[0].previous_hash,
            entry_hash=ledger.entries[0].entry_hash,
        )
        valid, bad_step = ledger.verify_chain()
        # Either the tampered entry itself or the next one will fail
        assert valid is False

    def test_export_import_round_trip(self):
        ledger = Ledger()
        ledger.commit("intent_A", {"x": 1})
        ledger.commit("intent_B", {"y": 2})
        exported = ledger.export_json()
        assert isinstance(exported, str)

        ledger2 = Ledger()
        ledger2.import_json(exported)
        assert len(ledger2) == 2
        assert ledger2[0].intent == "intent_A"
        assert ledger2[1].intent == "intent_B"
        assert ledger2.last_hash == ledger.last_hash

    def test_import_bad_chain_raises(self):
        ledger = Ledger()
        ledger.commit("op", {"v": 1})
        data = json.loads(ledger.export_json())
        # Corrupt entry_hash
        data["entries"][0]["entry_hash"] = "deadbeef"
        with pytest.raises(ValueError):
            ledger2 = Ledger()
            ledger2.import_json(json.dumps(data))

    def test_replay_valid(self):
        ledger = Ledger()
        for i in range(4):
            ledger.commit(f"step{i}", {"i": i})
        assert ledger.replay() is True

    def test_entries_append_only(self):
        """Existing entries should not be mutated by new commits."""
        ledger = Ledger()
        e0 = ledger.commit("first", {"a": 1})
        first_hash = e0.entry_hash
        ledger.commit("second", {"b": 2})
        assert ledger[0].entry_hash == first_hash

    def test_getitem(self):
        ledger = Ledger()
        ledger.commit("op", {"v": 42})
        assert ledger[0].payload["v"] == 42

    def test_payload_hash_deterministic(self):
        ledger = Ledger()
        e1 = ledger.commit("op", {"key": "val"})
        ledger2 = Ledger()
        e2 = ledger2.commit("op", {"key": "val"})
        assert e1.payload_hash == e2.payload_hash
