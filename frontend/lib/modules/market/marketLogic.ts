/**
 * @module market/marketLogic
 * Phase 5: Market trading and action card purchasing.
 * Pure functions — no React dependencies.
 */

import type { PlayerResources, ActionCardDefinition, ActionCardInstance } from '@/lib/modules/core/types';
import { ACTION_CARDS } from '@/lib/modules/core/constants';

const BUY_COST = { product: 1, energy: 1, recycle: 1 };

/**
 * Checks if a player can afford to buy an action card.
 * Cost: 1 Product + 1 Energy + 1 Recycle
 */
export function canBuyActionCard(resources: PlayerResources): boolean {
    return (
        resources.product >= BUY_COST.product &&
        resources.electricity >= BUY_COST.energy &&
        resources.recycling >= BUY_COST.recycle
    );
}

/**
 * Picks a random action card from the deck.
 */
export function pickRandomActionCard(): ActionCardDefinition {
    return ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
}

/**
 * Creates a card instance with a unique ID for the player's hand.
 */
export function createCardInstance(
    card: ActionCardDefinition,
    instanceNumber: number
): ActionCardInstance {
    return {
        ...card,
        instanceId: `${card.id}_${instanceNumber}`,
    };
}

/**
 * Deducts the cost of buying a card from the player's resources.
 */
export function deductBuyCost(resources: PlayerResources): PlayerResources {
    return {
        ...resources,
        product: resources.product - BUY_COST.product,
        electricity: resources.electricity - BUY_COST.energy,
        recycling: resources.recycling - BUY_COST.recycle,
    };
}
