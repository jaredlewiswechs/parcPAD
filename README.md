# Newton v2.0

**Constraint-first verification engine with puter.js LLM integration.**

> "The constraint IS the instruction. The verification IS the computation."
> — Jared Nashon Lewis, Ada Computing Company

Newton verifies that content (or any state) is *admissible* within defined constraints (Ω). Ada proposes (via LLM). Newton verifies. C (human) sees only what passed the law gate.

---

## The Newton/Ada/C Loop

Newton is not an AI wrapper — it is a **law gate**. The LLM never talks to the user directly. Every word it produces passes through Newton's verification layer first.

```
User input
    │
    ▼
Newton /ask ──── constraint detection ───── detected laws (audience, domain, tone…)
    │
    ▼
puter.ai.chat() ── Ada proposes ─────────── LLM generates constrained response
    │
    ▼
Newton /verify ── law gate ──────────────── fin or finfr + witness
    │
    ├── fin  → display to user with proof (green dot + witness hash)
    └── finfr → repair loop → LLM revises against violations → re-verify (max 2×)
                    │
                    └── still finfr → show violation, never show raw LLM output
```

**What makes this different from every other AI wrapper:** everyone else pipes LLM output straight to the user. Newton is the only system that puts a formal verification layer between the LLM and the human. The LLM is commodity — anyone can call `puter.ai.chat()`. The verification is the moat.

---

## Puter.js Integration

Newton uses [puter.js](https://js.puter.com/v2/) for free, browser-side LLM access — no API keys, no backend AI infrastructure, no cost.

```javascript
// 1. Newton detects constraints from user input
const constraints = await newton.ask(userMessage);

// 2. puter.js generates via LLM (Ada proposes)
const llmResponse = await puter.ai.chat(
  `Given these constraints: ${JSON.stringify(constraints.laws)}
   Respond to: ${userMessage}`,
  { model: 'claude-sonnet-4-5-20250929' }
);

// 3. Newton verifies the output (Newton gates)
const verification = await newton.verify(llmResponse.message.content);

// 4. Only display if admissible (C sees only verified output)
if (verification.result === 'fin') {
  displayMessage(llmResponse.message.content, verification.witness);
} else {
  handleFinfr(verification); // repair loop or show violation
}
```

### Frontend files

| File | Purpose |
|------|---------|
| `frontend/src/api/puter.ts` | `puterChat()`, `buildConstrainedPrompt()`, `buildRepairPrompt()`, `buildCartridgePrompt()`, `extractSvg()` |
| `frontend/src/puter.d.ts` | TypeScript global declarations for the puter CDN variable |
| `frontend/src/components/bill/BillShell.tsx` | BILL send handler — full 3-step loop with repair |
| `frontend/src/components/cartridges/CartridgeRouter.tsx` | Cartridge Workshop — Newton spec → LLM content → verify |

---

## Quick Start

```bash
# Backend
pip install -e ".[dev]"
newton          # starts FastAPI server on :8000
pytest tests/   # run all tests

# Frontend
cd frontend
npm install
npm run dev     # starts Vite dev server on :5173
```

Set `VITE_NEWTON_API_URL=http://localhost:8000` in `frontend/.env.local` for local dev.

---

## Core Vocabulary

| Term | Meaning |
|------|---------|
| **fin** | Admissible (passed verification) |
| **finfr** | Forbidden (failed verification) |
| **Ω (Omega)** | The admissible region defined by constraints |
| **f/g ratio** | Demand/capacity; f/g > 1 → finfr |
| **Bézier trajectory** | Proposed path P₀→H₁→H₂→P₃ through state space |
| **Ledger** | Append-only, hash-chained log of all commits |
| **Cartridge** | Domain-specific verification module |
| **CMFK** | Correctness/Misconception/Fog/Knowingness cognitive vector |
| **Ada** | The proposal engine (now powered by puter.js LLM) |
| **BILL** | Browser Intelligence Law Layer — the verified chat interface |

---

## Architecture

```
Layer 0  kernel.py     — Pure math: types, Bézier, Ω, hashing
Layer 1  ledger.py     — Append-only hash-chained ledger
Layer 2  verifier.py   — Newton law gate + law types
Layer 3  ada.py        — Proposal engine + constraint detection
Layer 4  tlm.py        — Tiny Language Model (10-phase cycle)
Layer 5  cmfk.py       — Cognitive shape vector
Layer 6  bill.py       — Natural language shell
         cartridges/   — Visual, Sound, Sequence, Data, Rosetta
         education/    — Cards, Stacks, Flows, TEKS, HyperLingo
         api/server.py — FastAPI server (all endpoints)

Frontend (React + Vite + Tailwind)
         api/puter.ts  — puter.js LLM integration layer
         api/newton.ts — Newton API client (all 20 endpoints)
         bill/         — BILL chat interface (3-step verified loop)
         cartridges/   — Cartridge Workshop (spec + LLM + verify)
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/ask` | Constraint detection + Ada pipeline |
| POST | `/verify` | Direct content verification |
| POST | `/calculate` | Verified math |
| POST | `/constraint` | f/g ratio check |
| POST | `/ground` | Claim grounding |
| POST | `/vault/store` | Store verified data |
| POST | `/vault/retrieve` | Retrieve data |
| POST | `/statistics` | Robust statistics |
| POST | `/cartridge/visual` | SVG spec |
| POST | `/cartridge/sound` | Audio spec |
| POST | `/cartridge/sequence` | Timeline spec |
| POST | `/cartridge/data` | Chart spec |
| POST | `/cartridge/rosetta` | App blueprint |
| POST | `/cartridge/auto` | Auto-routed cartridge |
| GET | `/cartridge/info` | List cartridges |
| POST | `/education/lesson` | Verified lesson |
| GET | `/education/teks` | TEKS search |
| POST | `/education/cmfk` | CMFK diagnosis |
| GET | `/ledger` | Export ledger |
| GET | `/ledger/verify` | Chain integrity |

---

## Key Invariants

1. No state mutation without verification.
2. No commit without ledger entry.
3. No finfr state persists.
4. Hashes are deterministic.
5. The ledger is append-only.
6. f/g > 1 is always finfr.
7. P₀ never moves.
8. Learning happens in proposal space.
9. Every response includes its witness.
10. Phase cycle always completes (0→9→0).
11. **The LLM never speaks to the user unverified.**

---

*© 2025-2026 Jared Nashon Lewis · Ada Computing Company · Houston, Texas*
