"use client";

import { useGameState } from "@/context/GameStateContext";
import Image from "next/image";
import { TopBar } from "./TopBar";

interface GameHUDProps {
    turn?: number;
    phase?: string;
    phaseName?: string;
}

export function GameHUD({ turn = 1, phase = "1", phaseName = "EVENT" }: GameHUDProps) {
    const { resources, player } = useGameState();

    return (
        <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">

            {/* Left: Player Avatar (Reusing TopBar's style or custom for Game) */}
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="w-16 h-16 rounded-full border-2 border-[#d4af37] bg-black overflow-hidden shadow-lg relative group cursor-pointer transition-transform hover:scale-105">
                    <Image
                        src={player.avatar || "/actors/mask_lady.png"}
                        width={64}
                        height={64}
                        alt="Avatar"
                        className="object-cover"
                    />
                </div>
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold font-mono text-white drop-shadow-md">{player.name}</h2>
                    <span className="text-xs text-[#d4af37]/80 tracking-widest uppercase">Citizen Spec</span>
                </div>
            </div>

            {/* Center: Resources */}
            <div className="glass px-8 py-3 rounded-full border border-white/10 flex items-center gap-8 bg-black/60 backdrop-blur-md shadow-2xl mt-2 pointer-events-auto">
                <ResourceIcon src="/resources/resource_energy.png" value={resources.electricity} label="NRG" color="text-yellow-200" />
                <ResourceIcon src="/resources/resource_product.png" value={resources.product} label="BIO" color="text-green-400" />
                {/* Note: 'product' seemed to map to BIO in the hardcoded version, checking context later */}
                <ResourceIcon src="/resources/resource_Recycle.png" value={resources.recycling} label="MAT" color="text-red-400" />
            </div>

            {/* Right: Turn Info */}
            <div className="flex flex-col items-end pointer-events-auto">
                <div className="text-xs font-bold text-[#d4af37] uppercase tracking-widest mb-1 shadow-black drop-shadow-sm">
                    Turn {turn} • Phase {phase}
                </div>
                <div className="text-2xl font-bold text-white tracking-widest shadow-black drop-shadow-md">
                    {phaseName}
                </div>
            </div>

        </div>
    );
}

function ResourceIcon({ src, value, label, color }: { src: string, value: number, label: string, color: string }) {
    return (
        <div className="flex flex-col items-center gap-1 group cursor-help transition-transform hover:-translate-y-1">
            <div className="w-6 h-6 relative">
                <Image src={src} width={24} height={24} alt={label} className="object-contain drop-shadow" />
            </div>
            <span className={`text-xs font-bold ${color}`}>{value}</span>
        </div>
    );
}
