/**
 * @module core/constants
 * Game constants for Metarchy. All static game data lives here.
 * Import from '@/lib/modules/core/constants' throughout the app.
 */

import type {
    EventCardDefinition,
    LocationDefinition,
    ActionCardDefinition,
    ActorDefinition,
    ActorType,
} from './types';

// ─── Actor Definitions ────────────────────────────────────────────
export const ACTOR_TYPES: Record<ActorType, { name: string; avatar: string; headAvatar: string }> = {
    politician: { name: 'Politician', avatar: '/actors/Polotican.png', headAvatar: '/actors/Politican_head.png' },
    robot: { name: 'Robot', avatar: '/actors/Robot.png', headAvatar: '/actors/Robot_head.png' },
    scientist: { name: 'Scientist', avatar: '/actors/Scientist.png', headAvatar: '/actors/Scientist_head.png' },
    artist: { name: 'Artist', avatar: '/actors/Artist.png', headAvatar: '/actors/Artist_head.png' },
};

export const DEFAULT_ACTORS: ActorDefinition[] = [
    { id: 'a1', type: 'politician', ...ACTOR_TYPES.politician },
    { id: 'a3', type: 'scientist', ...ACTOR_TYPES.scientist },
    { id: 'a4', type: 'artist', ...ACTOR_TYPES.artist },
    { id: 'a2', type: 'robot', ...ACTOR_TYPES.robot },
];

// ─── Locations ────────────────────────────────────────────────────
export const LOCATIONS: LocationDefinition[] = [
    { id: 'city', name: 'City', x: 581, y: 178, width: 718, height: 598, image: '/locations/city.png', hint: null, activeHint: null, resource: 'glory', type: 'intangible' },
    { id: 'square', name: 'The Square', x: 156, y: 215, width: 718, height: 598, image: '/locations/square.png', hint: '/locations/square_hint0.png', activeHint: '/locations/square_active0.png', resource: 'power', type: 'intangible' },
    { id: 'theatre', name: 'The Theatre', x: 355, y: 491, width: 718, height: 598, image: '/locations/theatre.png', hint: '/locations/Theatre_hint0.png', activeHint: '/locations/Theatre_active0.png', resource: 'art', type: 'intangible' },
    { id: 'university', name: 'University', x: 384, y: -17, width: 718, height: 598, image: '/locations/university.png', hint: '/locations/uni_hint0.png', activeHint: '/locations/uni_active0.png', resource: 'knowledge', type: 'intangible' },
    { id: 'factory', name: 'Factory', x: 823, y: 464, width: 718, height: 598, image: '/locations/factory.png', hint: '/locations/factory_hint0.png', activeHint: '/locations/factory_active0.png', resource: 'product', type: 'material' },
    { id: 'energy', name: 'Energy Station', x: 780, y: 6, width: 718, height: 598, image: '/locations/energy_station.png', hint: '/locations/energy_station_hint0.png', activeHint: '/locations/energy_station_active0.png', resource: 'energy', type: 'material' },
    { id: 'dump', name: 'Dump', x: 1015, y: 229, width: 718, height: 598, image: '/locations/dump.png', hint: '/locations/dump_hint0.png', activeHint: '/locations/Dump_active0.png', resource: 'recycle', type: 'material' },
];

// ─── Allowed Moves (Actor → Location) ─────────────────────────────
export const ALLOWED_MOVES: { [key: string]: string[] } = {
    politician: ['square', 'university'],
    scientist: ['university', 'theatre'],
    artist: ['square', 'theatre'],
    robot: ['factory', 'energy', 'dump'],
};

// ─── Event Cards ──────────────────────────────────────────────────
export const EVENTS: EventCardDefinition[] = [
    { id: 'political_repression', title: 'POLITICAL REPRESSION', flavor: 'Silence is golden, but power speaks louder.', desc: 'Compare Power. Player with the LEAST Power wins Glory.', image: '/events/event_riot_control.png', type: 'compare', targetResource: 'power', winCondition: 'min', reward: 'glory' },
    { id: 'educational_crisis', title: 'EDUCATIONAL CRISIS', flavor: 'The schools are empty, and the libraries are burning.', desc: 'Compare Knowledge. Player with the LEAST Knowledge wins Glory.', image: '/events/event_cyber_city.png', type: 'compare', targetResource: 'knowledge', winCondition: 'min', reward: 'glory' },
    { id: 'cultural_decline', title: 'CULTURAL DECLINE', flavor: 'When survival is the only goal, art is the first to die.', desc: 'Compare Art. Player with the LEAST Art wins Glory.', image: '/events/event_magic_reader.jpg', type: 'compare', targetResource: 'art', winCondition: 'min', reward: 'glory' },
    { id: 'revolution', title: 'REVOLUTION', flavor: 'The gears of history are turned by the blood of the oppressed.', desc: 'Compare total Values (Power + Knowledge + Art). Player with the LOWEST total gains Fame (Glory).', image: '/events/event_revolution.png', type: 'compare_sum', targetResources: ['power', 'knowledge', 'art'], winCondition: 'min', reward: 'glory' },
    { id: 'help_poor', title: 'HELP POOR COUNTRIES', flavor: 'Charity is not a solution, but it is a start.', desc: 'Discard Product. Player who discards the MOST wins an Action Card.', image: '/events/event_desert_trade.png', type: 'discard', targetResource: 'product', reward: 'action_card' },
    { id: 'earth_hour', title: 'EARTH HOUR', flavor: 'Darkness falls, but the stars shine brighter.', desc: 'Discard Energy. Player who discards the MOST wins an Action Card.', image: '/events/event_ocean_platform.jpg', type: 'discard', targetResource: 'energy', reward: 'action_card' },
    { id: 'eco_crisis', title: 'PREVENT ECO-CRISIS', flavor: 'The planet is sick, and we are the cure.', desc: 'Discard Recycle. Player who discards the MOST wins an Action Card.', image: '/events/event_discovery.png', type: 'discard', targetResource: 'recycle', reward: 'action_card' },
];

