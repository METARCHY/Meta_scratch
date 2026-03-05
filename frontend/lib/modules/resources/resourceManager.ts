/**
 * @module resources/resourceManager
 * Victory Points calculation, resource rewards, and spending.
 * Pure functions — no React dependencies.
 */

import type { PlayerResources, PlacedActor, ActorType } from '@/lib/modules/core/types';
import { LOCATIONS } from '@/lib/modules/core/constants';

/**
 * Calculates Victory Points using the Metarchy formula:
 * VP = min(power, art, knowledge) after optimally distributing glory.
 * Glory fills the lowest value first.
 */
export function calculateVictoryPoints(resources: PlayerResources): number {
    let { power, knowledge, art, glory } = resources;
    let p = power, k = knowledge, a = art, g = glory;

    while (g > 0) {
        if (p <= k && p <= a) p++;
        else if (k <= p && k <= a) k++;
        else a++;
        g--;
    }

    return Math.min(p, k, a);
}

/**
 * Determines what resource an actor earns based on its type and location.
 */
export function getActorRewardType(actorType: string, locId: string): string {
    const type = actorType.toLowerCase();
    if (type === 'politician') return 'power';
    if (type === 'scientist') return 'knowledge';
    if (type === 'artist') return 'art';
    if (type === 'robot') {
        const locDef = LOCATIONS.find(l => l.id === locId);
        return locDef?.resource || '';
    }
    return '';
}

/**
 * Calculates the base reward amount for an actor.
 * Robots get 3 normally, but 1 if shared (draw).
 * Other actors get 1.
 */
export function getBaseReward(
    actorType: string,
    locId: string,
    allActorsAtLocation: PlacedActor[]
): number {
    if (actorType.toLowerCase() === 'robot') {
        const robotsHere = allActorsAtLocation.filter(
            a => a.locId === locId && a.actorType?.toLowerCase() === 'robot'
        );
        return robotsHere.length > 1 ? 1 : 3;
    }
    return 1;
}

/**
 * Calculates rewards for all surviving actors of a player at end of Phase 4.
 * Returns a map of { resourceKey: amountToAdd }.
 */
export function calculatePhase4Rewards(
    playerId: string,
    placedActors: PlacedActor[],
    disabledLocations: string[]
): Record<string, number> {
    const rewards: Record<string, number> = {};

    placedActors
        .filter(actor => actor.playerId === playerId && !disabledLocations.includes(actor.locId))
        .forEach(actor => {
            const earnedResource = getActorRewardType(actor.actorType, actor.locId);
            if (!earnedResource) return;

            const isProductBet = actor.bid === 'product';
            const base = getBaseReward(actor.actorType, actor.locId, placedActors);
            const finalReward = isProductBet ? base + 1 : base;

            rewards[earnedResource] = (rewards[earnedResource] || 0) + finalReward;
        });

    return rewards;
}

/**
 * Checks if a player can afford a specific resource cost.
 */
export function canAfford(
    resources: PlayerResources,
    costs: Partial<Record<string, number>>
): boolean {
    return Object.entries(costs).every(
        ([key, amount]) => (resources[key as keyof PlayerResources] ?? 0) >= (amount ?? 0)
    );
}

/**
 * Deducts resources. Returns new resources object.
 */
export function spendResources(
    resources: PlayerResources,
    costs: Partial<Record<string, number>>
): PlayerResources {
    const updated = { ...resources };
    Object.entries(costs).forEach(([key, amount]) => {
        const k = key as keyof PlayerResources;
        (updated as any)[k] = Math.max(0, ((updated as any)[k] || 0) - (amount || 0));
    });
    return updated;
}
