import { Dispatch, SetStateAction } from 'react';
import { LOCATIONS } from '@/data/gameConstants';

/**
 * Handles the advancement of game phases and sub-steps in Metarchy Game.
 */
export const handleNextPhase = (
    turn: number,
    phase: number,
    p3Step: number,
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
    isTest?: boolean
): { newPhase: number, newTurn: number, isGameOver: boolean } => {
    let newPhase = phase;
    let newTurn = turn;
    let isGameOver = false;

    // Calculate max turns based on player count
    const maxTurns = (() => {
        if (isTest) {
            addLog(`[DEBUG] Test mode detected - maxTurns = 5`);
            return 5;
        }
        const playerCount = dynamicPlayers.length;
        if (playerCount === 2 || playerCount === 3) return 5;
        if (playerCount === 4) return 6;
        return 5;
    })();

    // Helper to calculate VP for any player (consistent with fame distribution)
    const calculateVP = (res: any) => {
        const p = res.power, k = res.knowledge, a = res.art, f = res.fame;
        let totalFame = f;
        let pV = p, kV = k, aV = a;
        while (totalFame > 0) {
            if (pV <= kV && pV <= aV) pV++;
            else if (kV <= pV && kV <= aV) kV++;
            else aV++;
            totalFame--;
        }
        return Math.min(pV, kV, aV);
    };

    // --- WIN CONDITIONS (Checked at end of Phase 4) ---
    // CRITICAL: TRIGGER END GAME AT END OF TURN 5 PHASE 4
    if (phase === 4 && turn >= maxTurns) {
        addLog(`--- TURN ${turn} CONCLUDED: CALCULATING FINAL RESULTS ---`);
        const playerVP = calculateVP(player.resources || {});
        const opponentVPs = dynamicPlayers.map(p => ({ 
            id: p.id, 
            name: p.name, 
            vp: calculateVP(p.resources || {}) 
        }));
        
        const allResults = [{ id: player.citizenId || 'p1', name: player.name || '080', vp: playerVP }, ...opponentVPs];
        const topVP = Math.max(...allResults.map(v => v.vp));
        const winners = allResults.filter(v => v.vp === topVP);

        if (winners.length === 1) {
            addLog(`GAME FINISHED: ${winners[0].name.toUpperCase()} WINS WITH ${topVP} VP!`);
        } else {
            addLog(`GAME FINISHED: IT'S A DRAW WITH ${topVP} VP!`);
        }
        
        return { newPhase, newTurn, isGameOver: true };
    }



    // Phase 3 Sub-step Logic
    if (phase === 3) {
        if (p3Step < 3) {
            const nextStep = (p3Step + 1) as 0 | 1 | 2 | 3;
            setP3Step(nextStep);
            const stepNames = ["SELECTION", "BLOCKING LOCATIONS", "RELOCATION", "CHANGE VALUES"];
            addLog("All players are ready");
            addLog(`STEP: ${stepNames[nextStep]}`);

            triggerBotPhase3ActionsWrapper(nextStep);
            return { newPhase, newTurn, isGameOver };
        }
    }


    if (phase < 5) {
        newPhase = phase + 1;
        setPhase(newPhase);
        // Reset P3 step when leaving P3
        if (newPhase !== 3) setP3Step(0);

        // MVP: Skip Player Exchange (Steps 1 & 2) and go straight to Buy Action Card (Step 3)
        if (newPhase === 5) setP5Step(3);

        if (newPhase === 5) {
            // Remove all actors from the board at the end of Phase 4
            setPlacedActors([]);
            setResolvedConflicts([]);
            // Clear any locations disabled by action cards this turn
            setDisabledLocations([]);
        }

        if (newPhase === 3) {
            addLog("STEP: BLOCKING LOCATIONS");
            triggerBotPhase3ActionsWrapper(1);
        } 
        
        if (newPhase === 4) {
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
        } else {
            // For Phase 5
            setOpponentsReady(true);
        }

        addLog(`PHASE ${newPhase} BEGINS`);
    } else {
        newTurn = turn + 1;
        setTurn(newTurn);

        // Turn 1 skips Event Phase (1) straight to Distribution Phase (2).
        newPhase = (newTurn === 1) ? 2 : 1;
        setPhase(newPhase);
        setP3Step(0);

        setPlacedActors([]);
        setDisabledLocations([]);

        setOpponentsReady(false);
        addLog(`TURN ${newTurn} BEGINS`);
        if (newPhase === 1) addLog(`PHASE 1 BEGINS`);
    }

    return { newPhase, newTurn, isGameOver };
};
