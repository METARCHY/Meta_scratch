// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MetarchyTypes.sol";

/// @title RPSLib — Rock-Paper-Scissors resolution and placement validation
/// @notice Pure-function library mirroring rpsOutcome(), isValidPlacement(),
///         and reward helpers from frontend/lib/modules/core/constants.ts
library RPSLib {

    // ═══════════════════════════════════════════════════════════
    // RPS RESOLUTION
    // ═══════════════════════════════════════════════════════════

    /// @notice Resolve RPS: returns OUTCOME_WIN if `a` beats `b`, etc.
    /// Mirrors rpsOutcome() in core/constants.ts
    function resolve(uint8 a, uint8 b) internal pure returns (uint8) {
        if (a == b) return GameConstants.OUTCOME_DRAW;
        if (a == GameConstants.DUMMY) return GameConstants.OUTCOME_LOSE;
        if (b == GameConstants.DUMMY) return GameConstants.OUTCOME_WIN;

        if (
            (a == GameConstants.ROCK     && b == GameConstants.SCISSORS) ||
            (a == GameConstants.SCISSORS  && b == GameConstants.PAPER)   ||
            (a == GameConstants.PAPER     && b == GameConstants.ROCK)
        ) {
            return GameConstants.OUTCOME_WIN;
        }

        return GameConstants.OUTCOME_LOSE;
    }

    // ═══════════════════════════════════════════════════════════
    // PLACEMENT VALIDATION
    // ═══════════════════════════════════════════════════════════

    /// @notice Check ALLOWED_MOVES: can this actorType go to this location?
    /// Mirrors ALLOWED_MOVES map in core/constants.ts
    function isValidPlacement(uint8 actorType, uint8 location) internal pure returns (bool) {
        if (actorType == GameConstants.POLITICIAN) {
            return location == GameConstants.LOC_SQUARE ||
                   location == GameConstants.LOC_UNIVERSITY;
        }
        if (actorType == GameConstants.SCIENTIST) {
            return location == GameConstants.LOC_UNIVERSITY ||
                   location == GameConstants.LOC_THEATRE;
        }
        if (actorType == GameConstants.ARTIST) {
            return location == GameConstants.LOC_SQUARE ||
                   location == GameConstants.LOC_THEATRE;
        }
        if (actorType == GameConstants.ROBOT) {
            return location == GameConstants.LOC_FACTORY    ||
                   location == GameConstants.LOC_POWER_PLANT ||
                   location == GameConstants.LOC_DUMP;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════
    // REWARD HELPERS
    // ═══════════════════════════════════════════════════════════

    /// @notice Returns the resource key a human actor produces on win.
    /// Robot rewards depend on location — use locationResource() instead.
    /// Mirrors getActorRewardType() in modules/resources/resourceManager.ts
    function actorRewardKey(uint8 actorType) internal pure returns (uint8) {
        if (actorType == GameConstants.POLITICIAN) return GameConstants.RES_POWER;
        if (actorType == GameConstants.SCIENTIST)  return GameConstants.RES_KNOWLEDGE;
        if (actorType == GameConstants.ARTIST)     return GameConstants.RES_ART;
        return 0; // Robot — caller should use locationResource()
    }

    /// @notice Returns the resource key produced at a location (for robots).
    /// Mirrors LOCATIONS[].resource in core/constants.ts
    function locationResource(uint8 location) internal pure returns (uint8) {
        if (location == GameConstants.LOC_SQUARE)      return GameConstants.RES_POWER;
        if (location == GameConstants.LOC_THEATRE)     return GameConstants.RES_ART;
        if (location == GameConstants.LOC_UNIVERSITY)  return GameConstants.RES_KNOWLEDGE;
        if (location == GameConstants.LOC_FACTORY)     return GameConstants.RES_PRODUCT;
        if (location == GameConstants.LOC_POWER_PLANT) return GameConstants.RES_ELECTRICITY;
        if (location == GameConstants.LOC_DUMP)        return GameConstants.RES_RECYCLING;
        return GameConstants.RES_FAME; // City → fame
    }

    /// @notice Max turns for a given player count.
    /// Mirrors MAX_TURNS in core/constants.ts
    function getMaxTurns(uint8 playerCount) internal pure returns (uint8) {
        if (playerCount == 2) return 5;
        if (playerCount == 3) return 5;
        if (playerCount == 4) return 8;
        if (playerCount == 5) return 6;
        return 5; // fallback
    }
}
