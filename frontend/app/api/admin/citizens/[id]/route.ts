import { NextRequest, NextResponse } from 'next/server';
import { citizenService } from '@/lib/services';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await request.json();

        const updatedCitizen = await citizenService.update(id, body);
        if (!updatedCitizen) {
            return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
        }

        return NextResponse.json(updatedCitizen);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update citizen' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const success = await citizenService.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete citizen' }, { status: 500 });
    }
}
