"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export interface MarketOffer {
    giveType: 'product' | 'energy' | 'recycle';
    giveAmount: number;
    takeType: 'product' | 'energy' | 'recycle';
    takeAmount: number;
}

interface MarketOfferModalProps {
    isOpen: boolean;
    playerResources: { product: number; energy: number; recycle: number };
    onConfirm: (offer: MarketOffer | null) => void;
}

const RESOURCE_ICONS = {
    product: '/resources/resource_product.png',
    energy: '/resources/resource_energy.png',
    recycle: '/resources/resource_Recycle.png'
};

const RESOURCE_NAMES = {
    product: 'PRODUCT',
    energy: 'ENERGY',
    recycle: 'RECYCLE'
};

export default function MarketOfferModal({ isOpen, playerResources, onConfirm }: MarketOfferModalProps) {
    const [giveType, setGiveType] = useState<'product' | 'energy' | 'recycle' | null>(null);
    const [giveAmount, setGiveAmount] = useState<number>(1);

    const [takeType, setTakeType] = useState<'product' | 'energy' | 'recycle' | null>(null);
    const [takeAmount, setTakeAmount] = useState<number>(1);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (giveType && takeType && giveAmount > 0 && takeAmount > 0 && giveAmount <= playerResources[giveType]) {
            onConfirm({ giveType, giveAmount, takeType, takeAmount });
        }
    };

    const handleSkip = () => {
        onConfirm(null);
    };

    const maxGive = giveType ? playerResources[giveType] : 0;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-[700px] bg-[#1a1c23] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#A08C5C]/30 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-[#23262D] px-8 py-6 border-b border-[#A08C5C]/30 text-center">
                    <h2 className="text-[#A08C5C] font-rajdhani font-bold text-3xl uppercase tracking-widest">Market Offer</h2>
                    <p className="text-white/60 text-sm mt-2 italic">Set your exchange offer. Both type and price must match an opponent to trade.</p>
                </div>

                <div className="p-8 flex items-center justify-between gap-8">
                    {/* Left: Give */}
                    <div className="flex-1 flex flex-col items-center gap-6 bg-black/20 p-6 rounded-xl border border-white/5">
                        <h3 className="text-white/80 uppercase font-bold tracking-widest text-sm">You Give</h3>
                        <div className="flex gap-4">
                            {(Object.keys(RESOURCE_ICONS) as Array<'product' | 'energy' | 'recycle'>).map(res => (
                                <button
                                    key={res}
                                    onClick={() => {
                                        const newlySelected = res as 'product' | 'energy' | 'recycle';
                                        setGiveType(newlySelected);
                                        setGiveAmount(Math.min(1, playerResources[newlySelected]));
                                    }}
                                    className={`w-14 h-14 rounded-xl border-2 p-2 transition-all ${giveType === res ? 'border-[#A08C5C] bg-[#A08C5C]/20 shadow-[0_0_15px_rgba(160,140,92,0.4)]' : 'border-white/10 bg-black/40 hover:border-white/30'}`}
                                >
                                    <Image src={RESOURCE_ICONS[res]} width={40} height={40} alt={res} className="object-contain" />
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 bg-black/50 px-4 py-2 rounded-lg border border-white/10">
                            <button
                                onClick={() => setGiveAmount(Math.max(1, giveAmount - 1))}
                                disabled={giveAmount <= 1}
                                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30"
                            >-</button>
                            <span className="text-2xl font-bold font-mono w-8 text-center text-[#A08C5C]">{giveAmount}</span>
                            <button
                                onClick={() => setGiveAmount(Math.min(maxGive, giveAmount + 1))}
                                disabled={giveAmount >= maxGive}
                                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30"
                            >+</button>
                        </div>
                        <span className="text-xs text-white/40">Available: {maxGive}</span>
                    </div>

                    {/* Center: Exchange Icon */}
                    <div className="flex flex-col items-center text-[#A08C5C]/50">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 10h14l-4-4" />
                            <path d="M17 14H3l4 4" />
                        </svg>
                    </div>

                    {/* Right: Take */}
                    <div className="flex-1 flex flex-col items-center gap-6 bg-black/20 p-6 rounded-xl border border-white/5">
                        <h3 className="text-white/80 uppercase font-bold tracking-widest text-sm">You Take</h3>
                        <div className="flex gap-4">
                            {(Object.keys(RESOURCE_ICONS) as Array<'product' | 'energy' | 'recycle'>).map(res => (
                                <button
                                    key={res}
                                    onClick={() => setTakeType(res)}
                                    className={`w-14 h-14 rounded-xl border-2 p-2 transition-all ${takeType === res ? 'border-[#00f0ff] bg-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'border-white/10 bg-black/40 hover:border-white/30'}`}
                                >
                                    <Image src={RESOURCE_ICONS[res]} width={40} height={40} alt={res} className="object-contain" />
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 bg-black/50 px-4 py-2 rounded-lg border border-white/10">
                            <button
                                onClick={() => setTakeAmount(Math.max(1, takeAmount - 1))}
                                disabled={takeAmount <= 1}
                                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30"
                            >-</button>
                            <span className="text-2xl font-bold font-mono w-8 text-center text-[#00f0ff]">{takeAmount}</span>
                            <button
                                onClick={() => setTakeAmount(takeAmount + 1)}
                                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white"
                            >+</button>
                        </div>
                        <span className="text-xs text-white/40">Any amount</span>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-8 py-6 bg-[#23262D] border-t border-[#A08C5C]/30 flex justify-between">
                    <button
                        onClick={handleSkip}
                        className="px-6 py-2 text-white/50 hover:text-white uppercase tracking-widest text-sm transition-colors"
                    >
                        Skip Market
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!giveType || !takeType || giveAmount === 0 || giveAmount > maxGive}
                        className="px-8 py-3 bg-[#A08C5C] text-black font-bold uppercase tracking-widest rounded shadow-[0_0_20px_rgba(160,140,92,0.4)] hover:bg-[#ffe066] transition-colors disabled:opacity-50 disabled:grayscale"
                    >
                        Place Offer
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
