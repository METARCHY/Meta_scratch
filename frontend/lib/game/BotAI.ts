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
                setDisabledLocations(prev => {
                    if (prev.includes(targetLoc.id)) return prev;
                    return [...prev, targetLoc.id];
                });
                await addLog(`${opp.name} activated Construction Work - ${targetLoc.name.toUpperCase()} is now DISABLED`);
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
                const resTypes = ['power', 'art', 'knowledge'];
                const give = resTypes[Math.floor(Math.random() * 3)];
                let take = resTypes[Math.floor(Math.random() * 3)];
                while (take === give) take = resTypes[Math.floor(Math.random() * 3)];

                await addLog(`${opp.name} used Change Values: exchanged ${give.toUpperCase()} for ${take.toUpperCase()}`);
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
    _deprecated_AUTO_PLACEMENTS: any[], // Keeping signature for compatibility but ignoring
    PLAYERS: any[],
    setOpponentsReady: (ready: boolean) => void,
    setPlacedActors: (cb: (prev: any[]) => any[]) => void,
    setOpponentsData: (cb: (prev: any) => any) => void,
    addLog: (msg: string) => Promise<void>,
    opponentsData: any
) => {
    if (!game || !game.isTest) return; 

    setOpponentsReady(false); 
    await new Promise(r => setTimeout(r, 1500));

    const botIdentities = [
        { id: 'bot-1', name: 'Viper' },
        { id: 'bot-2', name: 'Ghost' },
        { id: 'bot-3', name: 'Union' }
    ];

    const actorDefinitions = [
        { type: "politician", name: "Politician", avatar: "/actors/Polotican.png", headAvatar: "/actors/Politican_head.png" },
        { type: "robot", name: "Robot", avatar: "/actors/Robot.png", headAvatar: "/actors/Robot_head.png" },
        { type: "scientist", name: "Scientist", avatar: "/actors/Scientist.png", headAvatar: "/actors/Scientist_head.png" },
        { type: "artist", name: "Artist", avatar: "/actors/Artist.png", headAvatar: "/actors/Artist_head.png" }
    ];

    const rspTokens = ['rock', 'paper', 'scissors'];
    const bidTypes = ['product', 'electricity', 'recycling'];

    // Get bots actually in the game
    const botsInGame = game.players.filter((p: any) => (p.citizenId || '').startsWith('bot-'));
    
    // If no bots in game players (test mode fallback), use botIdentities
    const activeBots = botsInGame.length > 0 ? botsInGame : botIdentities;

    for (const bot of activeBots) {
        const botId = bot.citizenId || bot.id;
        const botName = bot.name;

        // Shuffle arguments so they are assigned randomly to actors
        const availableArgs = [...rspTokens, 'dummy'].sort(() => Math.random() - 0.5);
        
        // Get actual bot resources from opponentsData
        const botResources = opponentsData[botId]?.resources || {};

        for (let i = 0; i < actorDefinitions.length; i++) {
            const def = actorDefinitions[i];
            
            // Respect ALLOWED_MOVES for each actor type
            const allowedIds = ALLOWED_MOVES[def.type as keyof typeof ALLOWED_MOVES] || [];
            const validLocs = LOCATIONS.filter(l => allowedIds.includes(l.id));
            const loc = validLocs[Math.floor(Math.random() * validLocs.length)] || LOCATIONS[0];
            
            const token = availableArgs.pop()!; // Take one unique argument (R, P, S, or Dummy)
            
            // Smart Bidding Logic:
            // 1. Specialized Dummy Rules:
            //    - Robot Dummy -> DRAW (recycling)
            //    - Other Dummy -> LOSE (electricity)
            // 2. Probabilistic choice (50% chance to skip even if resources exist)
            // 3. Must have resources
            let bid = null;
            const skipBidProb = Math.random() < 0.5;

            if (!skipBidProb) {
                if (token === 'dummy') {
                    // Specialized Dummy Logic
                    const targetBid = def.type === 'robot' ? 'recycling' : 'electricity';
                    if ((botResources[targetBid] || 0) > 0) {
                        bid = targetBid;
                    }
                } else {
                    // Non-Dummy: Random valid bid
                    const possibleBids = bidTypes.filter(bt => (botResources[bt] || 0) > 0);
                    if (possibleBids.length > 0) {
                        bid = possibleBids[Math.floor(Math.random() * possibleBids.length)];
                    }
                }
            }
            
            const action = {
                actorId: `${botId}_a${i}_${Date.now()}`,
                playerId: botId,
                locId: loc.id,
                type: token,
                isOpponent: true,
                name: def.name,
                actorType: def.type,
                avatar: def.avatar,
                headAvatar: def.headAvatar,
                bid: bid
            };

            setPlacedActors(prev => [...prev, action]);

            // Deduction logic for bidding
            if (bid) {
                setOpponentsData(prev => {
                    const next = { ...prev };
                    if (!next[botId]) return prev;
                    const oppRes = { ...next[botId].resources };
                    oppRes[bid] = Math.max(0, (oppRes[bid] || 0) - 1);
                    next[botId] = { ...next[botId], resources: oppRes };
                    return next;
                });
            }

            const betText = bid ? ` (Bet on ${bid === 'product' ? 'WIN' : bid === 'electricity' ? 'LOSE' : 'DRAW'})` : "";
            const tokenIcon = token === 'dummy' ? '🎭 DUMMY' : token.toUpperCase();
            await addLog(`${botName} placed ${def.name} with ${tokenIcon} to ${loc.id.toUpperCase()}${betText}`);

            await new Promise(r => setTimeout(r, 600)); 
        }
    }

    await new Promise(r => setTimeout(r, 600));
    setOpponentsReady(true);
};
