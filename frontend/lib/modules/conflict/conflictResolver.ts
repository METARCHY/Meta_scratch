/**
 * @module conflict/conflictResolver
 * Pure function: resolves a single conflict using RPS + bid logic.
 *
 * KEY FIX: All player references use the dynamic `localPlayerId` parameter
 * instead of the hardcoded 'p1' that caused the multi-player visibility bug.
 */

import type { ConflictResult } from '@/lib/modules/core/types';

interface ConflictInput {
    opponents: Array<{
        actorId: string;
        actorType?: string;
        name?: string;
        bid?: string;
    }>;
    playerActor: {
        actorId: string;
        actorType?: string;
        bid?: string;
    };
    locationName?: string;
}

interface PlayerInfo {
    id: string;             // The local player's dynamic ID
    name: string;
}

/**
 * Resolves a single conflict between the local player and opponents.
 *
 * @param localPlayerId - The current player's ID (dynamic — fixes the 'p1' bug)
 * @param playerChoice - The RPS argument chosen by the local player
 * @param applyBids - Whether to process bid effects
 * @param conflict - The conflict data (playerActor + opponents)
 * @param opponentChoices - Map of opponent actorId → their RPS choice
 * @param playerInfo - { id, name } of the local player
 */
/**
 * Resolves a single conflict iteration between the local player and opponents.
 * 
 * Logic follows the "Official Rulebook":
 * 1. Win: Actor wins if their argument beats at least one other and is not beaten.
 * 2. Lose: Actor loses if their argument is beaten by at least one other. Losers exit.
 * 3. Draw: All same argument (Rock-Rock-Rock) or all three (Rock-Paper-Scissors).
 * 4. Iteration: If multiple "Winners" remain, they re-roll until a single winner or Truce.
 */
