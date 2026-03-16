import { NextRequest, NextResponse } from 'next/server';
import { citizenService } from '@/lib/services';

// GET: Check if address is registered
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const citizens = await citizenService.getAll();
    const citizen = citizens.find(c => c.address.toLowerCase() === address.toLowerCase());

    if (citizen) {
        return NextResponse.json(citizen);
    } else {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}

// POST: Register a new citizen
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, name } = body;

        if (!address || !name) {
            return NextResponse.json({ error: 'Address and Name required' }, { status: 400 });
        }

        const citizens = await citizenService.getAll();

        // Check if already exists
        if (citizens.find(c => c.address.toLowerCase() === address.toLowerCase())) {
            return NextResponse.json({ error: 'Citizen already exists' }, { status: 409 });
        }

        // Generate ID (6 digit random)
        let newId = Math.floor(100000 + Math.random() * 900000).toString();
        // Simple collision check
        while (citizens.find(c => c.citizenId === newId)) {
            newId = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const newCitizen = {
            address,
            name,
            citizenId: newId,
            joinedAt: new Date().toISOString(),
            avatar: "/avatars/golden_avatar.png",
            isOnline: true,
            lastActive: new Date().toISOString()
        };

        await citizenService.update(newId, newCitizen);

        return NextResponse.json(newCitizen);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update citizen status (online/offline)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, status } = body;

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        const citizens = await citizenService.getAll();
        const citizen = citizens.find(c => c.address.toLowerCase() === address.toLowerCase());

        if (!citizen) {
            return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
        }

        const updatedCitizen = await citizenService.update(citizen.citizenId, {
            isOnline: status === 'online',
            lastActive: new Date().toISOString()
        });

        return NextResponse.json(updatedCitizen);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