// ─── Action Cards ─────────────────────────────────────────────────
export const ACTION_CARDS: ActionCardDefinition[] = [
    { id: 'under_construction', title: 'Under Construction', icon: '/actions/Under construction.png', type: 'turn off location', disables: 'square', desc: 'Disables The Square. No conflict or resources.', flavor: 'The foundation of progress often requires temporary silence.' },
    { id: 'charity', title: 'Charity Event', icon: '/actions/Charity Event.png', type: 'turn off location', disables: 'theatre', desc: 'Disables The Theatre. No conflict or resources.', flavor: 'Good intentions can be the best way to clear the room.' },
    { id: 'student_strikes', title: 'Student Strikes', icon: '/actions/Student strikes.png', type: 'turn off location', disables: 'university', desc: 'Disables University. No conflict or resources.', flavor: 'The next generation refuses to play their part today.' },
    { id: 'sabotage', title: 'Sabotage', icon: '/actions/Sabotage.png', type: 'turn off location', disables: 'factory', desc: 'Disables Factory. No conflict or resources.', flavor: 'A single loose bolt can halt the engine of empire.' },
    { id: 'blackout', title: 'Blackout', icon: '/actions/Blackout.png', type: 'turn off location', disables: 'energy', desc: 'Disables Energy Station. No conflict or resources.', flavor: 'Darkness is a canvas for those who work in the shadows.' },
    { id: 'eco_protest', title: 'Ecological Protest', icon: '/actions/Ecological Protest.png', type: 'turn off location', disables: 'dump', desc: 'Disables Dump. No conflict or resources.', flavor: "Mother Nature has its own way of saying 'enough'." },
    { id: 'relocation', title: 'Relocation', icon: '/actions/Teleportation.png', type: 'action', desc: 'Relocate an actor along with its RSP and bet.', flavor: 'Space is just a suggestion for the well-connected.' },
    { id: 'change_values', title: 'Change of Values', icon: '/actions/Change values.png', type: 'action', desc: 'Exchange an intangible resource with another player.', flavor: 'In the new era, even principles have a market price.' },
];

// ─── Game Configuration ───────────────────────────────────────────
export const DEFAULT_RESOURCES: Record<string, number> = {
    gato: 1000,
    product: 1, energy: 1, recycle: 1,
    power: 0, art: 0, knowledge: 0, glory: 0,
};

export const TEST_RESOURCES: Record<string, number> = {
    gato: 1000,
    product: 2, energy: 2, recycle: 2,
    power: 2, art: 2, knowledge: 2, glory: 2,
};

/** Max turns by player count */
export const MAX_TURNS: Record<number, number> = {
    2: 5,
    3: 5,
    4: 8,    // 2v2 long game
    5: 6,
};

export const TEST_MAX_TURNS = 3;

// ─── RPS Win Matrix ───────────────────────────────────────────────
/** Returns 'win' if a beats b, 'lose' if b beats a, 'draw' if equal */
export function rpsOutcome(a: string, b: string): 'win' | 'lose' | 'draw' {
    if (a === b) return 'draw';
    if (a === 'dummy') return 'lose';
    if (b === 'dummy') return 'win';
    if (
        (a === 'rock' && b === 'scissors') ||
        (a === 'scissors' && b === 'paper') ||
        (a === 'paper' && b === 'rock')
    ) return 'win';
    return 'lose';
}

// ─── Default Bot Players (Fallback) ──────────────────────────────
export const DEFAULT_BOT_PLAYERS = [
    { id: 'p2', name: 'Viper', avatar: '/avatars/viper.png', color: '#ff4444' },
    { id: 'p3', name: 'Ghost', avatar: '/avatars/ghost.png', color: '#44ff44' },
    { id: 'p4', name: 'Union', avatar: '/avatars/avatar_union.png', color: '#4444ff' },
];
