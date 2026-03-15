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
        isParticipant?: boolean;
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
    const allPotentialParticipants = [
        {
            id: localPlayerId,
            choice: playerChoice,
            bid: conflict.playerActor.bid,
            actorType: conflict.playerActor.actorType?.toLowerCase() || 'actor',
            name: playerInfo.name || 'Player',
            isParticipant: conflict.playerActor.isParticipant !== false
        },
        ...conflict.opponents.map(opp => ({
            id: opp.actorId,
            choice: opponentChoices[opp.actorId],
            bid: opp.bid,
            actorType: opp.actorType?.toLowerCase() || 'actor',
            name: opp.name || 'Opponent',
            isParticipant: true // Opponents are already filtered by the caller (ConflictResolutionView)
        })),
    ];

    const participants = allPotentialParticipants.filter(p => p.isParticipant);

    // Pairwise result tracker
    const matchResults: Record<string, Record<string, 'win' | 'lose' | 'draw'>> = {};
    participants.forEach(p1 => {
        matchResults[p1.id] = {};
        participants.forEach(p2 => {
            if (p1.id === p2.id) {
                matchResults[p1.id][p2.id] = 'draw';
                return;
            }

            // Logic for a single match
            const c1 = p1.choice;
            const c2 = p2.choice;

            if (c1 === c2) {
                matchResults[p1.id][p2.id] = 'draw';
            } else if (
                (c1 === 'rock' && (c2 === 'scissors' || c2 === 'dummy')) ||
                (c1 === 'paper' && (c2 === 'rock' || c2 === 'dummy')) ||
                (c1 === 'scissors' && (c2 === 'paper' || c2 === 'dummy'))
            ) {
                matchResults[p1.id][p2.id] = 'win';
            } else {
                matchResults[p1.id][p2.id] = 'lose';
            }
        });
    });

    let winnerIds: string[] = [];
    let loserIds: string[] = [];
    let survivorIds: string[] = [];
    let tieIds: string[] = [];
    let isDraw = false;

    // Determine outcomes based on pairs
    participants.forEach(p => {
        const results = Object.entries(matchResults[p.id]).filter(([otherId]) => otherId !== p.id);
        const hasWins = results.some(([_, res]) => res === 'win');
        const hasLoses = results.some(([_, res]) => res === 'lose');
        const allDraws = results.every(([_, res]) => res === 'draw');

        if (hasWins) {
            if (!hasLoses) {
                winnerIds.push(p.id);
                survivorIds.push(p.id);
            } else {
                survivorIds.push(p.id);
            }
        } else if (allDraws) {
            isDraw = true;
            survivorIds.push(p.id);
        } else if (hasLoses) {
            if (p.bid === 'electricity') {
                survivorIds.push(p.id);
            } else {
                loserIds.push(p.id);
            }
        }
    });

    // --- SECOND PASS: Clear Winner Hierarchy ---
    if (winnerIds.length > 0) {
        survivorIds = survivorIds.filter(id => {
            const isClearWinner = winnerIds.includes(id);
            const player = participants.find(p => p.id === id);
            const isElectricitySave = player?.bid === 'electricity';
            if (isClearWinner || isElectricitySave) return true;
            if (!loserIds.includes(id)) loserIds.push(id);
            return false;
        });
    }

    // Determine Ties (those who reached the highest tier in this iteration)
    if (isDraw) {
        tieIds = [...survivorIds];
    } else if (survivorIds.length > 1) {
        // If no winnerIds but mixed results led to survivors, they tied
        tieIds = [...survivorIds];
    }

    // Handle Draws (Mixed or True)
    if (survivorIds.length > 1) {
        const trueDraw = survivorIds.every(s1 => 
            survivorIds.every(s2 => matchResults[s1][s2] === 'draw')
        );
        // Stalemate: No one is a clear winner (e.g. RPS circle where everyone has wins and losses)
        const stalemate = winnerIds.length === 0;

        if (trueDraw || stalemate) isDraw = true;
    } else if (survivorIds.length === 0 && participants.length > 0) {
        isDraw = true;
    }

    let finalWinnerId: string | null = null;
    let finalRestart = false;
    let finalEvictAll = false;
    let finalShareRewards = false;

    // --- Bid Processing (Only on Round 1) ---
    if (applyBids) {
        // 1. Recycling (Draw) Bids
        if (isDraw) {
            const recyclingBidders = participants.filter(p => p.bid === 'recycling');
            if (recyclingBidders.length === 1) {
                const b = recyclingBidders[0];
                logs.push(`Recycling Bid: ${b.name}'s ${b.actorType.toUpperCase()} wins the Draw!`);
                finalWinnerId = b.id;
                isDraw = false;
                tieIds = [];
                survivorIds = [b.id];
                loserIds = participants.filter(p => p.id !== b.id).map(p => p.id);
            } else if (recyclingBidders.length > 1) {
                logs.push('Multiple Recycling Bids: Conflict remains a Draw!');
            }
            recyclingBidders.forEach(b => successfulBids.push({ actorId: b.id, bid: 'recycling' }));
        }

        // 2. Electricity (Lose) Bids
        const electricityBidders = participants.filter(p => p.bid === 'electricity');
        if (electricityBidders.length > 0) {
            let triggeredRestart = false;
            electricityBidders.forEach(b => {
                const resultsAgainstSurvivors = Object.entries(matchResults[b.id])
                    .filter(([otherId]) => otherId !== b.id && survivorIds.includes(otherId));
                const lostAgainstSurvivor = resultsAgainstSurvivors.some(([_, res]) => res === 'lose');
                const isClearLoser = loserIds.includes(b.id);
                if (lostAgainstSurvivor || isClearLoser) {
                    logs.push(`Electricity Bid: ${b.name}'s ${b.actorType.toUpperCase()} averted defeat! Restarting...`);
                    successfulBids.push({ actorId: b.id, bid: 'electricity' });
                    if (!survivorIds.includes(b.id)) survivorIds.push(b.id);
                    loserIds = loserIds.filter(id => id !== b.id);
                    triggeredRestart = true;
                }
            });
            if (triggeredRestart) finalRestart = true;
        }

        // 3. Product (Win) Bids
        if (!isDraw) {
            participants.forEach(p => {
                if (p.bid === 'product') {
                    const hasMatchWin = Object.values(matchResults[p.id]).includes('win');
                    if (hasMatchWin) {
                        logs.push(`Product Bid: ${p.name} secures +1 resource bonus!`);
                        successfulBids.push({ actorId: p.id, bid: 'product' });
                    }
                }
            });
        }
    }

    // --- Actor-Type Rules & Iteration ---
    if (isDraw && survivorIds.length > 1) {
        const actorType = participants[0].actorType;
        if (actorType === 'politician' || actorType === 'player') {
            logs.push('Conflict stall: Reroll required.');
            finalRestart = true;
        } else if (actorType === 'artist') {
            logs.push('Artists refuse to compromise: All exit.');
            finalEvictAll = true;
            // CRITICAL FIX: loserIds should NOT contain those who tied (tieIds)
            // They are evicted but their status is DRAW
            loserIds = participants.filter(p => !tieIds.includes(p.id)).map(p => p.id);
            survivorIds = [];
        } else if (actorType === 'scientist' || actorType === 'robot') {
            logs.push(`${actorType.toUpperCase()}s sharing location.`);
            finalShareRewards = true;
        }
    } else if (!isDraw && survivorIds.length > 1) {
        logs.push(`Multi-Winner Tie: ${survivorIds.length} actors remain for re-roll.`);
        finalRestart = true;
    } else if (survivorIds.length === 1 && !isDraw) {
        finalWinnerId = survivorIds[0];
    }

    return {
        winnerId: finalWinnerId,
        loserIds,
        survivorIds,
        tieIds,
        isDraw,
        restart: finalRestart,
        evictAll: finalEvictAll,
        shareRewards: finalShareRewards,
        successfulBids: successfulBids.length > 0 ? successfulBids : [],
        logs,
    };
}
