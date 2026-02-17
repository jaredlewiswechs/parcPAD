# Newton v2.0

**Constraint-first verification engine.**

> "The constraint IS the instruction. The verification IS the computation."
> — Jared Nashon Lewis, Ada Computing Company

Newton verifies that content (or any state) is *admissible* within defined constraints (Ω). Ada proposes. Newton verifies. C (human) is the authority.

## Quick Start

```bash
pip install -e ".[dev]"
newton          # starts FastAPI server on :8000
pytest tests/   # run all tests
```

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
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/ask` | Full Ada pipeline |
| POST | `/verify` | Direct verification |
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

---

*© 2025-2026 Jared Nashon Lewis · Ada Computing Company · Houston, Texas*
