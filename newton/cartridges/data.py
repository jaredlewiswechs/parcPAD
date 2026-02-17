"""Data cartridge — data/chart spec generation."""
from __future__ import annotations

from typing import Any, Dict, List

from newton.cartridges.base import Cartridge
from newton.kernel import Witness
from newton.verifier import Law, verify_transition


class DataCartridge(Cartridge):
    name = "data"
    trigger_keywords = [
        "report", "data", "chart", "graph", "table", "analytics",
        "statistics", "plot", "dashboard",
    ]

    def process(self, intent: str) -> Dict[str, Any]:
        """Generate a chart/table spec from intent."""
        intent_lower = intent.lower()

        chart_type = "bar"
        if "line" in intent_lower or "trend" in intent_lower:
            chart_type = "line"
        elif "pie" in intent_lower or "distribution" in intent_lower:
            chart_type = "pie"
        elif "scatter" in intent_lower or "correlation" in intent_lower:
            chart_type = "scatter"
        elif "table" in intent_lower:
            chart_type = "table"

        # Sample data
        sample_series = [
            {"label": "A", "value": 42},
            {"label": "B", "value": 67},
            {"label": "C", "value": 25},
            {"label": "D", "value": 88},
        ]

        output_log = [
            f"DataCartridge.process(intent={intent[:40]!r})",
            f"  chart_type = {chart_type!r}",
            f"  series     = {len(sample_series)} points",
            *[f"    [{s['label']}] {s['value']}" for s in sample_series],
            "✓ data spec generated",
        ]

        return {
            "spec_type": "data",
            "chart_type": chart_type,
            "title": f"Chart: {intent[:40]}",
            "x_label": "Category",
            "y_label": "Value",
            "series": sample_series,
            "color_scheme": "newton_default",
            "intent_summary": intent[:80],
            "output_log": output_log,
        }

    def verify(self, spec: Dict[str, Any]) -> Witness:
        laws: List[Law] = [
            Law(
                name="data_has_series",
                rule="required",
                description="Data spec must have a series.",
                field_f="spec_type",
            ),
        ]
        return verify_transition(current={}, proposed=spec, laws=laws)
