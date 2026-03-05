/**
 * @deprecated Use '@/lib/modules/conflict' instead.
 * This file is a backward-compatible wrapper during migration.
 */

import {
    resolveConflictLogic as newResolveConflictLogic,
} from '@/lib/modules/conflict/conflictResolver';

// Re-export the type for backward compat
export type { ConflictResult } from '@/lib/modules/core/types';

/**
 * Legacy wrapper — maintains the old API signature while delegating to the fixed module.
 * The key difference: internally uses the player's actual ID instead of hardcoded 'p1'.
 */
export const resolveConflictLogic = (
    playerChoice: string,
    applyBids: boolean,
    conflict: {
        opponents: any[];
        playerActor: any;
        locationName?: string;
    },
    opponentChoices: { [id: string]: string },
    player: any
): ReturnType<typeof newResolveConflictLogic> => {
    // Extract the real player ID — this was the bug: it was always 'p1'
    const localPlayerId = player.citizenId || player.address || player.id || 'p1';

    return newResolveConflictLogic(
        localPlayerId,
        playerChoice,
        applyBids,
        conflict,
        opponentChoices,
        { id: localPlayerId, name: player.name || 'Player' }
    );
};
