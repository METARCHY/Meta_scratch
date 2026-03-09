"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MarketOffer } from './MarketOfferModal';

interface PlayerInfo {
    id: string;
    name: string;
    avatar: string;
}

interface MarketRevealModalProps {
    isOpen: boolean;
    playerOffer: MarketOffer | null;
    opponents: PlayerInfo[];
    botOffers: { [id: string]: MarketOffer | null };
    matchId: string | null;
    onComplete: (tradePartnerId: string | null) => void;
}

const RESOURCE_ICONS = {
    product: '/resources/resource_product.png',
    electricity: '/resources/resource_energy.png',
    recycling: '/resources/resource_Recycle.png'
};

const RESOURCE_TYPES = ['product', 'electricity', 'recycling'] as const;

export default function MarketRevealModal({ isOpen, playerOffer, opponents, botOffers, matchId, onComplete }: MarketRevealModalProps) {
    if (!isOpen) return null;

    const renderOfferRow = (name: string, avatar: string, offer: MarketOffer | null, isPlayer: boolean, isMatch: boolean) => {
        return (
            <div className={`flex items-center gap-6 p-4 rounded-xl border ${isMatch ? 'border-[#00f0ff] bg-[#00f0ff]/10' : isPlayer ? 'border-[#A08C5C] bg-[#A08C5C]/10' : 'border-white/10 bg-black/40'} transition-colors`}>
                <div className="flex items-center gap-4 w-[200px]">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                        <Image src={avatar} width={40} height={40} alt={name} className="object-cover" />
                    </div>
                    <span className={`font-bold uppercase ${isPlayer ? 'text-[#A08C5C]' : 'text-white'}`}>{isPlayer ? 'YOU' : name}</span>
                </div>

                {offer ? (
                    <div className="flex items-center gap-6 flex-1 justify-center">
                        <div className="flex items-center gap-2 w-[120px] justify-end">
                            <span className="text-xl font-bold font-mono text-red-400">-{offer.giveAmount}</span>
                            <div className="w-8 h-8 relative bg-black/50 rounded-lg p-1 border border-white/10">
                                <Image src={RESOURCE_ICONS[offer.giveType]} fill alt={offer.giveType} className="object-contain" />
                            </div>
                        </div>
                        <div className="text-white/30">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14l-4-4" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2 w-[120px] justify-start">
                            <div className="w-8 h-8 relative bg-black/50 rounded-lg p-1 border border-white/10">
                                <Image src={RESOURCE_ICONS[offer.takeType]} fill alt={offer.takeType} className="object-contain" />
                            </div>
                            <span className="text-xl font-bold font-mono text-green-400">+{offer.takeAmount}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 text-center text-white/40 italic">
                        No offer placed
                    </div>
                )}

                <div className="w-[100px] text-right">
                    {isMatch && <span className="text-[#00f0ff] font-bold uppercase text-xs tracking-widest animate-pulse">MATCH!</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-[800px] bg-[#1a1c23] border border-[#A08C5C] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden"
            >
                <div className="bg-[#23262D] px-8 py-6 border-b border-[#A08C5C]/30 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A08C5C]/10 to-transparent animate-[pulse_3s_ease-in-out_infinite]" />
                    <h2 className="text-[#A08C5C] font-rajdhani font-bold text-3xl uppercase tracking-widest relative z-10">Market Reveal</h2>
                    <p className="text-white/60 text-sm mt-2 font-mono relative z-10">Comparing open offers...</p>
                </div>

                <div className="p-8 flex flex-col gap-4">
                    {renderOfferRow('Player', '/avatars/golden_avatar.png', playerOffer, true, false)}

                    <div className="h-px bg-white/10 my-2" />

                    {opponents.map(opp =>
                        renderOfferRow(opp.name, opp.avatar, botOffers[opp.id], false, matchId === opp.id)
                    )}
                </div>

                <div className="px-8 py-6 bg-[#23262D] border-t border-[#A08C5C]/30 flex justify-center">
                    {matchId ? (
                        <button
                            onClick={() => onComplete(matchId)}
                            className="px-12 py-4 bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] font-bold uppercase tracking-[0.2em] rounded shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:bg-[#00f0ff]/40 transition-colors"
                        >
                            Accept Trade Match
                        </button>
                    ) : (
                        <button
                            onClick={() => onComplete(null)}
                            className="px-12 py-4 bg-[#A08C5C] text-black font-bold uppercase tracking-[0.2em] rounded shadow-[0_0_20px_rgba(160,140,92,0.4)] hover:bg-[#ffe066] transition-colors"
                        >
                            {playerOffer ? "No Match Found - Continue" : "Continue"}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
