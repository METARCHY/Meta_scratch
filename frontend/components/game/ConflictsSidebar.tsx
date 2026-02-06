"use client";

import React from 'react';
import { Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import ActorOrb from './ActorOrb';
import OtherPlayerActorMarker from './OtherPlayerActorMarker';

interface Conflict {
    locId: string;
    locationName: string;
    playerActor: any;
    opponents: any[];
}

interface ConflictsSidebarProps {
    conflicts: Conflict[];
    activeConflictLocId: string | null;
    onSelectConflict: (locId: string) => void;
}

export default function ConflictsSidebar({ conflicts, activeConflictLocId, onSelectConflict }: ConflictsSidebarProps) {
    if (conflicts.length === 0) return null;

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute right-[-40px] top-[calc(50%-300px)] -translate-y-1/2 z-[100] bg-[#0d0d12]/95 backdrop-blur-md border-l border-t border-b border-[#d4af37]/30 rounded-l-2xl p-4 flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden min-w-[320px] pointer-events-auto"
        >
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                <Swords className="w-5 h-5 text-[#d4af37] animate-pulse" />
                <h3 className="font-rajdhani font-bold text-[#d4af37] tracking-widest text-sm uppercase">Active Conflicts</h3>
            </div>

            <div className="flex flex-col gap-3">
                {conflicts.map((conflict) => {
                    const isActive = activeConflictLocId === conflict.locId;
                    return (
                        <button
                            key={conflict.locId}
                            onClick={() => onSelectConflict(conflict.locId)}
                            className={`
                                relative group flex items-start justify-between p-3 rounded-xl border transition-all duration-300 w-full text-left cursor-pointer
                                ${isActive
                                    ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                }
                            `}
                        >
                            {/* Location Label */}
                            <div className="flex items-start gap-3 w-full">

                                {/* 1. Main Player: Actor Orb (Scaled) */}
                                <div className="relative w-[60px] h-[60px] flex-shrink-0 -ml-2 -mt-2 pointer-events-none">
                                    <div className="scale-[0.45] origin-top-left absolute left-0 top-0">
                                        <ActorOrb
                                            actor={conflict.playerActor}
                                            isSelected={false}
                                            onSelect={() => { }} // No-op
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col flex-grow pointer-events-none">
                                    <span className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${isActive ? 'text-[#d4af37]' : 'text-gray-300'}`}>
                                        {conflict.playerActor.type}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-white/40 italic">VS</span>

                                        {/* 2. Opponents: HUD Markers (Scaled) */}
                                        <div className="flex flex-wrap gap-1">
                                            {conflict.opponents.map((opp, idx) => (
                                                <div key={idx} className="relative w-[40px] h-[40px]">
                                                    <div className="scale-[0.35] origin-top-left absolute left-0 top-0">
                                                        <OtherPlayerActorMarker
                                                            actor={opp}
                                                            playerAvatar={opp.playerAvatar}
                                                            bid={undefined}
                                                            phase={3}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status or Arrow */}
                            <div className={`w-1 h-full absolute right-0 top-0 bottom-0 rounded-r-xl transition-all ${isActive ? 'bg-[#d4af37]' : 'bg-transparent group-hover:bg-white/10'}`} />
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
