"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Types
export interface ConflictResult {
    winnerId: string | null; // null if true draw (and no draw bid wins)
    isDraw: boolean;
    restart: boolean; // For "Energy Bid" logic
    logs: string[];
}

interface ConflictResolutionViewProps {
    conflict: {
        locId: string;
        locationName: string;
        playerActor: any;
        opponents: any[]; // { actorId, name, avatar, type, bid? }
        resourceType: string;
    };
    onResolve: (result: ConflictResult) => void;
    onClose: () => void;
}

const LOCATION_IMAGES: { [key: string]: string } = {
    'square': '/Locations closeups/Square.png',
    'theatre': '/Locations closeups/Teatre.png',
    'university': '/Locations closeups/University.png',
    'factory': '/Locations closeups/Factory.png',
    'energy': '/Locations closeups/Energy station.png',
    'dump': '/Locations closeups/Dump.png',
    'city': '/Locations closeups/Square.png'
};

const RSP_ICONS: { [key: string]: string } = {
    'rock': '/tokens/rsp_rock.png',
    'paper': '/tokens/rsp_paper.png',
    'scissors': '/tokens/rsp_scissors.png'
};

const BID_ICONS: { [key: string]: string } = {
    'product': '/resources/resource_box.png', // Win Bid
    'energy': '/resources/resource_energy.png', // Lose Bid
    'recycle': '/resources/resource_bio.png' // Draw Bid
};

const ACTOR_IMAGES: { [key: string]: string } = {
    'politician': '/actors/Polotican.png',
    'robot': '/actors/Robot.png',
    'scientist': '/actors/Scientist.png',
    'artist': '/actors/Artist.png'
};

