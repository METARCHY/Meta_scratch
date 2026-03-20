import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/services';
import { formatLog } from '@/lib/logUtils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const game = await gameService.getById(params.id);
        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }
        return NextResponse.json(game);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { action, player, updates } = body;

        let game = await gameService.getById(params.id);
        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        if (action === 'join') {
            if (!player) {
                return NextResponse.json({ error: 'Player data required' }, { status: 400 });
            }
            try {
                const logs = [...(game.logs || []), formatLog(game.displayId || game.id, `${player.name} joined`)];
                const result = await gameService.addPlayer(params.id, { ...player, joinedAt: Date.now() });
                game = result || game;
                const updateResult = await gameService.update(params.id, { logs });
                game = updateResult || game;
            } catch (e: any) {
                return NextResponse.json({ error: e.message }, { status: 400 });
            }
        } else if (action === 'add-log' && body.message) {
            const formattedMsg = formatLog(game.displayId || game.id, body.message);
            const updateResult = await gameService.update(params.id, {
                logs: [...(game.logs || []), formattedMsg]
            });
            game = updateResult || game;
        } else if (action === 'sync-turn' && body.citizenId) {
            const state: any = game.gameState || {
                phaseTicker: 0,
                playerReady: {},
                stagedActors: {},
                playerResources: {}
            };

            state.playerReady[body.citizenId] = true;
            if (body.placedActors) {
                state.stagedActors[body.citizenId] = body.placedActors;
            }
            if (body.resources) {
                if (!state.playerResources) state.playerResources = {};
                state.playerResources[body.citizenId] = body.resources;
            }
            if (body.decisions) {
                if (!state.decisions) state.decisions = {};
                Object.assign(state.decisions, body.decisions);
            }
            if (body.playerInventories) {
                if (!state.playerInventories) state.playerInventories = {};
                Object.assign(state.playerInventories, body.playerInventories);
            }
            if (body.discardPile) {
                state.discardPile = body.discardPile;
            }

            if (body.currentPhase !== undefined) state.currentPhase = body.currentPhase;
            if (body.turn !== undefined) state.turn = body.turn;

            // Consensus check: only required for active players (handles tie-breaker elimination)
            const activePlayerIds = state.activePlayerIds || game.players.map((p: any) => p.citizenId || p.address || p.id);
            const readyPlayers = Object.keys(state.playerReady).filter(id => activePlayerIds.includes(id));
            const readyCount = readyPlayers.length;

            if (readyCount > 0 && readyCount >= activePlayerIds.length) {
                state.phaseTicker += 1;
                state.playerReady = {};
                // BUG FIX: Clear board state (stagedActors) when moving to next phase
                state.stagedActors = {};
                console.log(`[API] Phase ${state.phaseTicker} consensus reached. Phase: ${state.currentPhase}, Turn: ${state.turn}`);
            }

            const updateResult = await gameService.update(params.id, { gameState: state });
            game = updateResult || game;
        } else if (action === 'sync-decision' && body.citizenId && body.decisions) {
            const state: any = game.gameState || {
                phaseTicker: 0,
                playerReady: {},
                stagedActors: {},
                playerResources: {}
            };
            
            if (!state.decisions) state.decisions = {};
            // Group decisions by player for easier management
            if (!state.decisions[body.citizenId]) state.decisions[body.citizenId] = {};
            Object.assign(state.decisions[body.citizenId], body.decisions);

            const updateResultFinal = await gameService.update(params.id, { gameState: state });
            game = updateResultFinal || game;
        } else if (action === 'update' && updates) {
            const updateResult = await gameService.update(params.id, updates);
            game = updateResult || game;
        }

        return NextResponse.json(game);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }
}
