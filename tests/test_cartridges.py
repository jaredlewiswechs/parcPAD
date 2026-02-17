"""Tests for newton.cartridges."""
import pytest

from newton.cartridges.visual import VisualCartridge
from newton.cartridges.sound import SoundCartridge
from newton.cartridges.sequence import SequenceCartridge
from newton.cartridges.data import DataCartridge
from newton.cartridges.rosetta import RosettaCartridge
from newton.cartridges.auto import auto_route, list_cartridges
from newton.ledger import Ledger


class TestVisualCartridge:
    def test_basic(self):
        c = VisualCartridge()
        r = c.run("create a circle icon")
        assert r["witness"]["result"] == "fin"
        assert r["spec"]["spec_type"] == "svg"

    def test_rect(self):
        c = VisualCartridge()
        spec = c.process("draw a square rectangle")
        assert spec["elements"][0]["tag"] == "rect"

    def test_triangle(self):
        c = VisualCartridge()
        spec = c.process("draw a triangle")
        assert spec["elements"][0]["tag"] == "polygon"

    def test_ledger_entry(self):
        ledger = Ledger()
        c = VisualCartridge(ledger=ledger)
        r = c.run("logo svg")
        assert r["ledger_step"] == 0
        assert len(ledger) == 1

    def test_keyword_match(self):
        assert VisualCartridge.matches("create an svg icon")
        assert not VisualCartridge.matches("write some code")


class TestSoundCartridge:
    def test_basic(self):
        c = SoundCartridge()
        r = c.run("generate a calm melody")
        assert r["witness"]["result"] == "fin"
        assert r["spec"]["spec_type"] == "audio"

    def test_tempo_range(self):
        c = SoundCartridge()
        spec = c.process("create a beat")
        assert 20 <= spec["tempo_bpm"] <= 300

    def test_notes_generated(self):
        c = SoundCartridge()
        spec = c.process("make a tone")
        assert len(spec["notes"]) == 4

    def test_keyword_match(self):
        assert SoundCartridge.matches("compose a music track")
        assert not SoundCartridge.matches("build an app")


class TestSequenceCartridge:
    def test_basic(self):
        c = SequenceCartridge()
        r = c.run("create a short animation")
        assert r["witness"]["result"] == "fin"
        assert r["spec"]["spec_type"] == "sequence"

    def test_short_duration(self):
        c = SequenceCartridge()
        spec = c.process("quick video")
        assert spec["duration_s"] == 2.0

    def test_keyframes(self):
        c = SequenceCartridge()
        spec = c.process("animation slideshow")
        assert len(spec["keyframes"]) == 4

    def test_keyword_match(self):
        assert SequenceCartridge.matches("make a video animation")
        assert not SequenceCartridge.matches("play a sound")


class TestDataCartridge:
    def test_basic(self):
        c = DataCartridge()
        r = c.run("create a bar chart report")
        assert r["witness"]["result"] == "fin"
        assert r["spec"]["spec_type"] == "data"

    def test_chart_types(self):
        c = DataCartridge()
        assert c.process("line trend graph")["chart_type"] == "line"
        assert c.process("pie distribution")["chart_type"] == "pie"
        assert c.process("scatter correlation")["chart_type"] == "scatter"
        assert c.process("data table")["chart_type"] == "table"

    def test_series_has_data(self):
        c = DataCartridge()
        spec = c.process("analytics dashboard")
        assert len(spec["series"]) > 0

    def test_keyword_match(self):
        assert DataCartridge.matches("show me a chart of data")
        assert not DataCartridge.matches("add animation")


class TestRosettaCartridge:
    def test_basic(self):
        c = RosettaCartridge()
        r = c.run("build a REST API app")
        assert r["witness"]["result"] == "fin"
        assert r["spec"]["spec_type"] == "blueprint"

    def test_language_detection(self):
        c = RosettaCartridge()
        assert c.process("javascript react app")["language"] == "javascript"
        assert c.process("rust service")["language"] == "rust"
        assert c.process("python api")["language"] == "python"

    def test_newton_integration_flag(self):
        c = RosettaCartridge()
        spec = c.process("build app")
        assert spec["newton_integration"] is True

    def test_layers(self):
        c = RosettaCartridge()
        spec = c.process("create a service")
        assert "data_model" in spec["layers"]
        assert "verification_layer" in spec["layers"]

    def test_keyword_match(self):
        assert RosettaCartridge.matches("build an application")
        assert not RosettaCartridge.matches("show a chart")


class TestAutoCartridge:
    def test_routes_visual(self):
        r = auto_route("create an svg image")
        assert r["operation"] == "cartridge_visual"

    def test_routes_sound(self):
        r = auto_route("generate a music melody")
        assert r["operation"] == "cartridge_sound"

    def test_routes_sequence(self):
        r = auto_route("make a video animation")
        assert r["operation"] == "cartridge_sequence"

    def test_routes_data(self):
        r = auto_route("show a chart report")
        assert r["operation"] == "cartridge_data"

    def test_routes_rosetta(self):
        r = auto_route("build a python app")
        assert r["operation"] == "cartridge_rosetta"

    def test_fallback_to_rosetta(self):
        r = auto_route("do something unexpected with widgets")
        # Falls through to rosetta
        assert r["operation"] == "cartridge_rosetta"

    def test_list_cartridges(self):
        carts = list_cartridges()
        names = [c["name"] for c in carts]
        assert "visual" in names
        assert "sound" in names
        assert "sequence" in names
        assert "data" in names
        assert "rosetta" in names

    def test_ledger_logging(self):
        ledger = Ledger()
        auto_route("create an image graphic", ledger=ledger)
        assert len(ledger) == 1
