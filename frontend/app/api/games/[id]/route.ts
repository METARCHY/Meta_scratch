import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/gameService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const game = gameService.getById(params.id);
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

        let game = gameService.getById(params.id);
        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        if (action === 'join') {
            if (!player) {
                return NextResponse.json({ error: 'Player data required' }, { status: 400 });
            }
            try {
                game = gameService.addPlayer(params.id, { ...player, joinedAt: Date.now() }) || game;
            } catch (e: any) {
                return NextResponse.json({ error: e.message }, { status: 400 });
            }
        } else if (action === 'update' && updates) {
            game = gameService.update(params.id, updates) || game;
        }

        return NextResponse.json(game);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }
}
