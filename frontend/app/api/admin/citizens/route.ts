import { NextRequest, NextResponse } from 'next/server';
import { citizenService } from '@/lib/services';

export async function GET() {
    try {
        const citizens = await citizenService.getAll();
        return NextResponse.json(citizens);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch citizens' }, { status: 500 });
    }
}
