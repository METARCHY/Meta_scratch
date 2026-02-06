"use client";

import React from 'react';
import Image from 'next/image';

interface ActionCard {
    id: string;
    title: string;
    desc: string;
    type: string;
    icon?: string;
}

interface ActionCardsPanelProps {
    cards: ActionCard[];
    onSelect: (id: string) => void;
    activeCardId: string | null;
    emptyMessage?: string;
    compact?: boolean;
}

export default function ActionCardsPanel({ cards, onSelect, activeCardId, emptyMessage, compact }: ActionCardsPanelProps) {
    if (cards.length === 0) {
        if (!emptyMessage) return null;
        return (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-5 duration-500 pointer-events-none">
                <div className="px-10 py-4 bg-[#0d0d12]/90 backdrop-blur-md border border-[#d4af37]/30 rounded-2xl flex items-center justify-center shadow-2xl">
                    <span className="text-[#d4af37] font-rajdhani font-bold text-sm uppercase tracking-[0.3em] animate-pulse glow-gold">{emptyMessage}</span>
                </div>
            </div>
        );
    }

    // Compact Mode: Group cards by Title and show count
    if (compact) {
        const uniqueCards = cards.reduce((acc: { [key: string]: { card: ActionCard, count: number } }, card) => {
            if (!acc[card.title]) {
                acc[card.title] = { card, count: 0 };
            }
            acc[card.title].count++;
            return acc;
        }, {});

        return (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-4 z-40 animate-in slide-in-from-bottom-10 duration-500 pointer-events-none">
                {Object.values(uniqueCards).map(({ card, count }) => {
                    const isActive = activeCardId === card.id;
                    return (
                        <div
                            key={card.title}
                            className="group relative w-32 h-44 rounded-xl border border-white/10 bg-[#0d0d12]/90 backdrop-blur-md overflow-hidden"
                        >
                            <div className="p-4 flex flex-col h-full bg-[#171B21]/50">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]/60 mb-1">{card.type}</span>
                                <h4 className="font-bold text-white uppercase leading-tight mb-2 font-rajdhani text-xs">{card.title}</h4>

                                <div className="flex-1 rounded border border-white/5 bg-white/5 mb-2 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent" />
                                    {card.icon ? (
                                        <Image src={card.icon} fill className="object-cover opacity-80" alt={card.title} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[#d4af37] text-xs">IMG</span>
                                        </div>
                                    )}
                                </div>

                                {/* Count Badge */}
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#d4af37] text-black flex items-center justify-center font-bold text-xs shadow-lg z-10">
                                    {count}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-4 z-40 animate-in slide-in-from-bottom-10 duration-500">
            {cards.map((card, i) => {
                const isActive = activeCardId === card.id;

                return (
                    <div
                        key={`${card.id}-${i}`}
                        onClick={() => onSelect(card.id)}
                        className={`group relative w-40 h-56 rounded-xl border transition-all cursor-pointer overflow-hidden
                            ${isActive
                                ? 'border-[#d4af37] bg-[#d4af37]/20 -translate-y-4 shadow-[0_0_30px_rgba(212,175,55,0.4)] scale-110'
                                : 'border-white/10 bg-[#0d0d12]/90 backdrop-blur-md hover:border-[#d4af37]/50 hover:bg-white/5 hover:-translate-y-2'
                            }
                        `}
                    >
                        {/* Card Header/Type */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="p-4 flex flex-col h-full">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]/60 mb-1">{card.type}</span>
                            <h4 className={`font-bold text-white uppercase leading-tight mb-2 font-rajdhani ${compact ? 'text-xs' : 'text-sm'}`}>{card.title}</h4>

                            {/* Card Art Placeholder/Mock */}
                            <div className="flex-1 rounded border border-white/5 bg-white/5 mb-3 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent" />
                                {card.icon ? (
                                    <Image src={card.icon} fill className="object-cover opacity-60" alt={card.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full border border-[#d4af37]/20 flex items-center justify-center">
                                            <span className="text-[#d4af37] text-xs">M</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!compact && (
                                <p className="text-[10px] text-gray-400 leading-tight font-sans line-clamp-4">
                                    {card.desc}
                                </p>
                            )}
                        </div>

                        {/* Selection Glow */}
                        {isActive && (
                            <div className="absolute inset-0 border-2 border-[#d4af37] rounded-xl pointer-events-none animate-pulse" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
