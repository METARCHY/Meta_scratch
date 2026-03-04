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
    setP3Step: Dispatch<SetStateAction<1 | 2 | 3 | 4>>,
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
        if (isTest) return 3; // Test games end after 3 turns
        const playerCount = dynamicPlayers.length;
        if (playerCount === 4) return 8;
        if (playerCount === 5) return 6;
        return 7; // Default for 2, 3, 6 players
    })();

    if (turn >= maxTurns && phase === 5) {
        addLog("--- GAME FINISHED ---");
        isGameOver = true;
        // Log final scores for all players
        dynamicPlayers.forEach(p => {
            addLog(`${p.name} completed the game successfully.`);
        });
        return { newPhase, newTurn, isGameOver };
    }



    // Phase 3 Sub-step Logic
    if (phase === 3) {
        if (p3Step < 4) {
            const nextStep = (p3Step + 1) as 1 | 2 | 3 | 4;
            setP3Step(nextStep);
            const stepNames = ["", "BIDDING", "STOPPING LOCATIONS", "RELOCATION", "EXCHANGE"];
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
        if (newPhase !== 3) setP3Step(1);

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
            addLog("STEP: BIDDING");
            triggerBotPhase3ActionsWrapper(1);
        } else if (newPhase === 4) {
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
        // MVP: Skip Phase 1 (Events) for now and go straight to Phase 2 (Distribution)
        newPhase = 2;
        setPhase(newPhase);
        setP3Step(1);
        newTurn = turn + 1;
        setTurn(newTurn);
        setPlacedActors([]); // Safety clearing for next turn
        setDisabledLocations([]); // Safety clearing for next turn

        // CRITICAL: Reset bot readiness for the next turn
        setOpponentsReady(false);
        addLog(`TURN ${newTurn} BEGINS`);
    }

    return { newPhase, newTurn, isGameOver };
};
