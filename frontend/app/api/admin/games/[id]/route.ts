import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/services';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await request.json();

        const updatedGame = await gameService.update(id, body);
        if (!updatedGame) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json(updatedGame);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }
}

// Soft delete → if already soft-deleted, hard delete
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const game = await gameService.getById(id);

        let success: boolean;
        if (game?.status === 'deleted') {
            success = await gameService.hardDelete(id);
        } else {
            success = await gameService.delete(id);
        }

        if (!success) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
    }
}

// Restore from trash
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const success = await gameService.restore?.(id);

        if (!success) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to restore game' }, { status: 500 });
    }
}
