"""
TEKS (Texas Essential Knowledge and Skills) standards database.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class TEKSStandard:
    """A single TEKS standard entry."""
    code: str           # e.g. "111.26.b.1.A"
    subject: str        # "Mathematics"
    grade: str          # "Grade 6"
    strand: str         # "Number and Operations"
    description: str    # Full standard text
    keywords: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, object]:
        return {
            "code": self.code,
            "subject": self.subject,
            "grade": self.grade,
            "strand": self.strand,
            "description": self.description,
            "keywords": self.keywords,
        }


class TEKSDatabase:
    """
    In-memory TEKS standards database with keyword search.
    Pre-loaded with a representative set of standards.
    """

    def __init__(self) -> None:
        self._standards: Dict[str, TEKSStandard] = {}
        self._load_defaults()

    def _load_defaults(self) -> None:
        defaults = [
            TEKSStandard(
                code="111.26.b.1.A",
                subject="Mathematics",
                grade="Grade 6",
                strand="Number and Operations",
                description=(
                    "Compare and order non-negative rational numbers. "
                    "The student applies mathematical process standards to "
                    "represent and use rational numbers in a variety of forms."
                ),
                keywords=["rational numbers", "compare", "order", "fractions", "decimals"],
            ),
            TEKSStandard(
                code="110.22.b.5.B",
                subject="English Language Arts",
                grade="Grade 4",
                strand="Reading/Comprehension",
                description=(
                    "Make inferences or draw conclusions about the structure and "
                    "elements of fiction and provide evidence from text to support "
                    "understanding."
                ),
                keywords=["inference", "fiction", "evidence", "reading", "comprehension"],
            ),
            TEKSStandard(
                code="112.14.b.5.A",
                subject="Science",
                grade="Grade 4",
                strand="Matter and Energy",
                description=(
                    "Measure, test, and record physical properties of matter, "
                    "including temperature, mass, magnetism, and the capacity "
                    "to sink or float."
                ),
                keywords=["matter", "temperature", "mass", "physical properties", "science"],
            ),
            TEKSStandard(
                code="113.18.b.2.A",
                subject="Social Studies",
                grade="Grade 5",
                strand="History",
                description=(
                    "Describe major U.S. historical events and their causes and effects."
                ),
                keywords=["history", "cause", "effect", "events", "social studies", "USA"],
            ),
            TEKSStandard(
                code="111.39.b.2.A",
                subject="Mathematics",
                grade="Grade 8",
                strand="Proportionality",
                description=(
                    "Write one-variable equations or inequalities with variables on "
                    "both sides that represent problems using rational number coefficients."
                ),
                keywords=["equations", "inequalities", "algebra", "rational", "coefficients"],
            ),
        ]
        for std in defaults:
            self._standards[std.code] = std

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def add(self, standard: TEKSStandard) -> None:
        self._standards[standard.code] = standard

    def get(self, code: str) -> Optional[TEKSStandard]:
        return self._standards.get(code)

    def all(self) -> List[TEKSStandard]:
        return list(self._standards.values())

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, query: str, limit: int = 10) -> List[TEKSStandard]:
        """Keyword search across code, strand, description, and keywords."""
        q = query.lower()
        results = []
        for std in self._standards.values():
            haystack = " ".join([
                std.code.lower(),
                std.subject.lower(),
                std.grade.lower(),
                std.strand.lower(),
                std.description.lower(),
                " ".join(std.keywords),
            ])
            if q in haystack:
                results.append(std)
        return results[:limit]

    def by_subject(self, subject: str) -> List[TEKSStandard]:
        return [s for s in self._standards.values()
                if s.subject.lower() == subject.lower()]

    def by_grade(self, grade: str) -> List[TEKSStandard]:
        return [s for s in self._standards.values()
                if s.grade.lower() == grade.lower()]
