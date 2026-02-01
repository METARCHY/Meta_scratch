"use client";

import { TopBar } from "@/components/TopBar";
import { Shield, Zap, Brain, Trophy } from "lucide-react";

const ACTORS = [
    {
        id: 1,
        name: "The Masked Oracle",
        role: "Mystic",
        image: "/actors/mask_lady.png", // User needs to place image here
        stats: { strength: 3, agility: 8, intelligence: 9 },
        description: "A master of deception and hidden truths. Her masks reveal the fate of her enemies.",
        rarity: "Legendary",
        color: "text-pink-500",
        borderColor: "border-pink-500"
    },
    {
        id: 2,
        name: "Ring Sentinel",
        role: "Guardian",
        image: "/actors/robot_ring.png", // User needs to place image here
        stats: { strength: 9, agility: 4, intelligence: 5 },
        description: "An ancient construct powered by a singularity core. Unbreakable and eternal.",
        rarity: "Epic",
        color: "text-amber-500",
        borderColor: "border-amber-500"
    },
    {
        id: 3,
        name: "Tech Weaver",
        role: "Technomancer",
        image: "/actors/tech_guy.png", // User needs to place image here
        stats: { strength: 4, agility: 6, intelligence: 10 },
        description: "He speaks to machines in their own tongue. The network bends to his will.",
        rarity: "Rare",
        color: "text-blue-500",
        borderColor: "border-blue-500"
    },
    {
        id: 4,
        name: "High Commander",
        role: "Leader",
        image: "/actors/commander_lady.png", // User needs to place image here
        stats: { strength: 7, agility: 7, intelligence: 8 },
        description: "Born to rule the stars. Her strategies are flawless, her will absolute.",
        rarity: "Epic",
        color: "text-red-500",
        borderColor: "border-red-500"
    }
];

export default function ActorsPage() {
    return (
        <main className="relative w-full min-h-screen bg-black text-white font-sans overflow-y-auto pb-20">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 fixed">
                <img
                    src="https://images.unsplash.com/photo-1518544806314-5360b7696b97?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-30 blur-sm"
                />
                <div className="absolute inset-0 bg-black/70" />
            </div>

            <TopBar />

            <div className="relative z-10 container mx-auto px-4 pt-24">

                <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-4">
                    <div>
                        <h1 className="text-4xl font-bold uppercase tracking-widest text-white mb-2">My Actors</h1>
                        <p className="text-gray-400">Manage your diverse team of agents.</p>
                    </div>
                    <div className="px-6 py-2 bg-[#d4af37]/10 border border-[#d4af37] text-[#d4af37] rounded font-bold">
                        4 / 4 Unlocked
                    </div>
                </div>

                {/* Actors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {ACTORS.map((actor) => (
                        <div key={actor.id} className={`group relative bg-black/40 border border-white/10 hover:border-[#d4af37] transition-all duration-300 rounded-xl overflow-hidden hover:-translate-y-2`}>

                            {/* Glow Effect on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#d4af37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Image Container */}
                            <div className="relative h-80 w-full bg-gradient-to-b from-gray-800 to-black p-4 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                                {/* Placeholder for actual image - styled to look good even if broken */}
                                <img
                                    src={actor.image}
                                    alt={actor.name}
                                    className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] z-10 transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        // Fallback if image not found
                                        (e.target as HTMLImageElement).src = "https://placehold.co/400x600/1a1a1a/FFF?text=Actor+" + actor.id;
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="p-6 relative z-20 bg-black/60 backdrop-blur-sm border-t border-white/5">
                                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${actor.color}`}>
                                    {actor.role} • {actor.rarity}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#d4af37] transition-colors">{actor.name}</h3>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="flex flex-col items-center p-2 bg-white/5 rounded">
                                        <Shield size={14} className="text-gray-400 mb-1" />
                                        <span className="text-xs font-bold">{actor.stats.strength}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 bg-white/5 rounded">
                                        <Zap size={14} className="text-gray-400 mb-1" />
                                        <span className="text-xs font-bold">{actor.stats.agility}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 bg-white/5 rounded">
                                        <Brain size={14} className="text-gray-400 mb-1" />
                                        <span className="text-xs font-bold">{actor.stats.intelligence}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                    {actor.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </main>
    );
}
