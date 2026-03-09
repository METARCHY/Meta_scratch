import { LOCATIONS, ALLOWED_MOVES } from '@/data/gameConstants';

/**
 * Simulates bot actions during Phase 3 (Action Cards Phase).
 */
export const triggerBotPhase3Actions = async (
    game: any,
    step: number,
    opponents: any[],
    placedActors: any[],
    addLog: (msg: string) => Promise<void>,
    setDisabledLocations: (cb: (prev: string[]) => string[]) => void,
    setPlacedActors: (cb: (prev: any[]) => any[]) => void,
    setOpponentsReady: (ready: boolean) => void,
    setPendingRelocations?: (cb: (prev: any[]) => any[]) => void,
    botActionCommits?: Record<string, number[]>
) => {
    if (!game?.isTest) return; // Only process bots in test mode

    for (const opp of opponents) {
        // Bots only play action cards if they actually have them.
        // In a normal game start, bots have NO action cards (same rule as players).
        // botActionCommits tracks which steps bots have cards for (determined at p3Step=0).
        const botCommits = botActionCommits?.[opp.id] || [];
        const botHasCardForStep = botCommits.includes(step);

        // Only act if bot committed to this step (i.e., had a card for it)
        if (botHasCardForStep && Math.random() < 0.5) {
            if (step === 1) { // Stopping Locations — only if bot played a Block card
                const targetLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                setDisabledLocations(prev => [...prev, targetLoc.id]);
                await addLog(`${opp.name} activated Under Construction - ${targetLoc.name.toUpperCase()} is now DISABLED`);
            } else if (step === 2) { // Relocation — only if bot played a Relocation card
                const botActors = placedActors.filter(a => a.playerId === opp.id);
                if (botActors.length > 0) {
                    const actorToMove = botActors[Math.floor(Math.random() * botActors.length)];
                    const allowed = ALLOWED_MOVES[actorToMove.actorType] || [];
                    const targetLoc = allowed[Math.floor(Math.random() * allowed.length)] || actorToMove.locId;

                    if (setPendingRelocations) {
                        setPendingRelocations(prev => [...prev, {
                            playerId: opp.id,
                            actorId: actorToMove.actorId,
                            targetLocId: targetLoc
                        }]);
                    }
                }
            } else if (step === 3) { // Exchange — only if bot played a Change Values card
                const resTypes = ['POWER', 'ART', 'KNOWLEDGE'];
                const give = resTypes[Math.floor(Math.random() * 3)];
                let take = resTypes[Math.floor(Math.random() * 3)];
                while (take === give) take = resTypes[Math.floor(Math.random() * 3)];

                await addLog(`${opp.name} used Change of Values: exchanged ${give} for ${take} with the Bank`);
            }
        }
        await new Promise(r => setTimeout(r, 800));
    }
    // Signal that all bots are done with this step
    setOpponentsReady(true);
};

/**
     * Resolves conflicts where ONLY bots are present in a location (Phase 4).
     */
