"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ActionCard {
    id: string;
    title: string;
    type: string;
    image?: string;
    icon?: string;
    desc: string;
}

interface BuyActionCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuy: (card: ActionCard) => void;
    canAfford: boolean;
    availableCards: ActionCard[];
}

const RESOURCE_ICONS = {
    product: '/resources/resource_product.png',
    energy: '/resources/resource_energy.png',
    recycle: '/resources/resource_Recycle.png'
};

export default function BuyActionCardModal({ isOpen, onClose, onBuy, canAfford, availableCards }: BuyActionCardModalProps) {
    const [purchaseState, setPurchaseState] = useState<'idle' | 'animating' | 'revealed'>('idle');
    const [rewardCard, setRewardCard] = useState<ActionCard | null>(null);
    const hasGeneratedRef = React.useRef(false);

    const generateRandomCard = React.useCallback(() => {
        if (availableCards.length > 0) {
            const random = availableCards[Math.floor(Math.random() * availableCards.length)];
            setRewardCard(random);
        }
    }, [availableCards]);

    // Pick a random card ahead of time so we know what to reveal
    useEffect(() => {
        if (isOpen && !hasGeneratedRef.current) {
            generateRandomCard();
            setPurchaseState('idle');
            hasGeneratedRef.current = true;
        }
        if (!isOpen) {
            hasGeneratedRef.current = false;
        }
    }, [isOpen, generateRandomCard]);

    if (!isOpen) return null;

    const handlePurchase = () => {
        if (!canAfford || !rewardCard) return;
        setPurchaseState('animating');

        // After impulse animates (approx 1.5s), flip card
        setTimeout(() => {
            setPurchaseState('revealed');
        }, 1500);
    };

    const handleAccept = () => {
        if (rewardCard) {
            onBuy(rewardCard);
            // Reset state for another purchase
            setPurchaseState('idle');
            generateRandomCard();
            hasGeneratedRef.current = true; // Keep it true so useEffect doesn't double-generate
        }
    };

    // SVG coordinate system
    // Left column icons (x=100)
    // Product y=180
    // Energy y=300
    // Recycle y=420
    // Card center x=380, y=300

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-[600px] h-[750px] bg-[#23262D] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-2 border-[#A08C5C] overflow-hidden hidden-scrollbar"
            >
                {/* Header Tab */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 px-12 py-1 bg-[#3A3C43] rounded-b-lg border-x-2 border-b-2 border-[#A08C5C]">
                    <span className="text-[#A08C5C] font-rajdhani font-bold uppercase tracking-widest text-sm">Market</span>
                </div>

                {/* Card Title & Desc Box */}
                <div className="mt-12 px-6 pb-4 border-b border-[#A08C5C]/30 text-center min-h-[140px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {purchaseState === 'revealed' && rewardCard ? (
                            <motion.div
                                key="revealed-text"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center"
                            >
                                <h2 className="text-white font-rajdhani font-bold text-2xl uppercase tracking-[0.2em] mb-4">
                                    {rewardCard.title}
                                </h2>
                                <div className="flex items-center w-3/4">
                                    <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#A08C5C] to-[#A08C5C]" />
                                    <div className="w-2 h-2 rounded-full bg-[#A08C5C] mx-2" />
                                    <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent via-[#A08C5C] to-[#A08C5C]" />
                                </div>
                                <p className="text-white/80 italic mt-4 px-4 text-sm font-light">
                                    {rewardCard.desc}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hidden-text"
                                className="flex flex-col items-center"
                            >
                                <h2 className="text-white/50 font-rajdhani font-bold text-2xl uppercase tracking-[0.2em] mb-4">
                                    ???
                                </h2>
                                <div className="flex items-center w-3/4">
                                    <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-white/20 to-white/20" />
                                    <div className="w-2 h-2 rounded-full bg-white/20 mx-2" />
                                    <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent via-white/20 to-white/20" />
                                </div>
                                <p className="text-white/40 italic mt-4 px-4 text-sm">
                                    Purchase an Action Card for 1 Product, 1 Energy, and 1 Recycle.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Content Area: SVG Connections + Resources + Card */}
                <div className="relative w-full h-[450px]">
                    {/* Background Connecting Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                        <g stroke="#A08C5C" strokeWidth="2" fill="none" opacity="0.4">
                            {/* Product line */}
                            <path d="M 120 80 L 190 80 L 190 225 L 290 225" />
                            {/* Energy line */}
                            <path d="M 120 225 L 290 225" />
                            {/* Recycle line */}
                            <path d="M 120 370 L 190 370 L 190 225 L 290 225" />
                        </g>

                        {/* Impulse Animations */}
                        {purchaseState === 'animating' && (
                            <g stroke="#00f0ff" strokeWidth="4" fill="none" strokeLinecap="round" filter="drop-shadow(0 0 8px #00f0ff)">
                                {/* Top impulse */}
                                <motion.path
                                    d="M 120 80 L 190 80 L 190 225 L 290 225"
                                    initial={{ pathLength: 0, pathOffset: 0 }}
                                    animate={{ pathLength: 0.1, pathOffset: 1 }}
                                    transition={{ duration: 1.2, ease: "linear" }}
                                />
                                {/* Center impulse */}
                                <motion.path
                                    d="M 120 225 L 290 225"
                                    initial={{ pathLength: 0, pathOffset: 0 }}
                                    animate={{ pathLength: 0.2, pathOffset: 1 }}
                                    transition={{ duration: 1.2, ease: "linear" }}
                                />
                                {/* Bottom impulse */}
                                <motion.path
                                    d="M 120 370 L 190 370 L 190 225 L 290 225"
                                    initial={{ pathLength: 0, pathOffset: 0 }}
                                    animate={{ pathLength: 0.1, pathOffset: 1 }}
                                    transition={{ duration: 1.2, ease: "linear" }}
                                />
                            </g>
                        )}
                    </svg>

                    {/* Left Column: Resources */}
                    <div className="absolute left-[60px] top-0 h-full flex flex-col justify-around py-6 z-10 w-[80px]">
                        {[
                            { id: 'product', icon: RESOURCE_ICONS.product },
                            { id: 'energy', icon: RESOURCE_ICONS.energy },
                            { id: 'recycle', icon: RESOURCE_ICONS.recycle }
                        ].map(res => (
                            <motion.div
                                key={res.id}
                                className={`w-16 h-16 relative flex items-center justify-center rounded-full bg-[#1a1c23] border border-white/10 shadow-lg
                                    ${purchaseState === 'animating' ? 'animate-pulse' : ''}
                                    ${!canAfford ? 'grayscale opacity-50' : ''}
                                `}
                            >
                                <Image src={res.icon} width={40} height={40} className="object-contain" alt={res.id} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Right Side: The Card */}
                    <div className="absolute right-[80px] top-[40px] w-[240px] h-[370px] z-20">
                        {/* 3D Flip Container */}
                        <div className="w-full h-full relative perspective-[1000px]">
                            <motion.div
                                className="w-full h-full relative"
                                initial={false}
                                animate={{ rotateY: purchaseState === 'revealed' ? 180 : 0 }}
                                transition={{ duration: 0.8, type: 'spring', stiffness: 50 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Card Front (Face down / Styled back) */}
                                <div
                                    className="absolute inset-0 w-full h-full rounded-xl border-2 border-white/20 bg-gradient-to-br from-[#1a1c23] to-black shadow-2xl flex items-center justify-center overflow-hidden"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <div className="absolute inset-0 bg-[url('/bg-pattern.png')] opacity-10" />
                                    <div className="w-[80%] h-[90%] border border-[#A08C5C]/50 rounded-lg flex items-center justify-center relative">
                                        <div className="w-16 h-16 border-4 border-[#A08C5C]/50 rotate-45 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-[#A08C5C]/50 rotate-45" />
                                        </div>
                                        <div className="absolute top-4 w-full text-center text-[#A08C5C]/50 font-rajdhani font-bold tracking-[0.3em] text-sm">METARCHY</div>
                                    </div>
                                    {purchaseState === 'animating' && (
                                        <motion.div
                                            className="absolute inset-0 border-4 border-[#00f0ff] rounded-xl"
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    )}
                                </div>

                                {/* Card Back (Revealed Artwork) */}
                                <div
                                    className="absolute inset-0 w-full h-full rounded-xl border-2 border-[#A08C5C] shadow-[0_0_30px_rgba(212,175,55,0.4)] overflow-hidden bg-black"
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    {rewardCard && (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={rewardCard.image || rewardCard.icon || '/events/default.jpg'}
                                                fill
                                                className="object-cover"
                                                alt={rewardCard.title}
                                            />
                                            {/* Inner border to match mockup */}
                                            <div className="absolute inset-2 border border-white/20 rounded pointer-events-none" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="absolute bottom-6 left-0 w-full flex justify-between px-16 z-30">
                    <button
                        onClick={onClose}
                        disabled={purchaseState === 'animating'}
                        className="w-[120px] h-[40px] flex items-center justify-center rounded-lg border-2 border-[#A08C5C]/30 bg-black/40 hover:bg-white/5 text-white/70 hover:text-white font-bold font-rajdhani uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        NEXT TURN
                    </button>

                    {purchaseState === 'idle' ? (
                        <button
                            onClick={handlePurchase}
                            disabled={!canAfford}
                            className={`w-[140px] h-[40px] flex items-center justify-center rounded-lg border-2 transition-colors
                                ${canAfford
                                    ? 'border-[#257a25] bg-[#0a3a0a] hover:bg-[#155a15] cursor-pointer shadow-[0_0_15px_rgba(37,122,37,0.4)]'
                                    : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                                }
                            `}
                        >
                             <span className={`font-bold font-rajdhani uppercase tracking-widest ${canAfford ? 'text-[#44ff44]' : 'text-white/30'}`}>
                                Buy
                             </span>
                        </button>
                    ) : purchaseState === 'revealed' ? (
                        <button
                            onClick={handleAccept}
                            className="w-[140px] h-[40px] flex items-center justify-center rounded-lg border-2 border-[#A08C5C] bg-[#d4af37]/20 hover:bg-[#d4af37]/40 text-[#A08C5C] font-bold font-rajdhani uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(160,140,92,0.4)]"
                        >
                            TAKE
                        </button>
                    ) : (
                        <div className="w-[140px] h-[40px] flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[#00f0ff]/20 border-t-[#00f0ff] rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

