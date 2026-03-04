export interface ConflictResult {
    winnerId: string | null;
    isDraw: boolean;
    restart: boolean;
    evictAll: boolean;
    shareRewards: boolean;
    successfulBids: { actorId: string, bid: string }[];
    usedBid?: string;
    logs: string[];
}

export const resolveConflictLogic = (
    playerChoice: string,
    applyBids: boolean,
    conflict: {
        opponents: any[];
        playerActor: any;
        locationName?: string;
    },
    opponentChoices: { [id: string]: string },
    player: any
): ConflictResult => {
    if (conflict.opponents.length === 0) {
        return {
            winnerId: 'p1',
            isDraw: false,
            restart: false,
            evictAll: false,
            shareRewards: false,
            successfulBids: [],
            logs: ["Area secured without opposition."]
        };
    }

    const choices = [
        { id: 'p1', choice: playerChoice, bid: conflict.playerActor.bid, isPlayer: true },
        ...conflict.opponents.map(opp => ({
            id: opp.actorId,
            choice: opponentChoices[opp.actorId],
            bid: opp.bid,
            isPlayer: false
        }))
    ];

    const nonDummys = choices.filter(c => c.choice !== 'dummy');

    let isDraw = false;
    let winnerType: string | null = null;
    let winners: any[] = [];

    if (nonDummys.length === 0) {
        // Only Dummys were played
        isDraw = true;
    } else {
        // At least one person picked R/P/S. All dummys automatically lose.
        const counts = { rock: 0, paper: 0, scissors: 0 };
        nonDummys.forEach(c => {
            if (counts[c.choice as keyof typeof counts] !== undefined) {
                counts[c.choice as keyof typeof counts]++;
            }
        });

        const presentTypes = Object.keys(counts).filter(k => counts[k as keyof typeof counts] > 0);

        if (presentTypes.length === 1) {
            // Everyone (who didn't pick Dummy) picked the exact same thing
            winnerType = presentTypes[0];
        } else if (presentTypes.length === 3) {
            // Rock, Paper, AND Scissors were all played
            isDraw = true;
        } else {
            // Exactly two types, check RPS rules
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

    const p1ActorType = conflict.playerActor.actorType?.toUpperCase() || 'ACTOR';
    const p1ChoiceStr = choices.find(c => c.id === 'p1')?.choice?.toUpperCase() || 'UNKNOWN';
    const oppDetails = conflict.opponents.map(opp => {
        const oppChoice = choices.find(c => c.id === opp.actorId)?.choice?.toUpperCase() || 'UNKNOWN';
        const oppActorType = opp.actorType?.toUpperCase() || 'ACTOR';
        return `${opp.name || 'Opponent'} used ${oppActorType} with ${oppChoice}`;
    });

    const locName = conflict.locationName || 'Unknown Location';
    logs.push(`Conflict at ${locName.toUpperCase()}: ${player.name || '080'} used ${p1ActorType} with ${p1ChoiceStr}. Opponents: ${oppDetails.join(', ')}.`);

    const successfulBids: { actorId: string, bid: string }[] = [];

    if (applyBids) {
        // 1. Check Recycle (Draw) Bids
        if (finalIsDraw) {
            const recycleBidders = choices.filter(c => c.bid === 'recycle');
            if (recycleBidders.length > 0) {
                if (recycleBidders.length === 1) {
                    const winner = recycleBidders[0];
                    const winnerName = winner.id === 'p1' ? (player.name || '080') : (conflict.opponents.find(o => o.actorId === winner.id)?.name || 'Opponent');
                    const actorType = winner.id === 'p1' ? p1ActorType : (conflict.opponents.find(o => o.actorId === winner.id)?.actorType?.toUpperCase() || 'ACTOR');
                    logs.push(`Recycle Bid Activated: ${winnerName}'s ${actorType} wins the draw!`);
                    finalWinnerId = winner.id;
                    finalIsDraw = false;
                } else {
                    logs.push("Multiple Recycle Bids Activated: Conflict remains a draw!");
                }
                recycleBidders.forEach(b => successfulBids.push({ actorId: b.id, bid: 'recycle' }));
            }
        }


        // 2. Check Product (Win) Bids
        if (finalWinnerId) {
            const winnerObj = choices.find(c => c.id === finalWinnerId);
            if (winnerObj && winnerObj.bid === 'product') {
                const winnerName = winnerObj.id === 'p1' ? (player.name || '080') : (conflict.opponents.find(o => o.actorId === winnerObj.id)?.name || 'Opponent');
                const actorType = winnerObj.id === 'p1' ? p1ActorType : (conflict.opponents.find(o => o.actorId === winnerObj.id)?.actorType?.toUpperCase() || 'ACTOR');
                logs.push(`Product Bid Activated: ${winnerName}'s ${actorType} secures +1 resource!`);
                successfulBids.push({ actorId: winnerObj.id, bid: 'product' });
            }
        }


        // 3. Check Energy (Lose) Bids
        if (!finalIsDraw && finalWinnerId) {
            const energyLosers = choices.filter(c => c.id !== finalWinnerId && c.bid === 'energy');
            if (energyLosers.length > 0) {
                energyLosers.forEach(b => {
                    const loserName = b.id === 'p1' ? (player.name || '080') : (conflict.opponents.find(o => o.actorId === b.id)?.name || 'Opponent');
                    const actorType = b.id === 'p1' ? p1ActorType : (conflict.opponents.find(o => o.actorId === b.id)?.actorType?.toUpperCase() || 'ACTOR');
                    logs.push(`Energy Bid Activated: ${loserName}'s ${actorType} averted defeat! Conflict restarts without bets.`);
                    successfulBids.push({ actorId: b.id, bid: 'energy' });
                });
                finalRestart = true;
                finalWinnerId = null;
            }
        }

    }

    if (finalIsDraw && !finalRestart) {
        const actorType = conflict.playerActor.actorType.toLowerCase();

        if (actorType === 'politician') {
            logs.push("Politicians clash in debate: Conflict must be re-resolved.");
            finalRestart = true;
        } else if (actorType === 'artist') {
            logs.push("Artists refuse to compromise: All Artists leave the location.");
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
        successfulBids: successfulBids,
        usedBid: successfulBids.length > 0 ? successfulBids[0].bid : undefined,
        logs
    };
};
