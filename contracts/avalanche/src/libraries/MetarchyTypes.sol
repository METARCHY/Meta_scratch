// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MetarchyTypes — Shared types and constants for Metarchy game contracts
/// @notice Mirrors frontend/lib/modules/core/types.ts & constants.ts

// ═══════════════════════════════════════════════════════════════════
// File-level enums & structs (importable directly)
// ═══════════════════════════════════════════════════════════════════

enum GamePhase {
    Lobby,                  // Pre-game, waiting for players
    Event,                  // Phase 1: Event card (Turn ≥ 2)
    DistributionCommit,     // Phase 2a: Submit hashed placements
    DistributionReveal,     // Phase 2b: Reveal placements & verify
    Action,                 // Phase 3: Action cards (sub-steps)
    ConflictResolution,     // Phase 4: Auto-resolve conflicts
    ConflictResolveCommit,  // Phase 4a: Politician draw — commit RPS
    ConflictResolveReveal,  // Phase 4b: Politician draw — reveal RPS
    Market,                 // Phase 5: Buy action cards
    Finished                // Game over
}

enum GameStatus {
    Waiting,
    Playing,
    Finished
}

// ─── Actor placement (one actor on one location) ────────────────

struct ActorPlacement {
    uint8 actorType;    // 0=Politician, 1=Scientist, 2=Artist, 3=Robot
    uint8 location;     // 0–6 (see GameConstants.LOC_*)
    uint8 argument;     // 0=Rock, 1=Paper, 2=Scissors, 3=Dummy
    uint8 bet;          // 0=None, 1=Product(Win), 2=Electricity(Lose), 3=Recycling(Draw)
}

// ─── Player resources (packed for storage efficiency) ───────────

struct PlayerResources {
    uint16 gato;
    uint8 product;
    uint8 electricity;
    uint8 recycling;
    uint8 power;
    uint8 art;
    uint8 knowledge;
    uint8 fame;
}

// ─── Game session metadata ──────────────────────────────────────

struct GameSession {
    uint64 id;
    GameStatus status;
    uint8 maxPlayers;
    uint8 playerCount;
    uint8 currentTurn;
    uint8 maxTurns;
    GamePhase currentPhase;
    uint64 createdAt;
    address creator;
    address winner;
    uint8 committedCount;
    uint8 revealedCount;
}

// ─── Per-player state within a game ─────────────────────────────

struct PlayerState {
    address addr;
    bool hasJoined;
    PlayerResources resources;
    bytes32 commitHash;
    bool revealed;
}

// ─── Turn moves: 4 actor placements per player per turn ─────────

struct TurnMoves {
    ActorPlacement[4] placements;
    bool submitted;
}

// ─── Conflict record (2-player MVP) ────────────────────────────

struct ConflictRecord {
    uint8 location;
    uint8 actorType;
    address player1;
    address player2;
    uint8 arg1;
    uint8 arg2;
    uint8 bet1;
    uint8 bet2;
    address winner;         // address(0) for draw/shared
    bool resolved;
    bool needsResolve;      // true → politician draw, needs re-fight
}

// ─── Commit-reveal for conflict re-resolution ───────────────────

struct ResolveCommit {
    bytes32 hash;
    uint8 choice;           // 0=Rock, 1=Paper, 2=Scissors
    bool committed;
    bool revealed;
}

// ═══════════════════════════════════════════════════════════════════
// Constants library
// ═══════════════════════════════════════════════════════════════════

library GameConstants {
    // ─── Actor types ────────────────────────────
    uint8 constant POLITICIAN = 0;
    uint8 constant SCIENTIST  = 1;
    uint8 constant ARTIST     = 2;
    uint8 constant ROBOT      = 3;
    uint8 constant NUM_ACTORS = 4;

    // ─── Arguments (RPS) ────────────────────────
    uint8 constant ROCK     = 0;
    uint8 constant PAPER    = 1;
    uint8 constant SCISSORS = 2;
    uint8 constant DUMMY    = 3;

    // ─── Bet types ──────────────────────────────
    uint8 constant BET_NONE        = 0;
    uint8 constant BET_PRODUCT     = 1;  // Bet on Win
    uint8 constant BET_ELECTRICITY = 2;  // Bet on Lose
    uint8 constant BET_RECYCLING   = 3;  // Bet on Draw

    // ─── Location IDs ───────────────────────────
    uint8 constant LOC_CITY        = 0;
    uint8 constant LOC_SQUARE      = 1;
    uint8 constant LOC_THEATRE     = 2;
    uint8 constant LOC_UNIVERSITY  = 3;
    uint8 constant LOC_FACTORY     = 4;
    uint8 constant LOC_POWER_PLANT = 5;
    uint8 constant LOC_DUMP        = 6;
    uint8 constant NUM_LOCATIONS   = 7;

    // ─── Resource keys (index into PlayerResources) ──
    // 0 = gato (not used for rewards)
    uint8 constant RES_PRODUCT     = 1;
    uint8 constant RES_ELECTRICITY = 2;
    uint8 constant RES_RECYCLING   = 3;
    uint8 constant RES_POWER       = 4;
    uint8 constant RES_ART         = 5;
    uint8 constant RES_KNOWLEDGE   = 6;
    uint8 constant RES_FAME        = 7;

    // ─── RPS outcomes ───────────────────────────
    uint8 constant OUTCOME_WIN  = 0;
    uint8 constant OUTCOME_LOSE = 1;
    uint8 constant OUTCOME_DRAW = 2;

    // ─── Default starting resources ─────────────
    uint16 constant DEFAULT_GATO     = 1000;
    uint8  constant DEFAULT_MATERIAL = 1;   // 1 product, 1 electricity, 1 recycling
}
