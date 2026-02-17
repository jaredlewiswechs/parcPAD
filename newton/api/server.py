"""
Newton API Server (FastAPI)
Exposes all Newton capabilities via HTTP.
"""
from __future__ import annotations

import ast
import math
import operator as op_module
import re
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from newton.ada import Ada, detect_constraints, get_laws
from newton.bill import BILL
from newton.cartridges.auto import auto_route, list_cartridges
from newton.cmfk import parse_cmfk
from newton.education.cards import Card, Stack, Flow
from newton.education.teks import TEKSDatabase
from newton.kernel import (
    BezierCurve, Constraint, Omega, Point, Result,
    canonical_hash, fg_ratio,
)
from newton.ledger import Ledger
from newton.verifier import Law, verify, verify_transition, verified_commit

# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------

_ledger = Ledger()
_ada = Ada(ledger=_ledger)
_bill = BILL(ledger=_ledger)
_teks_db = TEKSDatabase()

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Newton API",
    version="2.0.0",
    description=(
        "Constraint-first verification engine. "
        "Every response includes its Newton witness."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict in production (e.g. your Render/Vercel domain)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Standard response model
# ---------------------------------------------------------------------------

def make_response(
    result: str,
    payload: Dict[str, Any],
    witness: Optional[Dict[str, Any]] = None,
    ledger_step: Optional[int] = None,
) -> Dict[str, Any]:
    return {
        "result": result,
        "payload": payload,
        "witness": witness or {},
        "ledger_step": ledger_step,
    }


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    prompt: str
    output: Optional[str] = None  # If not provided, Ada generates a stub


class VerifyRequest(BaseModel):
    content: str
    laws: Optional[List[Dict[str, Any]]] = None


class CalculateRequest(BaseModel):
    expression: str


class ConstraintRequest(BaseModel):
    f: float = Field(..., description="Demand (numerator)")
    g: float = Field(..., description="Capacity (denominator)")
    name: Optional[str] = "unnamed"


class GroundRequest(BaseModel):
    claim: str
    facts: List[str] = Field(default_factory=list)


class VaultStoreRequest(BaseModel):
    key: str
    value: Any


class VaultRetrieveRequest(BaseModel):
    key: str


class StatisticsRequest(BaseModel):
    values: List[float]


class CartridgeRequest(BaseModel):
    intent: str


class EducationLessonRequest(BaseModel):
    topic: str
    grade: Optional[str] = None
    card_type: Optional[str] = "text"


class CMFKRequest(BaseModel):
    text: str


# ---------------------------------------------------------------------------
# In-memory vault
# ---------------------------------------------------------------------------

_vault: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Safe expression evaluator
# ---------------------------------------------------------------------------

_ALLOWED_OPS = {
    ast.Add: op_module.add,
    ast.Sub: op_module.sub,
    ast.Mult: op_module.mul,
    ast.Div: op_module.truediv,
    ast.Pow: op_module.pow,
    ast.USub: op_module.neg,
    ast.Mod: op_module.mod,
    ast.FloorDiv: op_module.floordiv,
}

_ALLOWED_FUNCS = {
    "sqrt": math.sqrt, "abs": abs, "round": round,
    "floor": math.floor, "ceil": math.ceil,
    "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "log": math.log, "log10": math.log10, "exp": math.exp,
    "pi": math.pi, "e": math.e,
}


def _safe_eval(expr: str) -> float:
    """Evaluate a mathematical expression safely (no exec/eval of arbitrary code)."""
    expr = expr.strip()
    # Pre-process: replace common notation
    expr = re.sub(r"\^", "**", expr)

    def _eval(node: Any) -> float:
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return float(node.value)
            raise ValueError(f"Unsupported constant: {node.value}")
        if isinstance(node, ast.Name):
            if node.id in _ALLOWED_FUNCS:
                val = _ALLOWED_FUNCS[node.id]
                if callable(val):
                    raise TypeError("Use as function, not name.")
                return float(val)
            raise ValueError(f"Unknown name: {node.id}")
        if isinstance(node, ast.BinOp):
            op_type = type(node.op)
            if op_type not in _ALLOWED_OPS:
                raise ValueError(f"Unsupported operator: {op_type}")
            return _ALLOWED_OPS[op_type](_eval(node.left), _eval(node.right))
        if isinstance(node, ast.UnaryOp):
            op_type = type(node.op)
            if op_type not in _ALLOWED_OPS:
                raise ValueError(f"Unsupported unary op: {op_type}")
            return _ALLOWED_OPS[op_type](_eval(node.operand))
        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name):
                raise ValueError("Complex function calls not allowed.")
            fname = node.func.id
            if fname not in _ALLOWED_FUNCS or not callable(_ALLOWED_FUNCS[fname]):
                raise ValueError(f"Unknown function: {fname}")
            args = [_eval(a) for a in node.args]
            return float(_ALLOWED_FUNCS[fname](*args))
        raise ValueError(f"Unsupported node type: {type(node).__name__}")

    tree = ast.parse(expr, mode="eval")
    return _eval(tree.body)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "version": "2.0.0",
        "ledger_entries": len(_ledger),
    }


