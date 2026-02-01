
export const EVENTS = [
    {
        id: "political_repression",
        title: "POLITICAL REPRESSION",
        flavor: "Silence is golden, but power speaks louder.",
        desc: "Compare Power. Player with the LEAST Power wins Glory.",
        image: "/events/event_riot_control.png",
        type: "compare",
        targetResource: "power", // Intangible
        winCondition: "min",
        reward: "glory"
    },
    {
        id: "educational_crisis",
        title: "EDUCATIONAL CRISIS",
        flavor: "The schools are empty, and the libraries are burning.",
        desc: "Compare Knowledge. Player with the LEAST Knowledge wins Glory.",
        image: "/events/event_cyber_city.png",
        type: "compare",
        targetResource: "knowledge",
        winCondition: "min",
        reward: "glory"
    },
    {
        id: "cultural_decline",
        title: "CULTURAL DECLINE",
        flavor: "When survival is the only goal, art is the first to die.",
        desc: "Compare Art. Player with the LEAST Art wins Glory.",
        image: "/events/event_magic_reader.jpg",
        type: "compare",
        targetResource: "art",
        winCondition: "min",
        reward: "glory"
    },
    {
        id: "revolution",
        title: "REVOLUTION",
        flavor: "The gears of history are turned by the blood of the oppressed.",
        desc: "Compare Power. Player with the MOST Power wins Glory.",
        image: "/events/event_revolution.png",
        type: "compare",
        targetResource: "power",
        winCondition: "max",
        reward: "glory"
    },
    {
        id: "help_poor",
        title: "HELP POOR COUNTRIES",
        flavor: "Charity is not a solution, but it is a start.",
        desc: "Discard Product. Player who discards the MOST wins an Action Card.",
        image: "/events/event_desert_trade.png",
        type: "discard",
        targetResource: "product",
        reward: "action_card"
    },
    {
        id: "earth_hour",
        title: "EARTH HOUR",
        flavor: "Darkness falls, but the stars shine brighter.",
        desc: "Discard Energy. Player who discards the MOST wins an Action Card.",
        image: "/events/event_ocean_platform.jpg",
        type: "discard",
        targetResource: "energy",
        reward: "action_card"
    },
    {
        id: "eco_crisis",
        title: "PREVENT ECO-CRISIS",
        flavor: "The planet is sick, and we are the cure.",
        desc: "Discard Recycle. Player who discards the MOST wins an Action Card.",
        image: "/events/event_discovery.png",
        type: "discard",
        targetResource: "recycle",
        reward: "action_card"
    }
];

export const LOCATIONS = [
    { id: "city", name: "City", x: 581, y: 178, width: 718, height: 598, image: "/locations/city.png", hint: null, activeHint: null, resource: "glory", type: "intangible" },
    { id: "square", name: "The Square", x: 156, y: 215, width: 718, height: 598, image: "/locations/square.png", hint: "/locations/square_hint0.png", activeHint: "/locations/square_active0.png", resource: "power", type: "intangible" },
    { id: "theatre", name: "The Theatre", x: 355, y: 491, width: 718, height: 598, image: "/locations/theatre.png", hint: "/locations/Theatre_hint0.png", activeHint: "/locations/Theatre_active0.png", resource: "art", type: "intangible" },
    { id: "university", name: "University", x: 384, y: -17, width: 718, height: 598, image: "/locations/university.png", hint: "/locations/uni_hint0.png", activeHint: "/locations/uni_active0.png", resource: "knowledge", type: "intangible" },
    // Material
    { id: "factory", name: "Factory", x: 823, y: 464, width: 718, height: 598, image: "/locations/factory.png", hint: "/locations/factory_hint0.png", activeHint: "/locations/factory_active0.png", resource: "product", type: "material" },
    { id: "energy", name: "Energy Station", x: 780, y: 6, width: 718, height: 598, image: "/locations/energy_station.png", hint: "/locations/energy_station_hint0.png", activeHint: "/locations/energy_station_active0.png", resource: "energy", type: "material" },
    { id: "dump", name: "Dump", x: 1015, y: 229, width: 718, height: 598, image: "/locations/dump.png", hint: "/locations/dump_hint0.png", activeHint: "/locations/Dump_active0.png", resource: "recycle", type: "material" },
];

export const ACTION_CARDS = [
    { id: "teleport", title: "Teleportation", icon: "/events/event_ocean_platform.jpg", count: 1, type: "action", flavor: "Keep limbs inside.", desc: "Teleport to another location." },
    { id: "change", title: "Change Resource", icon: "/actions/action_card_exchange.png", count: 2, type: "action", flavor: "Forced exchange.", desc: "Swap intangible resources." },
    // Phase 3 Stops
    { id: "student_strikes", title: "Student Strikes", icon: "/events/event_revolution.png", count: 0, type: "event", disables: "university", flavor: "No research today.", desc: "Disables University." },
    { id: "charity", title: "Charity Event", icon: "/actions/action_nonmat_priestess.png", count: 0, type: "event", disables: "theatre", flavor: "Private event.", desc: "Disables Theatre." },
];

// Helper to check for conflicts
export const getConflicts = (actors: any[]) => {
    const locations = Array.from(new Set(actors.map(a => a.locId)));
    const conflicts: any[] = [];

    locations.forEach(locId => {
        const atLoc = actors.filter(a => a.locId === locId);
        if (atLoc.length < 2) return;

        const types: { [key: string]: number } = {};
        atLoc.forEach(a => {
            const type = a.type || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });

        const hasConflict = Object.values(types).some(count => count > 1);

        if (hasConflict) {
            conflicts.push({
                id: `conflict_${locId}`,
                locId,
                actors: atLoc,
                status: 'pending'
            });
        }
    });
    return conflicts;
};

export const ALLOWED_MOVES: { [key: string]: string[] } = {
    'politician': ['square', 'university'],
    'scientist': ['university', 'theatre'],
    'artist': ['square', 'theatre'],
    'robot': ['factory', 'energy', 'dump']
};
