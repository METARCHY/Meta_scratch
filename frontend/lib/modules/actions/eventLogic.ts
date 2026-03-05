/**
 * @module actions/eventLogic
 * Event card resolution logic.
 * Pure functions — no React dependencies.
 */

import type { EventCardDefinition, PlayerResources } from '@/lib/modules/core/types';
import { EVENTS } from '@/lib/modules/core/constants';

/**
 * Picks a random event card from the deck.
 */
export function pickRandomEvent(): EventCardDefinition {
    return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

interface EventResult {
    won: boolean;
    message: string;
    reward?: { type: string; amount: number };
    resourceCost?: { type: string; amount: number };
}

/**
 * Resolves a "compare" event — compares a resource across players.
 */
export function resolveCompareEvent(
    event: EventCardDefinition,
    playerName: string,
    playerResources: PlayerResources,
    opponentStats: { name: string; amount: number }[]
): EventResult {
    const myStat = (playerResources as any)[event.targetResource] || 0;
    let won = false;

    if (event.winCondition === 'min') {
        const minOpp = Math.min(...opponentStats.map(o => o.amount), Infinity);
        won = myStat < minOpp;
    } else {
        const maxOpp = Math.max(...opponentStats.map(o => o.amount), -1);
        won = myStat > maxOpp;
    }

    const statsStr = `${playerName}: ${myStat}, ${opponentStats.map(o => `${o.name}: ${o.amount}`).join(', ')}`;
    const message = won
        ? `${playerName} WON Glory! (Stats: ${statsStr})`
        : `${playerName} lost. (Stats: ${statsStr})`;

    return {
        won,
        message,
        reward: won && event.reward === 'glory' ? { type: 'glory', amount: 1 } : undefined,
    };
}

/**
 * Resolves a "discard" event — players secretly discard resources.
 */
export function resolveDiscardEvent(
    event: EventCardDefinition,
    playerName: string,
    discardAmount: number,
    opponentDiscards: { name: string; amount: number }[]
): EventResult {
    const maxOppDiscard = Math.max(...opponentDiscards.map(o => o.amount), 0);
    const won = discardAmount > maxOppDiscard;

    const oppStr = opponentDiscards.map(o => `${o.name} discarded ${o.amount}`).join(', ');
    const message = won
        ? `${playerName} discarded ${discardAmount} (Opponents: ${oppStr}). ${playerName} WON an Action Card!`
        : `${playerName} discarded ${discardAmount} (Opponents: ${oppStr}). ${playerName} lost.`;

    return {
        won,
        message,
        resourceCost: { type: event.targetResource, amount: discardAmount },
    };
}