@app.post("/ask")
def ask(req: AskRequest) -> Dict[str, Any]:
    """Full Ada pipeline: detect constraints → verify → respond."""
    output = req.output or f"[Ada response to: {req.prompt[:60]}]"
    resp = _ada.respond(prompt=req.prompt, output=output)
    return make_response(
        result=resp.verification.result.value,
        payload={
            "prompt": req.prompt,
            "output": resp.output,
            "constraints": resp.constraints,
            "laws_applied": len(resp.laws),
        },
        witness=resp.verification.to_dict(),
        ledger_step=resp.ledger_entry.step if resp.ledger_entry else None,
    )


@app.post("/verify")
def verify_content(req: VerifyRequest) -> Dict[str, Any]:
    """Direct content verification against optional laws."""
    laws: List[Law] = []
    if req.laws:
        for ld in req.laws:
            laws.append(Law(
                name=ld.get("name", "unnamed"),
                rule=ld.get("rule", "required"),
                description=ld.get("description", ""),
                threshold=float(ld.get("threshold", 0.0)),
                field_f=ld.get("field_f", "content"),
                field_g=ld.get("field_g", ""),
                patterns=ld.get("patterns", []),
            ))

    state = {"content": req.content}
    witness = verify_transition(current={}, proposed=state, laws=laws)
    return make_response(
        result=witness.result.value,
        payload={"content": req.content[:200]},
        witness=witness.to_dict(),
    )


@app.post("/calculate")
def calculate(req: CalculateRequest) -> Dict[str, Any]:
    """Verified math expression evaluation."""
    try:
        value = _safe_eval(req.expression)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid expression: {exc}")

    state = {"expression": req.expression, "result": value}
    witness = verify(state, omega=Omega(constraints=[]))

    entry = _ledger.commit(
        intent="calculate",
        payload={"expression": req.expression, "result": value, "witness": witness.to_dict()},
    )
    return make_response(
        result="fin",
        payload={"expression": req.expression, "result": value},
        witness=witness.to_dict(),
        ledger_step=entry.step,
    )


@app.get("/calculate/examples")
def calculate_examples() -> Dict[str, Any]:
    return {
        "examples": [
            {"expression": "2 + 2", "result": 4},
            {"expression": "sqrt(144)", "result": 12.0},
            {"expression": "pi * 5^2", "result": round(math.pi * 25, 6)},
            {"expression": "log(100, 10)", "result": 2.0},
        ]
    }


@app.post("/constraint")
def constraint_check(req: ConstraintRequest) -> Dict[str, Any]:
    """Direct f/g ratio constraint check."""
    ratio, res = fg_ratio(req.f, req.g)
    witness_dict = {
        "result": res.value,
        "timestamp": 0.0,
        "state_hash": canonical_hash({"f": req.f, "g": req.g}),
        "violations": (
            [] if res == Result.FIN
            else [{"constraint": req.name, "value": ratio, "description": "f/g > 1"}]
        ),
        "curve_samples": 0,
    }
    return make_response(
        result=res.value,
        payload={"name": req.name, "f": req.f, "g": req.g, "ratio": ratio},
        witness=witness_dict,
    )


@app.post("/ground")
def ground(req: GroundRequest) -> Dict[str, Any]:
    """Ground a claim against a set of provided facts."""
    claim_lower = req.claim.lower()
    matches = [f for f in req.facts if any(w in claim_lower for w in f.lower().split())]
    grounded = len(matches) > 0
    return make_response(
        result="fin" if grounded else "finfr",
        payload={
            "claim": req.claim,
            "grounded": grounded,
            "matched_facts": matches,
            "total_facts": len(req.facts),
        },
        witness={
            "result": "fin" if grounded else "finfr",
            "state_hash": canonical_hash(req.claim),
            "violations": [] if grounded else [{"constraint": "grounding", "description": "No matching facts"}],
        },
    )


@app.post("/vault/store")
def vault_store(req: VaultStoreRequest) -> Dict[str, Any]:
    """Store verified data in the vault."""
    state = {"key": req.key, "value": req.value}
    witness = verify(state, omega=Omega(constraints=[]))
    _vault[req.key] = req.value
    entry = _ledger.commit(
        intent="vault_store",
        payload={"key": req.key, "value_hash": canonical_hash(req.value), "witness": witness.to_dict()},
    )
    return make_response(
        result="fin",
        payload={"key": req.key, "stored": True},
        witness=witness.to_dict(),
        ledger_step=entry.step,
    )


@app.post("/vault/retrieve")
def vault_retrieve(req: VaultRetrieveRequest) -> Dict[str, Any]:
    """Retrieve verified data from the vault."""
    if req.key not in _vault:
        raise HTTPException(status_code=404, detail=f"Key '{req.key}' not found in vault.")
    value = _vault[req.key]
    return make_response(
        result="fin",
        payload={"key": req.key, "value": value},
    )


