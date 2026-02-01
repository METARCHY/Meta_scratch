import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the path to the JSON database
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'citizens.json');

// Interface for a Citizen record
interface Citizen {
    address: string;
    name: string;
    citizenId: string;
    joinedAt: string;
    avatar?: string;
}

// Helper to ensure DB exists
function ensureDB() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    }
}

// Helper to read DB
function readDB(): Citizen[] {
    ensureDB();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

// Helper to write DB
function writeDB(data: Citizen[]) {
    ensureDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// GET: Check if address is registered
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const citizens = readDB();
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

        const citizens = readDB();

        // Check if already exists
        if (citizens.find(c => c.address.toLowerCase() === address.toLowerCase())) {
            return NextResponse.json({ error: 'Citizen already exists' }, { status: 409 });
        }

        // Generate ID (6 digit random)
        let newId = Math.floor(100000 + Math.random() * 900000).toString();
        // Simple collision check (optional for small scale)
        while (citizens.find(c => c.citizenId === newId)) {
            newId = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const newCitizen: Citizen = {
            address,
            name,
            citizenId: newId,
            joinedAt: new Date().toISOString(),
            avatar: "/avatars/golden_avatar.png"
        };

        citizens.push(newCitizen);
        writeDB(citizens);

        return NextResponse.json(newCitizen);
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
