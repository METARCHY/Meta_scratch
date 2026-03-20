import { Dispatch, SetStateAction } from 'react';
import { LOCATIONS } from '@/data/gameConstants';
import { calculateVictoryPoints } from '@/lib/modules/resources/resourceManager';

/**
 * Handles the advancement of game phases and sub-steps in Metarchy Game.
 */
export const handleNextPhase = (
    turn: number,
    phase: number,
    p3Step: 0 | 1 | 2 | 3 | 4,
    player: any,
    dynamicPlayers: any[],
    placedActors: any[],
    disabledLocations: string[],
    addLog: (msg: string) => Promise<void>,
    triggerBotPhase3ActionsWrapper: (step: number) => Promise<void>,
    setPhase: Dispatch<SetStateAction<number>>,
    setP3Step: Dispatch<SetStateAction<0 | 1 | 2 | 3 | 4>>,
    setP5Step: Dispatch<SetStateAction<1 | 2 | 3>>,
    setTurn: Dispatch<SetStateAction<number>>,
    setPlacedActors: Dispatch<SetStateAction<any[]>>,
    setResolvedConflicts: Dispatch<SetStateAction<string[]>>,
    setDisabledLocations: Dispatch<SetStateAction<string[]>>,
    setOpponentsReady: Dispatch<SetStateAction<boolean>>,
    allActionCommits?: Record<string, number[]>, // New: tracks which steps have cards for which player
    isTest?: boolean
): { newPhase: number, newTurn: number, isGameOver: boolean, winners: { id: string, name: string, vp: number }[] } => {
    let nextPhase = phase;
    let nextTurn = turn;
    let nextP3Step: 0 | 1 | 2 | 3 | 4 = p3Step;

    // --- 1. Determine Next Physical State ---

    // Phase 3 Sub-step Logic
    if (phase === 3) {
        const stepNames = ["SELECTION", "BLOCKING LOCATIONS", "RELOCATION", "CHANGE VALUES", "SUMMARY"];
        const getNextValidStep = (current: number): 0 | 1 | 2 | 3 | 4 => {
            if (!allActionCommits) return (current + 1) as 0 | 1 | 2 | 3 | 4;
            for (let s = current + 1; s <= 3; s++) {
                const anyCommit = Object.values(allActionCommits).some(steps => Array.isArray(steps) && steps.includes(s));
                if (anyCommit) return s as 0 | 1 | 2 | 3 | 4;
                addLog(`SKIPPING ${stepNames[s]}: No cards played.`);
            }
            return 4;
        };

        if (p3Step < 4) {
            nextP3Step = getNextValidStep(p3Step) as 0 | 1 | 2 | 3 | 4;
            setP3Step(nextP3Step);
            
            if (nextP3Step < 4) {
                addLog("All players are ready");
                addLog(`STEP: ${stepNames[nextP3Step]}`);
                setOpponentsReady(false);
                triggerBotPhase3ActionsWrapper(nextP3Step);
            } else {
                addLog("ACTION PHASE CONCLUDED");
                setOpponentsReady(true);
            }
            // If it's just a step change, we don't finish turn or phase 4 yet
            return { newPhase: phase, newTurn: turn, isGameOver: false, winners: [] };
        }
    }

    // Normal Phase/Turn Advancement
    if (phase < 5) {
        nextPhase = phase + 1;
        setPhase(nextPhase);
        if (nextPhase !== 3) setP3Step(0);
        if (nextPhase === 5) setP5Step(3); // Skip Player Exchange in Phase 5 for now

        if (nextPhase === 5) {
            setPlacedActors([]);
            setResolvedConflicts([]);
            setDisabledLocations([]);
            setOpponentsReady(true);
        } else if (nextPhase === 4) {
            // Log detailing conflicts
            const locIdsWithActors = Array.from(new Set(placedActors.map(a => a.locId))).filter(id => !disabledLocations.includes(id));
            locIdsWithActors.forEach(locId => {
                const actorsAtLoc = placedActors.filter(a => a.locId === locId);
                const types = Array.from(new Set(actorsAtLoc.map(a => a.actorType)));
                types.forEach(type => {
                    const actorsOfType = actorsAtLoc.filter(a => a.actorType === type);
                    if (actorsOfType.length > 0) {
                        const locName = (LOCATIONS.find(l => l.id === locId)?.name || locId).toUpperCase();
                        const pName = actorsOfType[0].playerId === (player.citizenId || 'p1') ? (player.name || '080') : (dynamicPlayers.find(p => p.id === actorsOfType[0].playerId)?.name || 'Bot');
                        const detail = actorsOfType.length > 1
                            ? `${pName}'s ${type.toUpperCase()} faces opposition from ${actorsOfType.slice(1).map(a => (dynamicPlayers.find(p => p.id === a.playerId)?.name || 'Bot')).join(', ')}`
                            : `${pName}'s ${type.toUpperCase()} is undisputed`;
                        addLog(`Confrontation at ${locName}: ${detail}.`);
                    }
                });
            });
            setOpponentsReady(true);
        } else if (nextPhase === 3) {
            addLog("STEP: BLOCKING LOCATIONS");
            triggerBotPhase3ActionsWrapper(1);
            setOpponentsReady(false);
        }
        addLog(`PHASE ${nextPhase} BEGINS`);
    } else {
        nextTurn = turn + 1;
        setTurn(nextTurn);
        nextPhase = (nextTurn === 1) ? 2 : 1;
        setPhase(nextPhase);
        setP3Step(0);
        setPlacedActors([]);
        setDisabledLocations([]);
        setOpponentsReady(false);
        addLog(`TURN ${nextTurn} BEGINS`);
        if (nextPhase === 1) addLog(`PHASE 1 BEGINS`);
    }

    const maxTurns = 5; // Standardized to 5 turns for all game modes

    // --- 2. EVALUATE VICTORY (End of Phase 4 or 5 only) ---

    if (phase === 4 || phase === 5) {
        // If it's the last turn (default 5 or maxTurns), or if an extra tie-breaker turn just ended
        if (turn >= maxTurns) {
            addLog(`--- TURN ${turn} CONCLUDED: EVALUATING FINAL RESULTS ---`);
            const playerVP = calculateVictoryPoints(player.resources || {});
            const opponentVPs = dynamicPlayers.map(p => ({ 
                id: p.id, 
                name: p.name, 
                vp: calculateVictoryPoints(p.resources || {}) 
            }));
            
            const allResults = [{ id: player.citizenId || 'p1', name: player.name || '080', vp: playerVP }, ...opponentVPs];
            const topVP = Math.max(...allResults.map(v => v.vp));
            const potentialWinners = allResults.filter(v => v.vp === topVP);

            if (potentialWinners.length === 1) {
                addLog(`GAME FINISHED: ${potentialWinners[0].name.toUpperCase()} WINS WITH ${topVP} VP!`);
                // Standard: Game ends immediately after Phase 4/5 if there's a single winner
                return { newPhase: phase, newTurn: turn, isGameOver: true, winners: potentialWinners };
            } else {
                // If it's a tie at the end of Phase 5, we move to next turn
                const tiePhase = phase === 4 ? nextPhase : 1;
                const tieTurn = phase === 4 ? nextTurn : turn + 1;

                addLog(`TIE DETECTED: ${potentialWinners.length} PLAYERS HAVE ${topVP} VP!`);
                addLog(`COMMENCING TIE-BREAKER: Turn ${tieTurn} will be the extra deciding turn.`);
                // Tie: Proceed to next phase/turn
                return { newPhase: tiePhase, newTurn: tieTurn, isGameOver: false, winners: potentialWinners };
            }
        }
    }

    return { newPhase: nextPhase, newTurn: nextTurn, isGameOver: false, winners: [] };
};
