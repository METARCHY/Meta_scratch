import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/gameService';
import { Game } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { formatLog } from '@/lib/logUtils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';
        const games = gameService.getAll();
        return NextResponse.json(all ? games : games.filter(g => g.status !== 'deleted'));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, roomName, maxPlayers, hostPlayer, isPrivate, isTest } = body;

        if (!roomName || !hostPlayer) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const allGames = gameService.getAll();
        const displayId = (allGames.length + 1).toString().padStart(3, '0');

        const gameId = id || uuidv4();

        const players = [
            { ...hostPlayer, joinedAt: Date.now() }
        ];

        const newGame: Game = {
            id: gameId,
            displayId,
            roomId: roomName,
            status: 'waiting',
            isPrivate: !!isPrivate,
            isTest: !!isTest,
            createdAt: Date.now(),
            players: players,
            maxPlayers: isTest ? 3 : (maxPlayers || 4),
            bidAmount: 0,
            logs: [formatLog(displayId, `GAME CREATED BY ${hostPlayer.name}${isTest ? ' [TEST MODE]' : ''}`)],
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