export default function ConflictResolutionView({ conflict, onResolve, onClose }: ConflictResolutionViewProps) {
    const [step, setStep] = useState<'intro' | 'reveal' | 'outcome_rsp' | 'outcome_bid'>('intro');

    // State for choices (Player can change theirs in Draw)
    const [playerChoice, setPlayerChoice] = useState<string>(conflict.playerActor.type || 'rock');
    const [opponentChoices, setOpponentChoices] = useState<{ [id: string]: string }>({});

    // Calculated Result
    const [result, setResult] = useState<ConflictResult | null>(null);

    // 1. Initialize Opponent Choices (Random for now)
    useEffect(() => {
        const choices: { [id: string]: string } = {};
        conflict.opponents.forEach(opp => {
            const roll = Math.random();
            choices[opp.actorId] = roll < 0.33 ? 'rock' : roll < 0.66 ? 'paper' : 'scissors';
        });
        setOpponentChoices(choices);
    }, [conflict]);

    // 2. Logic: Resolve the Conflict
    const resolveConflict = (pChoice: string) => {
        const choices = [
            { id: 'p1', choice: pChoice, bid: conflict.playerActor.bid, isPlayer: true },
            ...conflict.opponents.map(opp => ({
                id: opp.actorId,
                choice: opponentChoices[opp.actorId],
                bid: opp.bid,
                isPlayer: false
            }))
        ];

        // Group by choice
        const counts = { rock: 0, paper: 0, scissors: 0 };
        choices.forEach(c => {
            if (counts[c.choice as keyof typeof counts] !== undefined) {
                counts[c.choice as keyof typeof counts]++;
            }
        });

        const presentTypes = Object.keys(counts).filter(k => counts[k as keyof typeof counts] > 0);
        let winnerType = null;
        let isDraw = false;

        if (presentTypes.length === 1 || presentTypes.length === 3) {
            isDraw = true;
        } else {
            const [t1, t2] = presentTypes;
            if (
                (t1 === 'rock' && t2 === 'scissors') ||
                (t1 === 'scissors' && t2 === 'paper') ||
                (t1 === 'paper' && t2 === 'rock')
            ) {
                winnerType = t1;
            } else {
                winnerType = t2;
            }
        }

        const winners = isDraw ? [] : choices.filter(c => c.choice === winnerType);

        // Initial Result Object
        return {
            winnerId: winners.length === 1 ? winners[0].id : null,
            isDraw: isDraw || winners.length > 1,
            restart: false, // Will be checked in Bid Phase
            logs: [] as string[]
        };
    };

    // Handler: "Reveal" Button Click
    const handleReveal = () => {
        const res = resolveConflict(playerChoice);
        setResult(res);
        setStep('reveal');

        // Auto-advance to Outcome Modal after animation
        setTimeout(() => setStep('outcome_rsp'), 2000);
    };

    // Handler: Re-Roll (Draw)
    const handleReRoll = (newChoice: string) => {
        setPlayerChoice(newChoice);
        // Optional: Re-roll opponents too?
        // For fairness/chaos, let's re-roll opponents randomly too
        const newOppChoices: { [id: string]: string } = {};
        conflict.opponents.forEach(opp => {
            const roll = Math.random();
            newOppChoices[opp.actorId] = roll < 0.33 ? 'rock' : roll < 0.66 ? 'paper' : 'scissors';
        });
        setOpponentChoices(newOppChoices);

        // Re-calculate immediately
        const res = resolveConflict(newChoice);

        // Slightly hacky: Set result, but keep step 'outcome_rsp' to update the modal content
        setResult(res);
    };

    // Handler: Next (Check Bids or Close)
    const handleNext = () => {
        if (!result) return;

        // Check for active bids that affect outcome
        // 1. Lose Bid (Energy) - if Bidder Lost
        // 2. Win Bid (Product) - if Bidder Won
        // 3. Draw Bid (Recycle) - if Draw

        // We need to know who bid what.
        const playerBid = conflict.playerActor.bid;
        const playerWon = result.winnerId === 'p1';
        const playerLost = !playerWon && !result.isDraw;

        let hasBidEffect = false;
        const newLogs = [...result.logs];
        let restart = false;

        if (playerBid === 'energy' && playerLost) {
            hasBidEffect = true;
            newLogs.push("Energy Bid Triggered: RESTART!");
            restart = true;
        } else if (playerBid === 'product' && playerWon) {
            hasBidEffect = true;
            newLogs.push("Product Bid: DOUBLE PRIZE!");
        } else if (playerBid === 'recycle' && result.isDraw) {
            hasBidEffect = true;
            newLogs.push("Recycle Bid: DRAW WIN!");
            // Technically changes result to win? For now just log it.
        }

        if (hasBidEffect && step !== 'outcome_bid') {
            setResult({ ...result, logs: newLogs, restart });
            setStep('outcome_bid');
            return;
        }

        // If no bid effect or already showed it -> Confirm & Close
        onResolve({ ...result, logs: newLogs, restart });
    };

    const bgImage = LOCATION_IMAGES[conflict.locId] || LOCATION_IMAGES['square'];

    // Helper: Determine grayscale
    const isActorLoser = (actorId: string) => {
        if (step === 'intro' || step === 'reveal') return false;
        if (!result) return false;
        // If draw, no one is loser yet (unless specific logic).
        if (result.isDraw) return false;
        return result.winnerId !== actorId;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <Image src={bgImage} fill className="object-cover opacity-80" alt="Backdrop" priority />
            </div>

            {/* SCENE: Actors & Tokens */}
            <div className="relative z-10 w-full max-w-[1400px] h-full flex items-end justify-between px-20 pb-20">

                {/* Left: Player */}
                <div className={`relative w-[400px] h-[700px] flex items-end justify-center transition-all duration-1000 ${isActorLoser('p1') ? 'grayscale opacity-60' : ''}`}>
                    {/* Token Floating Above */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-[650px] w-32 h-32 z-20"
                    >
                        <Image src={RSP_ICONS[playerChoice]} fill className="object-contain drop-shadow-[0_0_20px_rgba(255,255,0,0.5)]" alt="Player Choice" />
                    </motion.div>

                    {/* Actor Body */}
                    <Image
                        src={ACTOR_IMAGES[conflict.playerActor.actorType.toLowerCase()] || ACTOR_IMAGES['politician']}
                        width={500} height={800}
                        className="object-contain drop-shadow-2xl"
                        alt="Player"
                    />

                    {/* Tag */}
                    <div className="absolute -bottom-10 bg-black/80 px-6 py-2 rounded-full border border-[#d4af37] text-[#d4af37] font-bold text-xl uppercase tracking-widest">
                        YOU
                    </div>
                </div>

                {/* Center: VS (Only Intro/Reveal) */}
                {(step === 'intro' || step === 'reveal') && (
                    <div className="mb-64">
                        <h1 className="text-[150px] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 drop-shadow-[0_0_30px_rgba(255,0,0,0.6)] font-rajdhani">
                            VS
                        </h1>
                    </div>
                )}

                {/* Right: Opponents */}
                <div className="flex gap-10">
                    {conflict.opponents.map((opp, idx) => (
                        <div key={opp.actorId} className={`relative w-[300px] h-[600px] flex items-end justify-center transition-all duration-1000 ${isActorLoser(opp.actorId) ? 'grayscale opacity-60' : ''}`}>
                            {/* Token Above */}
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: step === 'intro' ? 0 : 0, opacity: 1 }}
                                className="absolute bottom-[550px] w-28 h-28 z-20"
                            >
                                {step === 'intro' ? (
                                    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-pulse flex items-center justify-center">
                                        <span className="text-4xl">?</span>
                                    </div>
                                ) : (
                                    <Image src={RSP_ICONS[opponentChoices[opp.actorId]]} fill className="object-contain drop-shadow-2xl" alt="Opponent Choice" />
                                )}
                            </motion.div>

                            {/* Actor Body */}
                            <Image
                                src={ACTOR_IMAGES[opp.actorType?.toLowerCase()] || ACTOR_IMAGES['robot']}
                                width={400} height={700}
                                className={`object-contain drop-shadow-2xl ${idx % 2 === 0 ? 'sepia-0' : 'sepia'}`} // Simple variance
                                alt={opp.name}
                            />

                            <div className="absolute -bottom-8 bg-black/80 px-4 py-1 rounded-full border border-white/30 text-white font-bold tracking-wider">
                                {opp.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BUTTON: Reveal (Intro Only) */}
            {step === 'intro' && (
                <div className="absolute bottom-10 z-50">
                    <button
                        onClick={handleReveal}
                        className="px-16 py-4 bg-[#d4af37] text-black font-black text-2xl uppercase tracking-[0.2em] rounded-sm hover:bg-[#ffe066] shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-transform hover:scale-105 active:scale-95"
                    >
                        Reveal Conflict
                    </button>
                </div>
            )}

            {/* MODAL: Outcome & Interaction */}
            <AnimatePresence>
                {(step === 'outcome_rsp' || step === 'outcome_bid') && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-[600px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-2xl p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)]"
                        >
                            {/* Header */}
                            <div className="bg-[#1a1a20] p-6 border-b border-white/5 text-center">
                                <h2 className={`font-rajdhani font-bold text-4xl tracking-widest uppercase ${result?.isDraw ? 'text-blue-400' : result?.winnerId === 'p1' ? 'text-[#d4af37]' : 'text-red-500'}`}>
                                    {result?.isDraw ? 'DRAW' : result?.winnerId === 'p1' ? 'VICTORY' : 'DEFEAT'}
                                </h2>
                                <p className="text-white/60 text-sm mt-2 italic font-mono">
                                    {result?.isDraw
                                        ? "The negotiation stalled. Arguments were inconclusive."
                                        : result?.winnerId === 'p1'
                                            ? "Your arguments prevailed over the opposition."
                                            : "You failed to convince the assembly."
                                    }
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-8 flex flex-col items-center gap-8">

                                {/* DRAW: Re-Selection */}
                                {step === 'outcome_rsp' && result?.isDraw && (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <p className="text-white text-lg uppercase tracking-widest mb-2">Resolve the dispute. Choose argument:</p>
                                        <div className="flex gap-6">
                                            {['rock', 'paper', 'scissors'].map(token => (
                                                <button
                                                    key={token}
                                                    onClick={() => handleReRoll(token)}
                                                    className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all ${playerChoice === token ? 'bg-[#d4af37]/20 border-[#d4af37] scale-110 shadow-[0_0_20px_#d4af37]' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}
                                                >
                                                    <Image src={RSP_ICONS[token]} width={50} height={50} alt={token} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* WIN/LOSE: Next/Close */}
                                {step === 'outcome_rsp' && !result?.isDraw && (
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                            <Image
                                                src={result?.winnerId === 'p1' ? '/icons/icon_check.png' : '/icons/icon_cross.png'} // Fallback icons or use Lucide
                                                width={40} height={40} alt="Status"
                                            />
                                        </div>
                                        <p className="text-xl font-bold uppercase text-white mb-6">Conflict Resolved</p>
                                        <button
                                            onClick={handleNext}
                                            className="px-10 py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest rounded hover:bg-[#ffe066]"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}

                                {/* BID OUTCOME STAGE */}
                                {step === 'outcome_bid' && (
                                    <div className="text-center w-full">
                                        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-6 rounded-xl border border-white/10 mb-6">
                                            <h3 className="text-[#d4af37] font-bold text-2xl mb-2">BID EFFECT TRIGGERED</h3>
                                            <ul className="text-left text-sm text-gray-300 space-y-2">
                                                {result?.logs.map((log, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                                                        {log}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <button
                                            onClick={handleNext}
                                            className="px-10 py-3 border border-white/30 text-white font-bold uppercase tracking-widest rounded hover:bg-white/10"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

