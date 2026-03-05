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
export function resolveConflictLogic(
    localPlayerId: string,
    playerChoice: string,
    applyBids: boolean,
    conflict: ConflictInput,
    opponentChoices: { [id: string]: string },
    playerInfo: PlayerInfo
): ConflictResult {
    // No opponents = automatic win
    if (conflict.opponents.length === 0) {
        return {
            winnerId: localPlayerId,
            isDraw: false,
            restart: false,
            evictAll: false,
            shareRewards: false,
            successfulBids: [],
            logs: ['Area secured without opposition.'],
        };
    }

    // Build choices array with the local player's dynamic ID
    const choices = [
        {
            id: localPlayerId,
            choice: playerChoice,
            bid: conflict.playerActor.bid,
            isPlayer: true,
        },
        ...conflict.opponents.map(opp => ({
            id: opp.actorId,
            choice: opponentChoices[opp.actorId],
            bid: opp.bid,
            isPlayer: false,
        })),
    ];

    // ─── RPS Resolution ──────────────────────────────────────
    const nonDummys = choices.filter(c => c.choice !== 'dummy');

    let isDraw = false;
    let winnerType: string | null = null;
    let winners: typeof choices = [];

    if (nonDummys.length === 0) {
        isDraw = true;
    } else {
        const counts = { rock: 0, paper: 0, scissors: 0 };
        nonDummys.forEach(c => {
            if (counts[c.choice as keyof typeof counts] !== undefined) {
                counts[c.choice as keyof typeof counts]++;
            }
        });

        const presentTypes = Object.keys(counts).filter(
            k => counts[k as keyof typeof counts] > 0
        );

        if (presentTypes.length === 1) {
            winnerType = presentTypes[0];
        } else if (presentTypes.length === 3) {
            isDraw = true;
        } else {
            const [t1, t2] = presentTypes;
            if (
                (t1 === 'rock' && t2 === 'scissors') ||
                (t1 === 'scissors' && t2 === 'paper') ||
                (t1 === 'paper' && t2 === 'rock')
            ) {
                winnerType = t1;
            } else {
                winnerType = t2;
            }
        }

        winners = isDraw ? [] : nonDummys.filter(c => c.choice === winnerType);
    }

    let finalWinnerId = winners.length === 1 ? winners[0].id : null;
    let finalIsDraw = isDraw || winners.length > 1;
    let finalRestart = false;
    let finalEvictAll = false;
    let finalShareRewards = false;
    const logs: string[] = [];

    // ─── Log the conflict ──────────────────────────────────────
    const playerName = playerInfo.name || 'Player';
    const p1ActorType = conflict.playerActor.actorType?.toUpperCase() || 'ACTOR';
    const p1ChoiceStr = choices.find(c => c.id === localPlayerId)?.choice?.toUpperCase() || 'UNKNOWN';
    const oppDetails = conflict.opponents.map(opp => {
        const oppChoice = choices.find(c => c.id === opp.actorId)?.choice?.toUpperCase() || 'UNKNOWN';
        const oppActorType = opp.actorType?.toUpperCase() || 'ACTOR';
        return `${opp.name || 'Opponent'} used ${oppActorType} with ${oppChoice}`;
    });

    const locName = conflict.locationName || 'Unknown Location';
    logs.push(
        `Conflict at ${locName.toUpperCase()}: ${playerName} used ${p1ActorType} with ${p1ChoiceStr}. Opponents: ${oppDetails.join(', ')}.`
    );

    const successfulBids: { actorId: string; bid: string }[] = [];

    // ─── Bid Processing ────────────────────────────────────────
    if (applyBids) {
        // 1. Recycle (Draw) Bids
        if (finalIsDraw) {
            const recycleBidders = choices.filter(c => c.bid === 'recycle');
            if (recycleBidders.length > 0) {
                if (recycleBidders.length === 1) {
                    const winner = recycleBidders[0];
                    const winnerName = winner.id === localPlayerId
                        ? playerName
                        : (conflict.opponents.find(o => o.actorId === winner.id)?.name || 'Opponent');
                    const actorType = winner.id === localPlayerId
                        ? p1ActorType
                        : (conflict.opponents.find(o => o.actorId === winner.id)?.actorType?.toUpperCase() || 'ACTOR');
                    logs.push(`Recycle Bid Activated: ${winnerName}'s ${actorType} wins the draw!`);
                    finalWinnerId = winner.id;
                    finalIsDraw = false;
                } else {
                    logs.push('Multiple Recycle Bids Activated: Conflict remains a draw!');
                }
                recycleBidders.forEach(b => successfulBids.push({ actorId: b.id, bid: 'recycle' }));
            }
        }

        // 2. Product (Win) Bids
        if (finalWinnerId) {
            const winnerObj = choices.find(c => c.id === finalWinnerId);
            if (winnerObj && winnerObj.bid === 'product') {
                const winnerName = winnerObj.id === localPlayerId
                    ? playerName
                    : (conflict.opponents.find(o => o.actorId === winnerObj.id)?.name || 'Opponent');
                const actorType = winnerObj.id === localPlayerId
                    ? p1ActorType
                    : (conflict.opponents.find(o => o.actorId === winnerObj.id)?.actorType?.toUpperCase() || 'ACTOR');
                logs.push(`Product Bid Activated: ${winnerName}'s ${actorType} secures +1 resource!`);
                successfulBids.push({ actorId: winnerObj.id, bid: 'product' });
            }
        }

        // 3. Energy (Lose) Bids
        if (!finalIsDraw && finalWinnerId) {
            const energyLosers = choices.filter(c => c.id !== finalWinnerId && c.bid === 'energy');
            if (energyLosers.length > 0) {
                energyLosers.forEach(b => {
                    const loserName = b.id === localPlayerId
                        ? playerName
                        : (conflict.opponents.find(o => o.actorId === b.id)?.name || 'Opponent');
                    const actorType = b.id === localPlayerId
                        ? p1ActorType
                        : (conflict.opponents.find(o => o.actorId === b.id)?.actorType?.toUpperCase() || 'ACTOR');
                    logs.push(`Energy Bid Activated: ${loserName}'s ${actorType} averted defeat! Conflict restarts without bets.`);
                    successfulBids.push({ actorId: b.id, bid: 'energy' });
                });
                finalRestart = true;
                finalWinnerId = null;
            }
        }
    }

    // ─── Actor-Type-Specific Draw Rules ────────────────────────
    if (finalIsDraw && !finalRestart) {
        const actorType = conflict.playerActor.actorType?.toLowerCase() || '';

        if (actorType === 'politician') {
            logs.push('Politicians clash in debate: Conflict must be re-resolved.');
            finalRestart = true;
        } else if (actorType === 'artist') {
            logs.push('Artists refuse to compromise: All Artists leave the location.');
            finalEvictAll = true;
        } else if (actorType === 'scientist' || actorType === 'robot') {
            logs.push(`${actorType}s find common ground: All remain and share the location.`);
            finalShareRewards = true;
        }
    }

    return {
        winnerId: finalWinnerId,
        isDraw: finalIsDraw,
        restart: finalRestart,
        evictAll: finalEvictAll,
        shareRewards: finalShareRewards,
        successfulBids,
        usedBid: successfulBids.length > 0 ? successfulBids[0].bid : undefined,
        logs,
    };
}
