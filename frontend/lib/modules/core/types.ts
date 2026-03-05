/**
 * @module core/types
 * Shared type definitions for the entire Metarchy game.
 * All modules import types from here — never define game types elsewhere.
 */

// ─── Actor Types ───────────────────────────────────────────────────
export type ActorType = 'politician' | 'scientist' | 'artist' | 'robot';

export interface ActorDefinition {
    id: string;
    type: ActorType;
    name: string;
    avatar: string;
    headAvatar: string;
}

// ─── Arguments (RPS) ──────────────────────────────────────────────
export type ArgumentType = 'rock' | 'paper' | 'scissors' | 'dummy';

// ─── Resources & Values ───────────────────────────────────────────
export type ResourceType = 'product' | 'energy' | 'recycle';
export type ValueType = 'power' | 'art' | 'knowledge';
export type GloryType = 'glory';

/** All trackable resource/value keys */
export type ResourceKey = ResourceType | ValueType | GloryType | 'gato';

export interface PlayerResources {
    gato: number;
    product: number;
    energy: number;
    recycle: number;
    power: number;
    art: number;
    knowledge: number;
    glory: number;
    vp?: number;
}

// ─── Locations ────────────────────────────────────────────────────
export type LocationType = 'intangible' | 'material';

export interface LocationDefinition {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    image: string;
    hint: string | null;
    activeHint: string | null;
    resource: string;
    type: LocationType;
}

// ─── Bets ─────────────────────────────────────────────────────────
/** Bet type maps to the resource spent */
export type BetType = 'product' | 'energy' | 'recycle';

// ─── Placed Actors (Board State) ──────────────────────────────────
export interface PlacedActor {
    actorId: string;
    playerId: string;
    locId: string;
    type: ArgumentType;        // The RPS argument assigned
    actorType: ActorType;
    name: string;
    avatar: string;
    headAvatar: string;
    isOpponent?: boolean;
    bid?: BetType;
}

// ─── Conflicts ────────────────────────────────────────────────────
export type ConflictStatus = 'pending' | 'resolved';

export interface Conflict {
    id: string;
    locId: string;             // Unique conflict key: `${locationId}_${actorType}`
    realLocId: string;         // Actual location ID on the board
    actorType: ActorType;
    locationName: string;
    playerActor: PlacedActor;
    opponents: (PlacedActor & { name: string; playerAvatar?: string })[];
    resourceType: string;
    isPeaceful: boolean;       // No opponents at this location
    hasPlayer: boolean;        // Does the local player have an actor here?
    status: ConflictStatus;
}

export interface ConflictResult {
    winnerId: string | null;
    isDraw: boolean;
    restart: boolean;
    evictAll: boolean;
    shareRewards: boolean;
    successfulBids: { actorId: string; bid: string }[];
    usedBid?: string;
    logs: string[];
}

// ─── Action Cards ─────────────────────────────────────────────────
export type ActionCardType = 'turn off location' | 'action';

export interface ActionCardDefinition {
    id: string;
    title: string;
    icon: string;
    type: ActionCardType;
    disables?: string;         // Location ID this card disables
    desc: string;
    flavor: string;
}

export interface ActionCardInstance extends ActionCardDefinition {
    instanceId: string;        // Unique instance (e.g., "relocation_1")
}

// ─── Event Cards ──────────────────────────────────────────────────
export type EventType = 'compare' | 'discard';

export interface EventCardDefinition {
    id: string;
    title: string;
    flavor: string;
    desc: string;
    image: string;
    type: EventType;
    targetResource: string;
    winCondition?: 'min' | 'max';
    reward: string;
}

// ─── Players ──────────────────────────────────────────────────────
export interface GamePlayer {
    id: string;
    name: string;
    address?: string;
    citizenId?: string;
    avatar: string;
    color?: string;
    joinedAt?: number;
    isReady?: boolean;
}

export interface OpponentData {
    id: string;
    resources: PlayerResources;
    cards: Record<string, number>;
}

// ─── Game Phases ──────────────────────────────────────────────────
export type PhaseNumber = 1 | 2 | 3 | 4 | 5;
export type Phase3Step = 1 | 2 | 3 | 4;   // Bidding | Stop | Relocation | Exchange
export type Phase5Step = 1 | 2 | 3;       // Market Offer | Market Reveal | Buy Cards

export interface TurnState {
    turn: number;
    phase: PhaseNumber;
    p3Step: Phase3Step;
    p5Step: Phase5Step;
    isGameOver: boolean;
}

// ─── Game (Server-side record) ────────────────────────────────────
export interface Game {
    id: string;
    displayId?: string;
    roomId: string;
    status: 'waiting' | 'playing' | 'finished' | 'deleted';
    isPrivate: boolean;
    createdAt: number;
    players: GamePlayer[];
    maxPlayers: number;
    bidAmount: number;
    winner?: string;
    logs: string[];
    transactions: GameTransaction[];
    messages: ChatMessage[];
    startTime?: number;
    isTest?: boolean;
    deletedAt?: number;
    gameState?: {
        phaseTicker: number;
        playerReady: Record<string, boolean>;
        stagedActors: Record<string, PlacedActor[]>;
    };
}

export interface GameTransaction {
    id: string;
    type: string;
    timestamp: number;
    details: any;
}

export interface ChatMessage {
    sender: string;
    avatar: string;
    content: string;
    timestamp: number;
}

// ─── Market ───────────────────────────────────────────────────────
export interface MarketOffer {
    give: ResourceKey;
    want: ResourceKey;
    amount: number;
}
