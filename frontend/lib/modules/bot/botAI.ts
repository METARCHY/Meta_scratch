/**
 * @module bot/botAI
 * Bot AI decision-making for Metarchy.
 * Contains pure helper functions used by the BotAI system.
 * The actual stateful bot actions remain in lib/game/BotAI.ts until
 * the full board page refactor is complete.
 */

import type { PlacedActor, ActorType, ArgumentType, BetType } from '@/lib/modules/core/types';
import { ALLOWED_MOVES } from '@/lib/modules/core/constants';

const RPS_CHOICES: ArgumentType[] = ['rock', 'paper', 'scissors'];
const BET_CHOICES: (BetType | undefined)[] = ['product', 'electricity', 'recycling', undefined];

/**
 * Randomly picks an RPS argument for a bot.
 */
export function pickRandomArgument(): ArgumentType {
    return RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
}

/**
 * Randomly picks whether to bid and on what.
 */
export function pickRandomBet(): BetType | undefined {
    return BET_CHOICES[Math.floor(Math.random() * BET_CHOICES.length)];
}

/**
 * Picks a random valid location for an actor type.
 */
export function pickRandomLocation(actorType: string): string {
    const allowed = ALLOWED_MOVES[actorType] || [];
    return allowed[Math.floor(Math.random() * allowed.length)] || '';
}

/**
 * Generates a full set of placements for a bot player.
 * Returns 4 PlacedActor records (one per actor type).
 */
export function generateBotPlacements(
    botId: string,
    actorIdPrefix: string,
    availableArguments: ArgumentType[] = ['rock', 'paper', 'scissors', 'dummy']
): PlacedActor[] {
    const actorTypes: ActorType[] = ['politician', 'scientist', 'artist', 'robot'];
    const args = [...availableArguments];

    return actorTypes.map((actorType, i) => {
        // Pick random argument from remaining
        const argIdx = Math.floor(Math.random() * args.length);
        const argument = args.splice(argIdx, 1)[0] || 'rock';

        return {
            actorId: `${actorIdPrefix}${i + 1}`,
            playerId: botId,
            locId: pickRandomLocation(actorType),
            type: argument,
            actorType,
            name: actorType.charAt(0).toUpperCase() + actorType.slice(1),
            avatar: `/actors/${actorType === 'politician' ? 'Polotican' : actorType.charAt(0).toUpperCase() + actorType.slice(1)}.png`,
            headAvatar: `/actors/${actorType === 'politician' ? 'Politican' : actorType.charAt(0).toUpperCase() + actorType.slice(1)}_head.png`,
            isOpponent: true,
            bid: pickRandomBet(),
        };
    });
}

/**
 * Picks a random RPS choice for a bot during conflict resolution.
 */
export function pickBotConflictChoice(): string {
    return RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
}