export const resolveBotOnlyConflicts = async (
    placedActors: any[],
    disabledLocations: string[],
    resolvedConflicts: string[],
    dynamicPlayers: any[],
    localPlayerId: string,
    addLog: (msg: string) => Promise<void>,
    setOpponentsData: (cb: (prev: any) => any) => void,
    setPlacedActors: (cb: (prev: any[]) => any[]) => void,
    setResolvedConflicts: (cb: (prev: string[]) => string[]) => void
) => {
    const groups: { [key: string]: any[] } = {};
    placedActors.forEach(p => {
        if (disabledLocations.includes(p.locId)) return;
        const key = `${p.locId}_${p.actorType}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    });

    for (const [key, actors] of Object.entries(groups)) {
        if (resolvedConflicts.includes(key)) continue;
        if (actors.some(a => a.playerId === localPlayerId)) continue;

        const [locId, actorType] = key.split('_');
        const locDef = LOCATIONS.find(l => l.id === locId);
        const realLocName = locDef?.name || locId.toUpperCase();

        if (actors.length === 1) {
            const bot = actors[0];
            const botName = dynamicPlayers.find(p => p.id === bot.playerId)?.name || 'Bot';
            const actorTypeName = bot.actorType.charAt(0).toUpperCase() + bot.actorType.slice(1);

            let resource = '';
            if (bot.actorType === 'politician') resource = 'Power';
            else if (bot.actorType === 'scientist') resource = 'Knowledge';
            else if (bot.actorType === 'artist') resource = 'Art';
            else if (bot.actorType === 'robot') resource = (locDef?.resource || 'product').charAt(0).toUpperCase() + (locDef?.resource || 'product').slice(1);

            await addLog(`${botName}'s ${actorTypeName} has no rivals at ${realLocName}. They secured 1 ${resource}!`);

            setOpponentsData(prev => {
                const next = { ...prev };
                if (!next[bot.playerId]) return prev;
                const res = { ...next[bot.playerId].resources } as any;
                const resKey = resource.toLowerCase();
                res[resKey] = (res[resKey] || 0) + 1;
                next[bot.playerId] = { ...next[bot.playerId], resources: res };
                return next;
            });
        } else {
            const tokens = ['ROCK', 'PAPER', 'SCISSORS'];
            const bot1 = actors[0];
            const bot2 = actors[1];

            const t1 = tokens[Math.floor(Math.random() * 3)];
            const t2 = tokens[Math.floor(Math.random() * 3)];

            const b1Name = dynamicPlayers.find(p => p.id === bot1.playerId)?.name || 'Bot 1';
            const b2Name = dynamicPlayers.find(p => p.id === bot2.playerId)?.name || 'Bot 2';

            const actorTypeName = bot1.actorType.charAt(0).toUpperCase() + bot1.actorType.slice(1);

            await addLog(`Conflict at ${realLocName}: ${b1Name}'s ${actorTypeName} (${t1}) vs ${b2Name}'s ${actorTypeName} (${t2})`);

            if (t1 === t2) {
                await addLog(`It's a DRAW at ${realLocName}! Both ${actorTypeName}s were evicted.`);
                setPlacedActors(prev => prev.filter(a => !(a.locId === locId && a.actorType === bot1.actorType)));
            } else {
                const wins: any = { 'ROCK': 'SCISSORS', 'SCISSORS': 'PAPER', 'PAPER': 'ROCK' };
                const winner = wins[t1] === t2 ? bot1 : bot2;
                const winnerName = dynamicPlayers.find(p => p.id === winner.playerId)?.name || 'Bot';

                let resource = '';
                if (winner.actorType === 'politician') resource = 'Power';
                else if (winner.actorType === 'scientist') resource = 'Knowledge';
                else if (winner.actorType === 'artist') resource = 'Art';
                else if (winner.actorType === 'robot') resource = (locDef?.resource || 'product').charAt(0).toUpperCase() + (locDef?.resource || 'product').slice(1);

                await addLog(`${winnerName}'s ${actorTypeName} WON at ${realLocName} and secured 1 ${resource}!`);

                setOpponentsData(prev => {
                    const next = { ...prev };
                    if (!next[winner.playerId]) return prev;
                    const res = { ...next[winner.playerId].resources } as any;
                    if (resource) {
                        const resKey = resource.toLowerCase();
                        res[resKey] = (res[resKey] || 0) + 1;
                        next[winner.playerId] = { ...next[winner.playerId], resources: res };
                    }
                    return next;
                });
            }
        }
        // Mark as resolved ONLY if p1 not involved
        setResolvedConflicts(prev => [...prev, key]);
        await new Promise(r => setTimeout(r, 800));
    }
};

/**
 * Triggers initial opponent token placement (Phase 2).
 */
export const triggerOpponentPlacements = async (
    game: any,
    AUTO_PLACEMENTS: any[],
    PLAYERS: any[],
    setOpponentsReady: (ready: boolean) => void,
    setPlacedActors: (cb: (prev: any[]) => any[]) => void,
    setOpponentsData: (cb: (prev: any) => any) => void,
    addLog: (msg: string) => Promise<void>
) => {
    if (!game || !game.isTest) return; // Only run bot placements in a dedicated test game

    setOpponentsReady(false); // Reset before starting

    await new Promise(r => setTimeout(r, 1500));

    // Map hardcoded bot IDs to actual joined bot IDs if in test mode
    const botMap: Record<string, string> = {};
    if (game.isTest) {
        botMap['p2'] = 'bot-1';
        botMap['p3'] = 'bot-2';
        botMap['p4'] = 'bot-3'; // Just in case
    }

    const opponentActions = AUTO_PLACEMENTS.map(action => ({
        ...action,
        playerId: botMap[action.playerId] || action.playerId
    }));

    for (const action of opponentActions) {
        setPlacedActors(prev => {
            if (prev.some(p => p.actorId === action.actorId)) return prev;
            return [...prev, action];
        });

        // Update opponent resources if bid is placed
        if (action.bid) {
            setOpponentsData(prev => {
                const next = { ...prev };
                if (!next[action.playerId]) return prev;
                const oppRes = { ...next[action.playerId].resources };
                oppRes[action.bid] = Math.max(0, (oppRes[action.bid] || 0) - 1);
                next[action.playerId] = { ...next[action.playerId], resources: oppRes };
                return next;
            });
        }
        // Resolve name from game players if possible
        const playerInfo = game.players.find((p: any) => (p.citizenId || p.address) === action.playerId);
        const playerName = playerInfo?.name || PLAYERS.find(p => p.id === action.playerId)?.name || action.playerId;
        const betText = action.bid ? ` (Bet on ${action.bid === 'product' ? 'WIN' : action.bid === 'electricity' ? 'LOSE' : 'DRAW'})` : "";
        await addLog(`${playerName} placed ${action.name} with ${action.type.toUpperCase()} to ${action.locId.toUpperCase()}${betText}`);

        await new Promise(r => setTimeout(r, 600)); // Increased delay for stability
    }

    await new Promise(r => setTimeout(r, 600));
    await new Promise(r => setTimeout(r, 600));

    // Signal readiness ONLY at the end
    setOpponentsReady(true);
};
