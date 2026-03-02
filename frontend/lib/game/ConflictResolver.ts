export interface ConflictResult {
    winnerId: string | null;
    isDraw: boolean;
    restart: boolean;
    evictAll: boolean;
    shareRewards: boolean;
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
            usedBid: undefined,
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

    const counts = { rock: 0, paper: 0, scissors: 0 };
    choices.forEach(c => {
        if (counts[c.choice as keyof typeof counts] !== undefined) {
            counts[c.choice as keyof typeof counts]++;
        }
    });

    const presentTypes = Object.keys(counts).filter(k => counts[k as keyof typeof counts] > 0);
    let winnerType = null;
    let isDraw = false;

    if (presentTypes.length === 1 || presentTypes.length === 3) {
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

    const winners = isDraw ? [] : choices.filter(c => c.choice === winnerType);

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

    const p1ChoiceObj = choices.find(c => c.id === 'p1');
    const p1Bid = applyBids ? p1ChoiceObj?.bid : undefined;
    let usedBid: string | undefined = undefined;

    let p1Won = finalWinnerId === 'p1';
    let p1Lost = !p1Won && !finalIsDraw;

    if (p1Bid === 'recycle' && finalIsDraw) {
        logs.push("Recycle Bid Activated: Player wins the draw!");
        finalWinnerId = 'p1';
        finalIsDraw = false;
        p1Won = true;
        p1Lost = false;
        usedBid = 'recycle';
    }

    if (p1Bid === 'energy' && p1Lost) {
        logs.push("Energy Bid Activated: Defeat averted, conflict restarts.");
        finalRestart = true;
        usedBid = 'energy';
        return { winnerId: null, isDraw: false, restart: true, evictAll: false, shareRewards: false, usedBid, logs };
    }

    if (p1Bid === 'product' && p1Won) {
        usedBid = 'product';
    }

    if (finalIsDraw) {
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
        usedBid,
        logs
    };
};
