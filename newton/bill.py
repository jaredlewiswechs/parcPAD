"""
Layer 6 — BILL Shell
Natural language interface. Processes input through the CMFK pipeline.
Depends on: kernel, ledger, verifier, ada, cmfk.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from newton.ada import Ada
from newton.cmfk import BILLDiagnosis, CMFKVector, bill_diagnose
from newton.kernel import Result, canonical_hash
from newton.ledger import Ledger
from newton.verifier import Law


# ---------------------------------------------------------------------------
# BILL Commands
# ---------------------------------------------------------------------------

COMMANDS = {
    "teach":  "Education mode — generate lesson card for a topic.",
    "verify": "Direct verification of a statement.",
    "plan":   "Planner mode — scaffold a plan.",
    "build":  "Rosetta cartridge — generate an app blueprint.",
    "ask":    "Q&A with verification.",
}


@dataclass
class BILLResponse:
    command: str
    input_text: str
    cmfk: CMFKVector
    shape: str
    diagnosis_steps: List[str]
    output: str
    result: str          # "fin" or "finfr"
    ledger_step: Optional[int] = None


# ---------------------------------------------------------------------------
# BILL engine
# ---------------------------------------------------------------------------

class BILL:
    """
    BILL Shell — natural language interface.

    Pipeline:
        User Input → Shape Parser → Shape Engine → Correction Layer → Output
                          ↓              ↓                ↓
                      CMFK Vector    Intent Match     Newton Verify
    """

    def __init__(self, ledger: Optional[Ledger] = None) -> None:
        self.ledger = ledger if ledger is not None else Ledger()
        self.ada = Ada(ledger=self.ledger)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, raw_input: str) -> BILLResponse:
        """
        Parse *raw_input*, detect command, run CMFK diagnosis,
        generate a response, and verify it.
        """
        command, subject = self._parse_command(raw_input)

        # CMFK diagnosis on the subject text
        diagnosis = bill_diagnose(subject if subject else raw_input)

        # Route to handler
        handler = {
            "teach":  self._handle_teach,
            "verify": self._handle_verify,
            "plan":   self._handle_plan,
            "build":  self._handle_build,
            "ask":    self._handle_ask,
        }.get(command, self._handle_ask)

        output = handler(subject or raw_input, diagnosis)

        # Verify output via Ada
        ada_resp = self.ada.respond(
            prompt=raw_input,
            output=output,
        )

        return BILLResponse(
            command=command,
            input_text=raw_input,
            cmfk=diagnosis.vector,
            shape=diagnosis.shape,
            diagnosis_steps=diagnosis.steps,
            output=output,
            result=ada_resp.verification.result.value,
            ledger_step=(
                ada_resp.ledger_entry.step if ada_resp.ledger_entry else None
            ),
        )

    # ------------------------------------------------------------------
    # Command parser
    # ------------------------------------------------------------------

    def _parse_command(self, text: str) -> tuple[str, str]:
        """Extract command and subject from text like 'bill teach "topic"'."""
        text = text.strip()
        # Strip leading 'bill ' prefix if present
        if text.lower().startswith("bill "):
            text = text[5:].strip()

        for cmd in COMMANDS:
            pattern = re.compile(
                rf"^{cmd}\s+['\"]?(.+?)['\"]?\s*$", re.I
            )
            m = pattern.match(text)
            if m:
                return (cmd, m.group(1).strip())
            if text.lower().startswith(cmd):
                rest = text[len(cmd):].strip().strip("'\"")
                return (cmd, rest)

        return ("ask", text)

    # ------------------------------------------------------------------
    # Handlers
    # ------------------------------------------------------------------

    def _handle_teach(self, subject: str, diagnosis: BILLDiagnosis) -> str:
        lines = [
            f"# Lesson: {subject}",
            "",
            f"**Cognitive Shape:** {diagnosis.shape}",
            "",
            "**Teaching Sequence:**",
        ]
        for step in diagnosis.steps:
            lines.append(f"- {step}")
        lines += [
            "",
            "**Core Concept:**",
            f"This lesson covers *{subject}*. Start with definitions, "
            "then examples, then apply to a real-world scenario.",
            "",
            "**Check for Understanding:**",
            f"Can you explain {subject} in your own words?",
        ]
        return "\n".join(lines)

    def _handle_verify(self, statement: str, diagnosis: BILLDiagnosis) -> str:
        shape = diagnosis.shape
        vector = diagnosis.vector
        lines = [
            f"**Verification Report**",
            f"Statement: _{statement}_",
            f"CMFK: C={vector.c:.2f} M={vector.m:.2f} F={vector.f:.2f} K={vector.k:.2f}",
            f"Shape: {shape}",
        ]
        if shape == "MISCONCEPTION":
            lines.append(
                "⚠ Potential misconception detected. "
                "Review source evidence before accepting this statement."
            )
        elif shape == "CLEAR":
            lines.append("✓ Statement shows clear, accurate framing.")
        else:
            lines.append("ℹ Statement requires additional evidence to fully verify.")
        return "\n".join(lines)

    def _handle_plan(self, subject: str, diagnosis: BILLDiagnosis) -> str:
        return "\n".join([
            f"# Plan: {subject}",
            "",
            "**Steps:**",
            "1. Define the goal clearly.",
            "2. Identify constraints and resources.",
            "3. Break goal into milestones.",
            "4. Assign actions to each milestone.",
            "5. Verify feasibility against constraints.",
            "6. Review and adjust.",
        ])

    def _handle_build(self, subject: str, diagnosis: BILLDiagnosis) -> str:
        return "\n".join([
            f"# Blueprint: {subject}",
            "",
            "**Domain:** Application",
            f"**Intent:** Build — {subject}",
            "",
            "**Layers:**",
            "- Data model",
            "- Business logic",
            "- API / interface",
            "- Verification layer (Newton)",
            "",
            "**Cartridge:** rosetta",
            "**Status:** Pending full Rosetta cartridge implementation.",
        ])

    def _handle_ask(self, question: str, diagnosis: BILLDiagnosis) -> str:
        shape = diagnosis.shape
        return "\n".join([
            f"**Question:** {question}",
            f"**Cognitive Shape:** {shape}",
            "",
            "**Response:**",
            "This question has been received and diagnosed. "
            "A verified answer requires grounding against known facts. "
            "Please supply domain context or use the `/ground` endpoint.",
        ])
