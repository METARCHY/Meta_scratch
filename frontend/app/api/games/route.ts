import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/gameService';
import { Game } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

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

        const newGame: Game = {
            id: id || uuidv4(),
            roomId: roomName,
            status: 'waiting',
            isPrivate: !!isPrivate,
            createdAt: Date.now(),
            players: [
                { ...hostPlayer, joinedAt: Date.now() }
            ],
            maxPlayers: maxPlayers || 4,
            bidAmount: 0,
            logs: [`Game created by ${hostPlayer.name}`],
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
