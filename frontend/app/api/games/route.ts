import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/gameService';
import { Game } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { formatLog } from '@/lib/logUtils';

export async function GET() {
    try {
        const games = gameService.getAll();
        return NextResponse.json(games);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, roomName, maxPlayers, hostPlayer, isPrivate } = body;

        if (!roomName || !hostPlayer) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const allGames = gameService.getAll();
        const displayId = (allGames.length + 1).toString().padStart(3, '0');

        const gameId = id || uuidv4();
        const newGame: Game = {
            id: gameId,
            displayId,
            roomId: roomName,
            status: 'waiting',
            isPrivate: !!isPrivate,
            createdAt: Date.now(),
            players: [
                { ...hostPlayer, joinedAt: Date.now() }
            ],
            maxPlayers: maxPlayers || 4,
            bidAmount: 0,
            logs: [formatLog(displayId, `GAME CREATED BY ${hostPlayer.name}`)],
            transactions: [],
            messages: []
        };

        const createdGame = gameService.create(newGame);
        return NextResponse.json(createdGame, { status: 201 });
    } catch (error) {
        console.error("Error creating game:", error);
        return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }
}
