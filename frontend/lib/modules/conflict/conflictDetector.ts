/**
 * @module conflict/conflictDetector
 * Detects conflicts on the game board.
 * Pure function: takes board state → returns list of conflicts.
 */

import type { PlacedActor, Conflict, ActorType } from '@/lib/modules/core/types';
import { LOCATIONS } from '@/lib/modules/core/constants';

/**
 * Scans all placed actors and returns a list of conflicts grouped by location + actorType.
 * A "conflict" includes both contested (multiple actors) and peaceful (single actor) scenarios.
 *
 * @param placedActors - All actors currently on the board
 * @param disabledLocations - Location IDs disabled by action cards this turn
 * @param localPlayerId - The current player's ID (dynamic, NOT hardcoded)
 * @param allPlayers - Array of { id, name, avatar } for displaying opponent names
 */
export function detectConflicts(
    placedActors: PlacedActor[],
    disabledLocations: string[],
    localPlayerId: string,
    allPlayers: { id: string; name: string; avatar?: string }[]
): Conflict[] {
    const conflicts: Conflict[] = [];

    // Group actors by location
    const actorsByLocation: Record<string, PlacedActor[]> = {};
    placedActors.forEach(actor => {
        if (!actorsByLocation[actor.locId]) actorsByLocation[actor.locId] = [];
        actorsByLocation[actor.locId].push(actor);
    });

    Object.entries(actorsByLocation).forEach(([locId, actors]) => {
        // Skip disabled locations
        if (disabledLocations.includes(locId)) return;

        // Group by actor type within this location
        const byType: Record<string, PlacedActor[]> = {};
        actors.forEach(a => {
            const key = a.actorType || 'unknown';
            if (!byType[key]) byType[key] = [];
            byType[key].push(a);
        });

        Object.entries(byType).forEach(([actorType, actorsOfType]) => {
            const locDef = LOCATIONS.find(l => l.id === locId);
            const uniqueConflictId = `${locId}_${actorType}`;

            // Find the local player's actor, or fallback to first actor
            const playerActorRaw = actorsOfType.find(a => a.playerId === localPlayerId) || actorsOfType[0];
            const opponentsRaw = actorsOfType.filter(a => a.actorId !== playerActorRaw.actorId);

            conflicts.push({
                id: uniqueConflictId,
                locId: uniqueConflictId,
                realLocId: locId,
                actorType: actorType as ActorType,
                locationName: locDef?.name || locId,
                playerActor: {
                    ...playerActorRaw,
                    type: playerActorRaw.type || 'rock',
                    actorType: playerActorRaw.actorType || 'politician' as ActorType,
                },
                opponents: opponentsRaw.map(o => ({
                    ...o,
                    name: allPlayers.find(p => p.id === o.playerId)?.name || 'Unknown',
                    playerAvatar: allPlayers.find(p => p.id === o.playerId)?.avatar || '',
                })),
                resourceType: locDef?.resource || 'fame',
                isPeaceful: opponentsRaw.length === 0,
                hasPlayer: actorsOfType.some(a => a.playerId === localPlayerId),
                status: 'pending',
            });
        });
    });

    return conflicts;
}
