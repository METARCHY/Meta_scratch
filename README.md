# Metarchy

- Metarchy is a turn-based strategy game with microeconomics, predicting opponents' actions, and betting on the outcome of events.
- It uses blockchain as a source of proof that data has not been intercepted or retroactively altered.
- Metarchy is ideal for online human competitions, as it features a mechanic that resists AI substitution: even if the opponent is an AI-agent, a human-player has exactly the same chance to win, lose, or draw against an AI-player as against a human-player.
- The game is set in the near future, where robots do the heavy lifting, and super-advanced AI has solved all fundamental problems.
- Knowledge, Art, and Power are the most important values ​​for people, and because of these values conflicts arise between people.
- Fortunately, in our near future, all conflicts are resolved with Rock-Paper-Scissors!
- Metaarchy teaches people that the world is not dual. Besides "Zero" and "One," there is also "Neither Zero nor One."
- Metaarchy shifts our perspective from Dualism to Three-alism. In Metaarchy, there are not Duels, but Three-els!

Let's dive into the world of Metaarchy and see: can Rock, Paper, and Scissors reach a consensus?

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

### Cloud & Remote Deployment
For instructions on how to deploy Metarchy to your own server at `play.metarchy.space` or on Vercel, please see our [Deployment Guide](docs/DEPLOYMENT.md).

### Quick Local Setup

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

## Strategic Roadmap & Breakthroughs

### Phase 4: Tactical Supremacy (Current)
- **Narrative Asset Interface**: Re-engineered the **Action Cards** from a standard UI panel into a high-fidelity narrative asset. Shifted the focus to borderless 520px artwork, golden flavor text plates, and a centered, premium typography hierarchy that prioritizes immersion over raw information.
- **Dynamic Strategic Logic**: Implemented the **Relocation & Exchange** framework, introducing non-linear movement and resource-swapping as core tactical levers for endgame dominance.
- **Workflow Solidification**: Fixed the 4-step Action Phase sequence (Bidding → Denial → Mobility → Exchange), eliminating state ambiguity and enforcing a strict tactical rhythm.
- **Conflict Visibility & Manual Flow**: Disabled auto-advance in Phase 4 to give players time to review logs. Created a player-focused sidebar that tracks unresolved and viewed conflicts, allowing manual review of peaceful resolutions and drawn out battles.
- **Enhanced End Game State**: Built a dynamic Game Over sequence that calculates final Victory Points (VP). Rewards the winner with a glowing "VICTORY" overlay and laurels (Crown icon), while providing a clear "Return to Lobby" pathway.

### Phase 3: Conflict & Resolution Architecture
- **Cinematic Resolution Arena**: Designed a full-screen battle environment featuring actor tinting, location-specific dynamic backdrops, and animated "VS" reveal sequences.
- **Role-Based Tactical Isolation**: Engineered conflict detection to match actors by role (Politician vs. Politician), ensuring that location dominance is a matter of professional rivalry, not just resource bidding.
- **Visual Feedback desaturation**: Integrated a global "disabled" state that desaturates locations and actors, providing instant, map-wide reconnaissance of active vs. inactive zones.
- **Multi-Agent Readiness**: Implemented strict turn-based progression, ensuring game stages advance only when all real players and intelligent bots report "ready" in the global log stream.

### Phase 2: Project Governance & Live Telemetry
- **Admin Nerve Center**: Developed a real-time telemetry dashboard for live session monitoring, high-precision auditing (UTC-synced logs), and citizen record management.
- **Persistent Game Simulation**: Shifted to a robust, volume-mounted JSON persistence layer that maintains the complex state of a dystopian neural network across session restarts and container rebuilds.
- **Analytical Audit Stream**: Standardized an action-log format that captures every tactical move for high-precision debugging and fair play verification.

### Phase 1: Neural Network Foundation
- **H-Matrix Map Engine**: Developed the high-performance hex-based engine with drag-to-move navigation and action-aware 1.6x zoom scaling.
- **Decentralized Actor Framework**: Established the four core actor classes (Politician, Robot, Scientist, Artist) with unique operational behaviors and NFT-compatible data structures.
- **Web3 Identity Integration**: Implemented the foundation for Citizen IDs and MetaMask-compatible session handling, ensuring player identity is truly decentralized.

## License

This project is licensed under the [MIT License](https://opensource.org/license/MIT).
