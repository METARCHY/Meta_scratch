import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/services';
import { ChatMessage } from '@/lib/types';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { sender, avatar, content } = body;

        if (!sender || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const game = await gameService.getById(params.id);
        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        const newMessage: ChatMessage = {
            sender,
            avatar: avatar || '/avatars/default.png',
            content,
            timestamp: Date.now()
        };

        if (!game.messages) game.messages = [];
        game.messages.push(newMessage);

        await gameService.update(params.id, { messages: game.messages });

        return NextResponse.json(newMessage);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
