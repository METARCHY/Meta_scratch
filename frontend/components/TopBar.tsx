"use client";

import { User, Coins } from "lucide-react";
import { useGameState } from "@/context/GameStateContext";

export function TopBar() {
    const { resources, player } = useGameState();

    return (
        <div className="fixed top-0 right-0 p-6 z-50 flex gap-4 items-start">
            {/* Balance Tag */}
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2 text-amber-400 font-mono text-sm border border-amber-400/20">
                <Coins size={16} />
                <span>{resources.gato.toLocaleString()} GATO</span>
            </div>

            {/* User Profile */}
            <div className="flex flex-col items-end">
                <div className="glass pl-4 pr-1 py-1 rounded-full flex items-center gap-3 border border-white/10">
                    <div className="flex flex-col items-end leading-none mr-2">
                        <span className="font-bold text-sm">{player.name}</span>
                        <span className="text-xs text-gray-400 font-mono">({player.address})</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 border-2 border-white/20 overflow-hidden relative">
                        {/* Avatar Image Placeholder */}
                        <div className="absolute inset-0 bg-black/20" />
                        <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80" />
                    </div>
                </div>
            </div>
        </div>
    );
}