@app.post("/statistics")
def statistics(req: StatisticsRequest) -> Dict[str, Any]:
    """Robust statistics computation."""
    if not req.values:
        raise HTTPException(status_code=400, detail="values list is empty.")
    vals = sorted(req.values)
    n = len(vals)
    mean = sum(vals) / n
    median = vals[n // 2] if n % 2 else (vals[n // 2 - 1] + vals[n // 2]) / 2
    variance = sum((x - mean) ** 2 for x in vals) / n
    std_dev = math.sqrt(variance)
    return make_response(
        result="fin",
        payload={
            "count": n,
            "min": vals[0],
            "max": vals[-1],
            "mean": mean,
            "median": median,
            "std_dev": std_dev,
            "variance": variance,
        },
    )


# --- Cartridge endpoints ---

@app.post("/cartridge/visual")
def cartridge_visual(req: CartridgeRequest) -> Dict[str, Any]:
    from newton.cartridges.visual import VisualCartridge
    return VisualCartridge(ledger=_ledger).run(req.intent)


@app.post("/cartridge/sound")
def cartridge_sound(req: CartridgeRequest) -> Dict[str, Any]:
    from newton.cartridges.sound import SoundCartridge
    return SoundCartridge(ledger=_ledger).run(req.intent)


@app.post("/cartridge/sequence")
def cartridge_sequence(req: CartridgeRequest) -> Dict[str, Any]:
    from newton.cartridges.sequence import SequenceCartridge
    return SequenceCartridge(ledger=_ledger).run(req.intent)


@app.post("/cartridge/data")
def cartridge_data(req: CartridgeRequest) -> Dict[str, Any]:
    from newton.cartridges.data import DataCartridge
    return DataCartridge(ledger=_ledger).run(req.intent)


@app.post("/cartridge/rosetta")
def cartridge_rosetta(req: CartridgeRequest) -> Dict[str, Any]:
    from newton.cartridges.rosetta import RosettaCartridge
    return RosettaCartridge(ledger=_ledger).run(req.intent)


@app.post("/cartridge/auto")
def cartridge_auto(req: CartridgeRequest) -> Dict[str, Any]:
    return auto_route(req.intent, ledger=_ledger)


@app.get("/cartridge/info")
def cartridge_info() -> Dict[str, Any]:
    return {"cartridges": list_cartridges()}


# --- Education endpoints ---

@app.post("/education/lesson")
def education_lesson(req: EducationLessonRequest) -> Dict[str, Any]:
    """Generate a verified lesson card for a topic."""
    from newton.cmfk import CMFKVector

    card_id = canonical_hash(req.topic)
    card = Card(
        id=card_id,
        title=f"Lesson: {req.topic}",
        content=(
            f"# {req.topic}\n\n"
            "**Core Concept:**\n"
            f"This lesson introduces *{req.topic}*.\n\n"
            "**Learning Objectives:**\n"
            f"1. Define {req.topic}.\n"
            f"2. Explain the key principles of {req.topic}.\n"
            f"3. Apply knowledge of {req.topic} to a real-world scenario.\n\n"
            "**Check for Understanding:**\n"
            f"Can you explain {req.topic} in your own words?"
        ),
        card_type=req.card_type or "text",
        metadata={"grade": req.grade or "general"},
        cmfk_target=CMFKVector(c=0.8, m=0.1, f=0.1, k=0.7),
    )

    stack = Stack(
        id=f"stack_{card_id}",
        title=f"Stack: {req.topic}",
        cards=[card],
    )

    # Search related TEKS
    teks_results = _teks_db.search(req.topic, limit=3)
    stack.teks_alignment = [t.code for t in teks_results]

    return make_response(
        result="fin",
        payload=stack.to_dict(),
    )


@app.get("/education/teks")
def education_teks(query: str = "") -> Dict[str, Any]:
    """Search TEKS standards."""
    if query:
        results = _teks_db.search(query)
    else:
        results = _teks_db.all()
    return make_response(
        result="fin",
        payload={"query": query, "results": [r.to_dict() for r in results]},
    )


@app.post("/education/cmfk")
def education_cmfk(req: CMFKRequest) -> Dict[str, Any]:
    """Diagnose CMFK vector from text."""
    from newton.cmfk import bill_diagnose
    diagnosis = bill_diagnose(req.text)
    return make_response(
        result="fin",
        payload={
            "text": req.text[:200],
            "cmfk": diagnosis.vector.to_dict(),
            "shape": diagnosis.shape,
            "steps": diagnosis.steps,
        },
    )


# --- Ledger endpoints ---

@app.get("/ledger")
def ledger_export() -> Dict[str, Any]:
    """Export the full ledger."""
    import json
    return json.loads(_ledger.export_json())


@app.get("/ledger/verify")
def ledger_verify() -> Dict[str, Any]:
    """Verify ledger chain integrity."""
    valid, bad_step = _ledger.verify_chain()
    return make_response(
        result="fin" if valid else "finfr",
        payload={
            "valid": valid,
            "entries": len(_ledger),
            "first_bad_step": bad_step,
        },
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:  # pragma: no cover
    import uvicorn
    uvicorn.run("newton.api.server:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":  # pragma: no cover
    main()
