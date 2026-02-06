# Metarchy

Metarchy is a blockchain-based NFT strategy game where players compete for dominance in a dystopian neural network environment.

## Features

- **Strategic Gameplay**: Use Actors (Politicians, Robots, Scientists, Artists) to control territories and gather resources.
- **Dynamic Board**: A dynamic hexagonal map that changes based on player actions.
- **Admin Dashboard**: Manage game sessions and citizen records through a dedicated admin interface.
- **Unique Game IDs**: Every session is unique and accessible via dynamic routing.
- **Invite System**: Share unique invitation links to play with others.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Lucide Icons.
- **Blockchain**: Solidity (Foundry/Anvil for local development).
- **Containerization**: Docker & Docker Compose.

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/) & Docker Compose

## Getting Started

### Running with Docker (Recommended)

To build and run the entire application using Docker Compose:

```bash
docker-compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Manual Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Admin Access**:
   Navigate to `/admin` to manage game state and citizens.

## Project Structure

- `frontend/`: Next.js application.
- `contracts/`: Solidity smart contracts for the Metarchy ecosystem.
- `data/`: JSON storage for games and citizens (mounted as a volume in Docker).

## Update Log & Versions

### v1.6.0 (Strategic Mobility - Current)
- **Teleportation System**: Relocation action cards enable tactical repositioning of actors during Phase 3 Step 3.
- **Resource Exchange**: Strategic resource swapping with opponents using Exchange cards in Phase 3 Step 4.
- **Visual Clarity**: White glow indicators on actors eligible for teleportation with subtle arrow button UI.
- **Step Navigation**: Clear "Start [Action]" buttons guide players through each Phase 3 sub-step.
- **Empty State Messaging**: Prominent "NO ACTION CARDS" notification when hand is empty for current step.

### v1.5.0 (Tactical Refinement)
- **4-Step Action Phase**: Strict sequential workflow for Phase 3: Bidding → Stop Locations → Relocation → Exchange.
- **Bidding Lock**: Material resource bets can only be placed/modified during Step 1; visible but immutable in subsequent steps.
- **Visual Disable State**: Grayscale/desaturated effect applied to disabled locations and all actors within them.
- **Adaptive Card Filtering**: Action cards panel dynamically filters by step type with fallback "no action cards" message.
- **Compact Card View**: Streamlined UI for Relocation and Exchange steps with hidden descriptions.

### v1.4.0 (Analytics & Governance)
- **Live Telemetry**: Real-time auto-updating Admin Dashboard with `Live Link` status.
- **Analytical Logs**: Standardized `[ID] [Time UTC] Action` format for high-precision auditing.
- **Session Intelligence**: Real-time citizen `Online/Offline` status tracking and heartbeats.
- **Strategic Recall**: Added the ability to recall actors and tokens during the distribution phase.

### v1.3.1 (Tactical Polish)
- **AI Emulation**: Realistic "thinking" delays for Viper and Ghost opponent actions.
- **RSP Intelligence**: Smart filtering of used tokens to prevent duplicate deployments.
- **Phase Lockdown**: Adaptive UI that prevents advancing until all tactical units are placed.

### v1.3.0 (Immersion & UX)
- **Navigable Map**: High-performance "Drag-to-Move" map panning.
- **Action Zoom**: Dynamic 1.6x zoom scaling during critical action phases.
- **Room Synthesis**: Random thematic name generator for unique game sessions.

### v1.2.0 (Identity & Persistence)
- **Decentralized Identity**: Integrated Citizen ID creation and MetaMask session management.
- **Global Lobby**: Multi-room game discovery with waiting room simulations.
- **FileSystem Persistence**: Robust JSON-based storage for long-running game sessions.

### v1.1.0 (Networking Core)
- **Dynamic Routing**: Shifted to UUID-based session addressing at `/game/board/[id]`.
- **API Foundation**: Initial REST architecture for game state and citizen records.

### v1.0.0 (Neural Genesis)
- **Core Engine**: Hex-based map and four initial Actor classes (Politician, Robot, Scientist, Artist).
- **HUD System**: Early placement markers and resource tracking.

## License

This project is licensed under the MIT License.
