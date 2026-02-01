import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/gameService';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await request.json();

        const updatedGame = gameService.update(id, body);
        if (!updatedGame) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json(updatedGame);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const success = gameService.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
    }
}
