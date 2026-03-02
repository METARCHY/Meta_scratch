import { Dispatch, SetStateAction } from 'react';

/**
 * Handles the advancement of game phases and sub-steps in Metarchy Game.
 */
export const handleNextPhase = (
    turn: number,
    phase: number,
    p3Step: number,
    player: any,
    dynamicPlayers: any[],
    addLog: (msg: string) => Promise<void>,
    triggerBotPhase3ActionsWrapper: (step: number) => Promise<void>,
    setPhase: Dispatch<SetStateAction<number>>,
    setP3Step: Dispatch<SetStateAction<1 | 2 | 3 | 4>>,
    setP5Step: Dispatch<SetStateAction<1 | 2 | 3>>,
    setTurn: Dispatch<SetStateAction<number>>,
    setPlacedActors: Dispatch<SetStateAction<any[]>>,
    setResolvedConflicts: Dispatch<SetStateAction<string[]>>,
    setDisabledLocations: Dispatch<SetStateAction<string[]>>
) => {
    if (turn === 7 && phase === 5) {
        alert("GAME FINISH");
        return;
    }

    // Phase 3 Sub-step Logic
    if (phase === 3) {
        if (p3Step < 4) {
            const nextStep = (p3Step + 1) as 1 | 2 | 3 | 4;
            setP3Step(nextStep);
            const stepNames = ["", "BIDDING", "STOPPING LOCATIONS", "RELOCATION", "EXCHANGE"];
            addLog(`${player.name || '080'} advanced to ${stepNames[nextStep]}`);

            // Log opponents ready for the next sub-step
            const mainPlayerId = player.citizenId || player.address || 'p1';
            dynamicPlayers.filter(p => p.id !== mainPlayerId).forEach(opp => {
                addLog(`${opp.name} is ready for ${stepNames[nextStep]}`);
            });

            triggerBotPhase3ActionsWrapper(nextStep);
            return;
        }
    }

    if (phase < 5) {
        const nextPhase = phase + 1;
        setPhase(nextPhase);
        // Reset P3 step when leaving P3
        if (nextPhase !== 3) setP3Step(1);
        if (nextPhase === 5) setP5Step(1);

        if (nextPhase === 5) {
            // Remove all actors from the board at the end of Phase 4
            setPlacedActors([]);
            setResolvedConflicts([]);
            // Clear any locations disabled by action cards this turn
            setDisabledLocations([]);
        }

        addLog(`${player.name || '080'} ready`);
        const mainPlayerId = player.citizenId || player.address || 'p1';
        dynamicPlayers.filter(p => p.id !== mainPlayerId).forEach(opp => {
            addLog(`${opp.name} ready`);
        });
        addLog(`PHASE ${nextPhase}`);
    } else {
        setPhase(1);
        setP3Step(1);
        setTurn(t => t + 1);
        setPlacedActors([]); // Safety clearing for next turn
        setDisabledLocations([]); // Safety clearing for next turn
        addLog(`TURN ${turn + 1} BEGINS`);
    }
};
