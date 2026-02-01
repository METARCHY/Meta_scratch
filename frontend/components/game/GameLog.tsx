"use client";

import React, { useEffect, useRef } from 'react';
import { ScrollText } from 'lucide-react';

interface GameLogProps {
    logs: string[];
}

export default function GameLog({ logs }: GameLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="flex flex-col w-[300px] h-[200px] bg-black/60 backdrop-blur-md border border-[#d4af37]/30 rounded-lg overflow-hidden shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#d4af37]/20 bg-[#d4af37]/10">
                <ScrollText size={16} className="text-[#d4af37]" />
                <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest">Command Log</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#d4af37]/30 scrollbar-track-transparent"
            >
                {logs.length === 0 ? (
                    <div className="text-gray-500 text-[10px] italic">Waiting for uplink...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-[#d4af37]/50 text-[10px] font-mono mt-0.5 whitespace-nowrap">
                                [{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}]
                            </span>
                            <p className="text-gray-200 text-[11px] leading-tight font-medium">
                                {log}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="h-1 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
        </div>
    );
}
