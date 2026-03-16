"use client";

import React from 'react';
import Image from 'next/image';
import { Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import OtherPlayerActorMarker from './OtherPlayerActorMarker';

interface Conflict {
    locId: string;
    locationName: string;
    playerActor: any;
    opponents: any[];
}

interface ConflictsSidebarProps {
    conflicts: Conflict[];
    resolvedIds: string[];
    activeConflictLocId: string | null;
    onSelectConflict: (locId: string) => void;
}

/** Small circular avatar using the FULL actor image (not head crop). */
function ActorCircle({ avatar, size = 56 }: { avatar: string; size?: number }) {
    return (
        <div
            className="rounded-full overflow-hidden border-2 border-[#d4af37]/60 flex-shrink-0 bg-[#1a1a1c]"
            style={{ width: size, height: size }}
        >
            <div className="relative w-full h-full">
                <Image src={avatar} fill className="object-cover object-top" alt="" />
            </div>
        </div>
    );
}

/** Small circular player avatar (citizen photo). */
function PlayerCircle({ avatar, size = 32 }: { avatar: string; size?: number }) {
    return (
        <div
            className="rounded-full overflow-hidden border border-white/30 flex-shrink-0 bg-[#1a1a1c]"
            style={{ width: size, height: size }}
        >
            <div className="relative w-full h-full">
                <Image src={avatar} fill className="object-cover" alt="" />
            </div>
        </div>
    );
}

export default function ConflictsSidebar({ conflicts, resolvedIds, activeConflictLocId, onSelectConflict }: ConflictsSidebarProps) {
    if (conflicts.length === 0) return null;

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-[100] bg-[#0d0d12]/95 backdrop-blur-md border-l border-t border-b border-[#d4af37]/30 rounded-l-2xl p-4 flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] min-w-[320px] max-h-[85vh] overflow-y-auto pointer-events-auto custom-scrollbar"
        >
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                <Swords className="w-5 h-5 text-[#d4af37] animate-pulse" />
                <h3 className="font-rajdhani font-bold text-[#d4af37] tracking-widest text-sm uppercase">Active Conflicts</h3>
            </div>

            <div className="flex flex-col gap-3">
                {conflicts.map((conflict) => {
                    const isActive = activeConflictLocId === conflict.locId;
                    const isResolved = resolvedIds.includes(conflict.locId);
                    return (
                        <button
                            key={conflict.locId}
                            onClick={() => onSelectConflict(conflict.locId)}
                            className={`
                                relative group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 w-full text-left cursor-pointer
                                ${isActive
                                    ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                    : isResolved
                                        ? 'bg-white/5 border-white/5 opacity-60'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                }
                            `}
                        >
                            {/* Player's actor — head avatar */}
                            <ActorCircle avatar={conflict.playerActor.headAvatar || conflict.playerActor.avatar} size={64} />

                            <div className="flex flex-col gap-1 flex-grow min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${isActive ? 'text-[#d4af37]' : 'text-gray-300'}`}>
                                        {conflict.locationName} {(conflict as any).isPeaceful && <span className="ml-1 text-[9px] text-blue-400 font-black">[UNDISPUTED]</span>}
                                    </span>
                                    {isResolved && (
                                        <span className="text-[9px] font-black text-[#d4af37] bg-[#d4af37]/20 px-1.5 py-0.5 rounded border border-[#d4af37]/40">VIEWED</span>
                                    )}
                                </div>

                                {/* Opponents row */}
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-mono text-white/40 italic mt-1">VS</span>
                                    <div className="flex gap-2">
                                        {conflict.opponents.map((opp, idx) => (
                                            <div key={idx} className="relative w-[46px] h-[46px]">
                                                <div className="scale-[0.40] origin-top-left absolute left-0 top-0 pointer-events-none">
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

                            {/* Active indicator stripe */}
                            <div className={`w-1 h-full absolute right-0 top-0 bottom-0 rounded-r-xl transition-all ${isActive ? 'bg-[#d4af37]' : 'bg-transparent group-hover:bg-white/10'}`} />
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
