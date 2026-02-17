"""
HyperLingo interpreter — dynamic pathway DSL for HyperSchool flows.

Supported syntax (subset for v1):

    when <condition>:
        <action>
    done

Conditions:
    studentQuiz.score < 70%
    cmfk.fog > 0.5
    cmfk.misconception > 0.3

Actions:
    assign "Stack Name"
    show hint "text"
    jump to card "Card ID"
    notify teacher
    record misconception "label"
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# AST nodes
# ---------------------------------------------------------------------------

@dataclass
class Condition:
    field: str          # e.g. "cmfk.fog", "studentQuiz.score"
    operator: str       # "<", ">", "<=", ">="
    value: float

    def evaluate(self, context: Dict[str, Any]) -> bool:
        """Evaluate condition against a runtime context dict."""
        actual = _resolve(self.field, context)
        if actual is None:
            return False
        try:
            actual = float(actual)
        except (TypeError, ValueError):
            return False
        return {
            "<":  actual < self.value,
            ">":  actual > self.value,
            "<=": actual <= self.value,
            ">=": actual >= self.value,
            "==": actual == self.value,
        }.get(self.operator, False)


@dataclass
class Action:
    verb: str           # "assign", "show_hint", "jump", "notify", "record"
    args: List[str] = field(default_factory=list)


@dataclass
class Rule:
    condition: Condition
    actions: List[Action] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

_WHEN_RE = re.compile(
    r"when\s+([\w\.]+)\s*([<>=!]+)\s*([\d.]+)%?\s*:",
    re.I
)
_ACTION_RE = re.compile(
    r"(assign|show\s+hint|jump\s+to\s+card|notify|record\s+misconception)"
    r'\s*"?([^"]*)"?',
    re.I,
)


def _resolve(dotted: str, context: Dict[str, Any]) -> Optional[Any]:
    """Walk dotted path in nested context dict."""
    parts = dotted.split(".")
    cur: Any = context
    for part in parts:
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            return None
    return cur


def _parse_action(line: str) -> Optional[Action]:
    m = _ACTION_RE.search(line.strip())
    if not m:
        return None
    verb_raw = re.sub(r"\s+", "_", m.group(1).strip().lower())
    arg = m.group(2).strip().strip('"')
    return Action(verb=verb_raw, args=[arg] if arg else [])


class HyperLingoInterpreter:
    """Parse and execute HyperLingo rule programs."""

    def __init__(self) -> None:
        self.rules: List[Rule] = []

    def parse(self, source: str) -> "HyperLingoInterpreter":
        """Parse *source* into Rules. Returns self for chaining."""
        self.rules = []
        lines = source.strip().splitlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            m = _WHEN_RE.match(line)
            if m:
                cond = Condition(
                    field=m.group(1),
                    operator=m.group(2),
                    value=float(m.group(3)),
                )
                rule = Rule(condition=cond)
                i += 1
                # Collect actions until "done"
                while i < len(lines):
                    al = lines[i].strip()
                    if al.lower() == "done":
                        i += 1
                        break
                    act = _parse_action(al)
                    if act:
                        rule.actions.append(act)
                    i += 1
                self.rules.append(rule)
            else:
                i += 1
        return self

    def execute(self, context: Dict[str, Any]) -> List[Action]:
        """
        Evaluate all rules against *context*.
        Returns a flat list of triggered Actions.
        """
        triggered: List[Action] = []
        for rule in self.rules:
            if rule.condition.evaluate(context):
                triggered.extend(rule.actions)
        return triggered

    def to_dict(self) -> List[Dict[str, Any]]:
        result = []
        for rule in self.rules:
            result.append({
                "condition": {
                    "field": rule.condition.field,
                    "operator": rule.condition.operator,
                    "value": rule.condition.value,
                },
                "actions": [
                    {"verb": a.verb, "args": a.args} for a in rule.actions
                ],
            })
        return result
