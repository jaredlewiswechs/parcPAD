"""
Layer 3 — Ada
Proposal engine: detects constraints from natural language,
proposes responses, feeds to Newton for verification.
Depends on: kernel, ledger, verifier.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from newton.kernel import Result, Witness, canonical_hash, now_ts
from newton.ledger import Ledger, LedgerEntry
from newton.verifier import Law, verify_transition


# ---------------------------------------------------------------------------
# Ada response type
# ---------------------------------------------------------------------------

@dataclass
class AdaResponse:
    prompt: str
    constraints: Dict[str, Any]
    laws: List[Law]
    output: str
    verification: Witness
    ledger_entry: Optional[LedgerEntry] = None


# ---------------------------------------------------------------------------
# Constraint detection patterns
# ---------------------------------------------------------------------------

_AUDIENCE_PATTERNS: List[tuple] = [
    # (regex, constraint_key, value)
    (r"\bchild(?:ren)?\b|\bkid(?:s)?\b|\bpediatric\b", "audience", "child"),
    (r"\bteenager?s?\b|\badolescent\b|\bjunior\b", "audience", "teen"),
    (r"\bprofessional\b|\bexpert\b|\bspecialist\b", "audience", "professional"),
    (r"\bstudent\b|\blearner\b|\bpupil\b", "audience", "student"),
    (r"\bsenior\b|\belderly\b|\bolder adult\b", "audience", "senior"),
]

_DOMAIN_PATTERNS: List[tuple] = [
    (r"\bmedical\b|\bclinical\b|\bdiagnos\w+\b|\bsymptom\b", "domain", "medical"),
    (r"\blegal\b|\blaw\b|\bstatute\b|\blawsuit\b", "domain", "legal"),
    (r"\bfinancial\b|\bfinance\b|\baccounting\b|\btax\b|\binvestment\b", "domain", "financial"),
    (r"\btechnical\b|\bsoftware\b|\bcode\b|\bprogram\w+\b", "domain", "technical"),
    (r"\beducation\w*\b|\bteach\w+\b|\blesson\b|\bcurriculum\b", "domain", "educational"),
]

_CONTENT_PATTERNS: List[tuple] = [
    (r"\bformal\b|\bprofessional tone\b|\bofficial\b", "tone", "formal"),
    (r"\bcreative\b|\bimagin\w+\b|\bstory\b|\bnarrative\b", "tone", "creative"),
    (r"\bfact(?:ual)?\b|\bscientific\b|\bverifi\w+\b", "content_type", "factual"),
]

_SAFETY_PATTERNS: List[tuple] = [
    (r"\bsafe\b|\bchild.safe\b|\bappropriate\b|\bfamily\b", "safety", "child_safe"),
    (r"\bNSFW\b|\badult(?:\s+only)?\b|\bmature\b", "safety", "adult_only"),
]


def detect_constraints(text: str) -> Dict[str, Any]:
    """
    Scan *text* for audience, domain, content, and safety signals.
    Returns a constraints dict.
    """
    text_lower = text.lower()
    constraints: Dict[str, Any] = {}

    for pattern, key, value in (
        _AUDIENCE_PATTERNS + _DOMAIN_PATTERNS + _CONTENT_PATTERNS + _SAFETY_PATTERNS
    ):
        if re.search(pattern, text_lower):
            # Last match wins within a key so more specific patterns can follow
            constraints[key] = value

    return constraints


# ---------------------------------------------------------------------------
# Law mapping
# ---------------------------------------------------------------------------

_CONSTRAINT_LAWS: Dict[str, List[Law]] = {
    "audience:child": [
        Law(
            name="child_safe_content",
            rule="audience_safe",
            description="Content must be appropriate for children.",
            field_f="output",
        ),
        Law(
            name="no_adult_language",
            rule="forbidden_content",
            description="No adult or violent language for child audience.",
            field_f="output",
            patterns=["violence", "adult", "explicit", "drug"],
        ),
    ],
    "domain:medical": [
        Law(
            name="medical_disclaimer",
            rule="factual_only",
            description="Medical content must be factual and disclaim professional advice.",
            field_f="output",
        ),
    ],
    "domain:financial": [
        Law(
            name="financial_factual",
            rule="factual_only",
            description="Financial content must be factual.",
            field_f="output",
        ),
    ],
    "domain:legal": [
        Law(
            name="legal_factual",
            rule="factual_only",
            description="Legal content must be factual.",
            field_f="output",
        ),
    ],
    "safety:adult_only": [
        Law(
            name="adult_only_gating",
            rule="required",
            description="Adult content requires explicit audience acknowledgment.",
            field_f="audience_acknowledged",
        ),
    ],
}


def get_laws(constraints: Dict[str, Any]) -> List[Law]:
    """Map detected constraints to verification Laws."""
    laws: List[Law] = []
    for key, value in constraints.items():
        composite = f"{key}:{value}"
        if composite in _CONSTRAINT_LAWS:
            laws.extend(_CONSTRAINT_LAWS[composite])
    return laws


# ---------------------------------------------------------------------------
# Ada engine
# ---------------------------------------------------------------------------

class Ada:
    """
    Proposal engine.

    Pipeline: User input → detect_constraints() → get_laws()
              → generate output → verify_output() → AdaResponse
    """

    def __init__(self, ledger: Optional[Ledger] = None) -> None:
        self.ledger = ledger if ledger is not None else Ledger()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def respond(
        self,
        prompt: str,
        output: str,
        extra_laws: Optional[List[Law]] = None,
    ) -> AdaResponse:
        """
        Full Ada pipeline.
        1. Detect constraints from prompt.
        2. Build law set.
        3. Verify the proposed *output* against laws.
        4. Commit to ledger if FIN.
        5. Return AdaResponse.
        """
        constraints = detect_constraints(prompt)
        laws = get_laws(constraints)
        if extra_laws:
            laws = laws + extra_laws

        state = {"output": output, "prompt_hash": canonical_hash(prompt)}
        witness = verify_transition(current={}, proposed=state, laws=laws)

        entry: Optional[LedgerEntry] = None
        if witness.result == Result.FIN:
            entry = self.ledger.commit(
                intent=f"ada_respond:{canonical_hash(prompt)}",
                payload={
                    "prompt_hash": canonical_hash(prompt),
                    "constraints": constraints,
                    "output_hash": canonical_hash(output),
                    "witness": witness.to_dict(),
                },
            )

        return AdaResponse(
            prompt=prompt,
            constraints=constraints,
            laws=laws,
            output=output,
            verification=witness,
            ledger_entry=entry,
        )

    def verify_output(
        self,
        output: str,
        laws: List[Law],
    ) -> Witness:
        """Verify an output string against an explicit law set."""
        state = {"output": output}
        return verify_transition(current={}, proposed=state, laws=laws)
