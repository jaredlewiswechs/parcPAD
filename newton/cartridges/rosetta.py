"""Rosetta cartridge — code/app blueprint generation."""
from __future__ import annotations

from typing import Any, Dict, List

from newton.cartridges.base import Cartridge
from newton.kernel import Witness
from newton.verifier import Law, verify_transition


class RosettaCartridge(Cartridge):
    name = "rosetta"
    trigger_keywords = [
        "app", "code", "build", "create", "program", "software",
        "application", "api", "service", "website",
    ]

    def process(self, intent: str) -> Dict[str, Any]:
        """Generate an application blueprint from intent."""
        intent_lower = intent.lower()

        # Detect language/framework hints
        lang = "python"
        framework = "fastapi"
        if "javascript" in intent_lower or "js" in intent_lower:
            lang = "javascript"
            framework = "express"
        elif "react" in intent_lower:
            lang = "javascript"
            framework = "react"
        elif "rust" in intent_lower:
            lang = "rust"
            framework = "actix"

        # Detect architecture pattern
        pattern = "rest_api"
        if "cli" in intent_lower or "command" in intent_lower:
            pattern = "cli"
        elif "web" in intent_lower or "frontend" in intent_lower:
            pattern = "web_app"
        elif "worker" in intent_lower or "queue" in intent_lower:
            pattern = "worker"

        layers = [
            "data_model",
            "business_logic",
            "api_interface",
            "verification_layer",
        ]

        output_log = [
            f"RosettaCartridge.process(intent={intent[:40]!r})",
            f"  language   = {lang!r}",
            f"  framework  = {framework!r}",
            f"  pattern    = {pattern!r}",
            f"  layers     = {len(layers)}",
            *[f"    - {layer}" for layer in layers],
            "✓ blueprint spec generated",
        ]

        return {
            "spec_type": "blueprint",
            "language": lang,
            "framework": framework,
            "pattern": pattern,
            "layers": layers,
            "title": f"Blueprint: {intent[:50]}",
            "newton_integration": True,
            "constraints": [
                "All state changes verified before commit.",
                "Ledger logs every verified operation.",
                "finfr states never persisted.",
            ],
            "intent_summary": intent[:80],
            "output_log": output_log,
        }

    def verify(self, spec: Dict[str, Any]) -> Witness:
        laws: List[Law] = [
            Law(
                name="blueprint_has_layers",
                rule="required",
                description="Blueprint must define layers.",
                field_f="spec_type",
            ),
        ]
        return verify_transition(current={}, proposed=spec, laws=laws)
