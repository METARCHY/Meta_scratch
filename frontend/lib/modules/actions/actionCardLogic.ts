/**
 * @module actions/actionCardLogic
 * Action card activation and effects.
 * Pure functions — no React dependencies.
 */

import type { ActionCardInstance, PlacedActor } from '@/lib/modules/core/types';
import { ALLOWED_MOVES } from '@/lib/modules/core/constants';

/**
 * Filters action cards available for the current Phase 3 step.
 */
export function getFilteredCards(
    hand: ActionCardInstance[],
    p3Step: number
): ActionCardInstance[] {
    switch (p3Step) {
        case 1: return hand.filter(c => c.type === 'turn off location'); // Block Location step
        case 2: return hand.filter(c => c.id.includes('relocation')); // Relocation step
        case 3: return hand.filter(c => c.id.includes('change_values') || c.id.includes('exchange')); // Change Values step
        default: return [];
    }
}

/**
 * Counts relocation cards in hand.
 */
export function countRelocationCards(hand: ActionCardInstance[]): number {
    return hand.filter(c => c.id.includes('relocation')).length;
}

/**
 * Counts exchange cards in hand.
 */
export function countExchangeCards(hand: ActionCardInstance[]): number {
    return hand.filter(c => c.id.includes('change_values') || c.id.includes('exchange')).length;
}

/**
 * Applies a "block location" card. Returns the new disabled locations list.
 */
export function applyBlockLocation(
    disabledLocations: string[],
    locationId: string
): string[] {
    if (disabledLocations.includes(locationId)) return disabledLocations;
    return [...disabledLocations, locationId];
}

/**
 * Validates a relocation move for an actor.
 */
export function isValidRelocation(actorType: string, targetLocId: string): boolean {
    const allowed = ALLOWED_MOVES[actorType];
    if (!allowed) return false;
    return allowed.includes(targetLocId);
}

/**
 * Relocates an actor to a new location. Returns updated placed actors.
 */
export function relocateActor(
    placedActors: PlacedActor[],
    actorId: string,
    newLocId: string
): PlacedActor[] {
    return placedActors.map(a =>
        a.actorId === actorId ? { ...a, locId: newLocId } : a
    );
}

/**
 * Removes a used card from the player's hand.
 */
export function removeFromHand(
    hand: ActionCardInstance[],
    instanceId: string
): ActionCardInstance[] {
    return hand.filter(c => c.instanceId !== instanceId);
}
