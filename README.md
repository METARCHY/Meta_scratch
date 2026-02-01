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

## License

This project is licensed under the MIT License.