export function resolveConflictLogic(
    localPlayerId: string,
    playerChoice: string,
    applyBids: boolean,
    conflict: ConflictInput,
    opponentChoices: { [id: string]: string },
    playerInfo: PlayerInfo
): ConflictResult {
    const logs: string[] = [];
    const successfulBids: { actorId: string; bid: string }[] = [];

    // No opponents = automatic win
    if (conflict.opponents.length === 0) {
        return {
            winnerId: localPlayerId,
            loserIds: [],
            survivorIds: [localPlayerId],
            isDraw: false,
            restart: false,
            evictAll: false,
            shareRewards: false,
            successfulBids: [],
            logs: ['Area secured without opposition.'],
        };
    }

    // Build choices array
    const participants = [
        {
            id: localPlayerId,
            choice: playerChoice,
            bid: conflict.playerActor.bid,
            actorType: conflict.playerActor.actorType?.toLowerCase() || 'actor',
            name: playerInfo.name || 'Player'
        },
        ...conflict.opponents.map(opp => ({
            id: opp.actorId,
            choice: opponentChoices[opp.actorId],
            bid: opp.bid,
            actorType: opp.actorType?.toLowerCase() || 'actor',
            name: opp.name || 'Opponent'
        })),
    ];

    const choicesValues = participants.filter(p => p.choice !== 'dummy').map(p => p.choice);
    const hasRock = choicesValues.includes('rock');
    const hasPaper = choicesValues.includes('paper');
    const hasScissors = choicesValues.includes('scissors');

    let winnerIds: string[] = [];
    let loserIds: string[] = [];
    let isDraw = false;
    let survivorIds: string[] = [];

    // --- Core RPS Distribution Logic for 3+ Players ---
    // Note: Dummy always loses to Rock/Paper/Scissors, and draws only against another Dummy
    const dummyIds = participants.filter(p => p.choice === 'dummy').map(p => p.id);

    if (choicesValues.length === 0) {
        // ALL players played Dummy - this is a true draw (Dummy vs Dummy)
        isDraw = true;
        survivorIds = participants.map(p => p.id); // Everyone stays for re-roll
    } else if ((hasRock && hasPaper && hasScissors) || (!hasRock && !hasPaper && !hasScissors)) {
        // Draw: Rock, Paper, and Scissors all present OR all same (e.g., all Rock)
        isDraw = true;
        survivorIds = participants.map(p => p.id);
    } else if (hasRock && hasPaper && !hasScissors) {
        winnerIds = participants.filter(p => p.choice === 'paper').map(p => p.id);
        loserIds = participants.filter(p => p.choice === 'rock').map(p => p.id);
        survivorIds = winnerIds;
    } else if (hasPaper && hasScissors && !hasRock) {
        winnerIds = participants.filter(p => p.choice === 'scissors').map(p => p.id);
        loserIds = participants.filter(p => p.choice === 'paper').map(p => p.id);
        survivorIds = winnerIds;
    } else if (hasScissors && hasRock && !hasPaper) {
        winnerIds = participants.filter(p => p.choice === 'rock').map(p => p.id);
        loserIds = participants.filter(p => p.choice === 'scissors').map(p => p.id);
        survivorIds = winnerIds;
    } else {
        // One type present (e.g. all Rock) - if Dummies exist, RPS players win. Otherwise true draw.
        if (dummyIds.length > 0) {
            winnerIds = participants.filter(p => choicesValues.includes(p.choice)).map(p => p.id);
            loserIds = dummyIds;
            survivorIds = winnerIds;
            isDraw = false;
        } else {
            isDraw = true;
            survivorIds = participants.map(p => p.id);
        }
    }

    // CRITICAL: Dummy ALWAYS loses (unless ALL played Dummy, handled above)
    // Actors playing RPS are always surviving winners over Dummies.
    if (choicesValues.length > 0 && dummyIds.length > 0) {
        loserIds = Array.from(new Set([...loserIds, ...dummyIds]));
        survivorIds = survivorIds.filter(id => !dummyIds.includes(id));
    }

    let finalWinnerId: string | null = null;
    let finalRestart = false;
    let finalEvictAll = false;
    let finalShareRewards = false;

    // --- Bid Processing (Only on Round 1) ---
    // Note: Caller must ensure applyBids is only true for the first iteration.
    if (applyBids) {
        // 1. Recycling (Draw) Bids
        if (isDraw) {
            const recyclingBidders = participants.filter(p => p.bid === 'recycling');
            if (recyclingBidders.length === 1) {
                const b = recyclingBidders[0];
                logs.push(`Recycling Bid: ${b.name}'s ${b.actorType.toUpperCase()} wins the Draw!`);
                finalWinnerId = b.id;
                isDraw = false;
                survivorIds = [b.id];
                loserIds = participants.filter(p => p.id !== b.id).map(p => p.id);
            } else if (recyclingBidders.length > 1) {
                logs.push('Multiple Recycling Bids: Conflict remains a Draw!');
            }
            recyclingBidders.forEach(b => successfulBids.push({ actorId: b.id, bid: 'recycling' }));
        }

        // 2. Electricity (Lose) Bids - Restarts Round 1 immediately
        if (!isDraw && winnerIds.length > 0) {
            const electricityLosers = participants.filter(p => loserIds.includes(p.id) && p.bid === 'electricity');
            if (electricityLosers.length > 0) {
                electricityLosers.forEach(b => {
                    logs.push(`Electricity Bid: ${b.name}'s ${b.actorType.toUpperCase()} averted defeat! Restarting...`);
                    successfulBids.push({ actorId: b.id, bid: 'electricity' });
                });
                // CRITICAL: isDraw must be FALSE - this is a restart, not a draw
                // Setting isDraw=true causes Robot Draw logic (1 resource) to trigger incorrectly
                return {
                    winnerId: null,
                    loserIds: [],
                    survivorIds: participants.map(p => p.id),
                    isDraw: false,  // FIXED: was true, which triggered wrong Robot Draw logic
                    restart: true,
                    evictAll: false,
                    shareRewards: false,
                    successfulBids,
                    logs
                };
            }
        }

        // 3. Product (Win) Bids
        if (!isDraw && winnerIds.length === 1) {
            const wId = winnerIds[0];
            const winnerObj = participants.find(p => p.id === wId);
            if (winnerObj && winnerObj.bid === 'product') {
                logs.push(`Product Bid: ${winnerObj.name} secures +1 resource bonus!`);
                successfulBids.push({ actorId: wId, bid: 'product' });
            }
        }
    }

    // --- Actor-Type Rules & Iteration ---
    if (isDraw) {
        const actorType = participants[0].actorType;
        if (actorType === 'politician' || actorType === 'player') {
            logs.push('Conflict stall: Reroll required.');
            finalRestart = true;
        } else if (actorType === 'artist') {
            logs.push('Artists refuse to compromise: All exit.');
            finalEvictAll = true;
            loserIds = participants.map(p => p.id);
            survivorIds = [];
        } else if (actorType === 'scientist' || actorType === 'robot') {
            logs.push(`${actorType.toUpperCase()}s sharing location.`);
            finalShareRewards = true;
        }
    } else if (winnerIds.length > 1) {
        // Tied Winners (e.g. 2 Paper vs 1 Rock): Losers exit, survivors re-roll!
        // This applies to all actors initially. ONLY if they draw again do the specific rules apply.
        logs.push(`Tied Winners (${winnerIds.length}): Losers exit, survivors re-roll!`);
        finalRestart = true;
    } else if (winnerIds.length === 1) {
        finalWinnerId = winnerIds[0];
    }

    return {
        winnerId: finalWinnerId,
        loserIds,
        survivorIds,
        isDraw,
        restart: finalRestart,
        evictAll: finalEvictAll,
        shareRewards: finalShareRewards,
        successfulBids,
        logs,
    };
}
