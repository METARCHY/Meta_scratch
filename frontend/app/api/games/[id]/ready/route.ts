import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/services';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { citizenId } = body;

        if (!citizenId) {
            return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
        }

        const game = await gameService.getById(params.id);
        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Toggle ready status
        const playerIndex = game.players.findIndex(p => p.citizenId === citizenId);
        if (playerIndex === -1) {
            return NextResponse.json({ error: 'Player not in game' }, { status: 403 });
        }

        game.players[playerIndex].isReady = !game.players[playerIndex].isReady;

        // Check if all players are ready and we have enough players (min 2?)
        // Constraint: Game starts if at least 2 players and ALL are ready.
        // Or strict: Game starts if players.length === maxPlayers AND all ready?
        // User request didn't specify strict logic, but implies "everyone is ready".
        // Let's assume >1 player needed.

        const allReady = game.players.every(p => p.isReady);
        // Fix: Ensure lobby is full before starting (User reported 3-player game starting with 2 players)
        const isLobbyFull = game.players.length === game.maxPlayers;

        let updates: any = { players: game.players };

        if (allReady && isLobbyFull && game.status === 'waiting') {
            updates.status = 'playing';
            updates.startTime = Date.now();
        }

        const updatedGame = await gameService.update(params.id, updates);
        return NextResponse.json(updatedGame);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
