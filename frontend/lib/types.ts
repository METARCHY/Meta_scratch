export interface Player {
    name: string;
    address: string;
    citizenId?: string;
    avatar?: string;
    joinedAt: number;
    isReady?: boolean; // New: Ready status
}

export interface ChatMessage {
    sender: string;
    avatar: string;
    content: string;
    timestamp: number;
}

export interface GameTransaction {
    id: string;
    type: string;
    timestamp: number;
    details: any;
}

export interface Game {
    id: string; // Game Hash
    roomId: string; // Readable name
    status: 'waiting' | 'starting' | 'playing' | 'finished';
    isPrivate: boolean;
    createdAt: number;
    players: Player[];
    maxPlayers: number;
    bidAmount: number; // GATO
    winner?: string; // CitizenId or Address
    logs: string[];
    transactions: GameTransaction[];
    messages: ChatMessage[]; // New: Chat history
    startTime?: number; // New: Game start timestamp
}
