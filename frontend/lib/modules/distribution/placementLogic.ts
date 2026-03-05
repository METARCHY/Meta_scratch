/**
 * @module distribution/placementLogic
 * Phase 2: Actor placement validation and execution.
 * Pure functions — no React dependencies.
 */

import type { PlacedActor, ActorType, ArgumentType, BetType } from '@/lib/modules/core/types';
import { ALLOWED_MOVES } from '@/lib/modules/core/constants';

/**
 * Validates whether an actor type can be placed at a given location.
 */
export function isValidPlacement(actorType: string, locationId: string): boolean {
    const allowed = ALLOWED_MOVES[actorType];
    if (!allowed) return false;
    return allowed.includes(locationId);
}

/**
 * Creates a PlacedActor record.
 */
export function createPlacedActor(
    actorId: string,
    playerId: string,
    locId: string,
    argument: ArgumentType,
    actorType: ActorType,
    name: string,
    avatar: string,
    headAvatar: string,
    bid?: BetType
): PlacedActor {
    return {
        actorId,
        playerId,
        locId,
        type: argument,
        actorType,
        name,
        avatar,
        headAvatar,
        bid,
    };
}

/**
 * Returns actors that haven't been placed yet from the player's available actors.
 */
export function getAvailableActors<T extends { id: string }>(
    allActors: T[],
    placedActors: PlacedActor[]
): T[] {
    return allActors.filter(a => !placedActors.find(p => p.actorId === a.id));
}

/**
 * Returns argument types already used by the player this turn.
 */
export function getUsedArguments(
    placedActors: PlacedActor[],
    playerId: string
): string[] {
    return placedActors
        .filter(p => p.playerId === playerId)
        .map(p => p.type);
}

/**
 * Returns available argument types (not yet used by this player).
 */
export function getAvailableArguments(
    placedActors: PlacedActor[],
    playerId: string
): ArgumentType[] {
    const used = getUsedArguments(placedActors, playerId);
    const allArgs: ArgumentType[] = ['rock', 'paper', 'scissors', 'dummy'];
    return allArgs.filter(a => !used.includes(a));
}

/**
 * Removes an actor from the board (recall).
 */
export function recallActor(
    placedActors: PlacedActor[],
    actorId: string
): PlacedActor[] {
    return placedActors.filter(p => p.actorId !== actorId);
}
