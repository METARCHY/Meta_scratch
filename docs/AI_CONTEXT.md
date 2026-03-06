# Metarchy — AI Agent Context

> This file is the **single source of truth** for all AI agents working on this project.  
> Referenced by: `CLAUDE.md`, `.github/copilot-instructions.md`, `AGENTS.md`

---

## Project Identity

**Metarchy** is a blockchain-based NFT turn-based strategy game set in a dystopian neural-network world. Players compete by sending Actors to Locations, resolving Conflicts via hidden-information RPS mechanics, and accumulating Victory Points.

- **Repo root:** this workspace directory
- **Primary language:** TypeScript (frontend), Solidity (contracts)
- **Framework:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Web3:** RainbowKit 2.0, wagmi 2.5, viem 2.7, Solidity ^0.8.20

---

## Documentation Map

Read these files to understand the project. They are the canonical references:

| Document | Path | What it covers |
|---|---|---|
| **Concept** | `docs/CONCEPT.md` | Game vision, design pillars, target experience |
| **Architecture** | `docs/ARCH.md` | Tech stack, directory structure, module architecture, data flow |
| **Mechanics** | `docs/MECHANICS.md` | Every game mechanic with code references (types, functions, modules) |
| **Rules** | `docs/RULES.md` | Complete player-facing rulebook |
| **UI System** | `docs/UI_SYSTEM.md` | Design system, components, screens, asset pipeline |
| **Roadmap** | `docs/ROADMAP.md` | Development phases, what's done, what's needed for MVP |
| **Original Rules** | `docs/metarchy-rules.md` | Full rules (English, original source) |
| **MVP Rules** | `docs/Metarchy-MVP-rules.md` | Simplified rules for MVP scope |
| **MVP Flow** | `docs/flow_MVP.md` | Step-by-step 2-player game flow with encryption spec |

---

## Key Architecture Decisions

1. **Game engine is pure functions** — all game logic lives in `frontend/lib/modules/` as stateless pure functions with no React dependencies. Modules: `core`, `phase`, `distribution`, `conflict`, `actions`, `resources`, `market`, `player`, `bot`.

2. **Legacy wrappers exist** — `frontend/lib/game/` contains thin React-aware wrappers (`PhaseEngine.ts`, `ConflictResolver.ts`, `BotAI.ts`) that delegate to modules. These are being phased out.

3. **Board page is monolithic** — `frontend/app/game/board/[id]/page.tsx` (~1500 lines) still holds all game state in `useState`. This is the main refactoring target.

4. **Data persistence is JSON files** — `frontend/data/games.json` and `citizens.json` are read/written via `fs` in API routes. No database yet.

5. **Smart contracts exist but aren't connected** — `contracts/src/MetarchyGame.sol` and `MetarchyTokens.sol` implement commit-reveal and ERC-1155 but the frontend uses API routes, not on-chain calls.

6. **Blockchain is chain-agnostic** — designed to deploy on any EVM chain. Current target: Avalanche.

---

## Code Conventions

- **Imports:** Use `@/` path alias for `frontend/` root (e.g., `@/lib/modules/core`)
- **Module pattern:** Each module in `lib/modules/{domain}/` has `{logic}.ts` + `index.ts` barrel export
- **Types:** All shared types in `lib/modules/core/types.ts`
- **Constants:** All game constants in `lib/modules/core/constants.ts`
- **Styling:** Tailwind CSS; use `cn()` from `lib/utils.ts` for conditional classes
- **Components:** React functional components, `"use client"` directive where needed
- **Naming:** camelCase for functions/variables, PascalCase for components/types, UPPER_SNAKE for constants
- **State:** React Context for global state (`GameStateContext`), local `useState` for page-level state
- **API:** Next.js API routes in `app/api/`, JSON request/response
- **Logs:** Use `formatLog(gameId, message)` for standardized UTC-timestamped logs
- **No class components** — functional only
- **No `any` in new code** — use proper types from `core/types.ts`

---

## Current Status (as of March 2026)

- **Phases 1–4 complete** — full visual engine, all 5 game phases, action cards, bot AI, modular architecture
- **Phase 5 (MVP) not started** — need: blockchain integration, game server, real multiplayer
- **MVP scope:** 2-player game with Distribution + Conflict phases, commit-reveal on-chain
- See `docs/ROADMAP.md` for full breakdown

---

## Skills & Agents

Existing skill definitions live in `.agent/skills/` — these are prompt templates for specialized tasks (game-designer, smart-contract-engineer, frontend-design, etc.). Workflows live in `.agent/workflows/`.

---

## How to Run

```bash
# With Docker (recommended)
docker-compose up --build
# → http://localhost:3000

# Manual
cd frontend
npm install
npm run dev
# → http://localhost:3000

# Admin panel
# → http://localhost:3000/admin
```
