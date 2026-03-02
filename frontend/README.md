# Metarchy Frontend

Metarchy is a dystopian strategy game featuring tactical actor placement, resource management, and social/political conflicts. This repository contains the Next.js frontend application.

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context (`GameStateContext`)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Web3**: Wagmi, Viem, RainbowKit (Infrastructure ready)

## 🛠 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🏛 Project Architecture

### Logic & State
- **`app/game/board/[id]/page.tsx`**: The main game engine. Handles phase transitions, bot simulations, and modal orchestration.
- **`context/GameStateContext.tsx`**: Manages player resources, global game state, and logging.
- **`data/gameConstants.ts`**: Contains static data for Locations, Events, and Action Cards.

### Key Components
- **`components/game/MapContainer.tsx`**: The hex-based game board rendering.
- **`components/game/ConflictResolutionView.tsx`**: The "Arena" where RSP conflicts are animated and resolved.
- **`components/game/ConflictsSidebar.tsx`**: Displays active and resolved conflicts for the current phase.
- **`components/game/NewPlayersPanel.tsx`**: Top bar showing player/opponent stats and status.

---

## 🎮 Game Phases Status

The game follows a 5-phase loop:

1.  **Phase 1: Event Stage**: Completed. Randomized global events affect resources or grant cards. Includes bot comparison logs.
2.  **Phase 2: Distribution**: Completed. Players place actors on locations and choose RSP arguments.
3.  **Phase 3: Action Phases**: Completed.
    - **Bidding**: Apply material resources as bids for conflict outcomes.
    - **Stop Locations**: Disable locations using Action Cards.
    - **Relocation**: Move actors to different hexes.
    - **Exchange**: Trade resources with the bank.
    - *Bot simulation implemented for all sub-phases.*
4.  **Phase 4: Conflict Reveal**: Completed.
    - Automated resolution of bot-vs-bot conflicts.
    - Manual resolution for player-involved conflicts in the Arena.
    - **Actor-based rewards**: Politics -> Power, Science -> Knowledge, Art -> Art, Robots -> Location Resource.
    - Detailed traceability logs (e.g., "Politician used ROCK").
5.  **Phase 5: Market & Cards**: Completed.
    - **Market Reveal**: Show all offers and highlight exact matches for trade.
    - **Buy Cards**: Purchase random action cards for 1 unit of each material resource.

---

## 🛡 Admin Panel

Accessible at `/admin`:
- **Citizens**: Manage resident registration (Date/Time tracking implemented).
- **Games**: Enhanced session management with "Clear List" (bulk soft delete) and permanent deletion safety guards.

---

## 🤖 Note for AI Agents (Antigravity)

If you are an Antigravity agent taking over this project:
- **Review Artifacts**: Check the `.gemini/antigravity/brain/` directory for `task.md`, `walkthrough.md`, and `implementation_plan.md` to understand recent technical decisions.
- **Game Engine**: Most transient logic (phase steps, bot rolls) is currently handled client-side in `page.tsx` for fast iteration.
- **Styling**: We use a custom "Dystopian Gold/Dark" theme. Follow the patterns in `ConflictResolutionView.tsx` for high-fidelity UI updates.
- **Logging**: Use `addLog` from `GameStateContext` to maintain the narrative sequence.

---

## 📋 Current Trajectory

- Finalizing the scoring system and Victory Point (VP) calculation logic in `page.tsx`.
- Optimizing background polling/re-renders for large game sessions.
- preparing for smart contract integration (hooks available in `lib/contractHooks.ts` if provided).
