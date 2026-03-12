"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Types
import { ConflictResult } from '@/lib/modules/core/types';
import { resolveConflictLogic } from '@/lib/modules/conflict/conflictResolver';

interface ConflictResolutionViewProps {
    conflict: {
        locId: string;
        locationName: string;
        playerActor: any;
        opponents: any[]; // { actorId, name, avatar, type, bid? }
        resourceType: string;
    };
    isResolved?: boolean;
    hasNextConflict?: boolean;
    onResolve: (result: ConflictResult) => void;
    onClose: () => void;
}

import { LOCATION_IMAGES, RSP_ICONS, BID_ICONS, RESOURCE_ICONS, ACTOR_IMAGES } from '@/data/assetManifest';

import { useGameState } from '@/context/GameStateContext';

export default function ConflictResolutionView({ conflict, isResolved, hasNextConflict, onResolve, onClose }: ConflictResolutionViewProps) {
    const { player } = useGameState();
    const [step, setStep] = useState<'intro' | 'reveal' | 'outcome_rsp' | 'outcome_bid'>('intro');

    // State for choices. Player uses their placed type.
    const [playerChoice, setPlayerChoice] = useState<string>(conflict.playerActor.type || '');
    const [opponentChoices, setOpponentChoices] = useState<{ [id: string]: string }>({});

    // Calculated Result
    const [result, setResult] = useState<ConflictResult | null>(null);
    const [survivorIds, setSurvivorIds] = useState<string[]>([]);
    const [isRoundTwo, setIsRoundTwo] = useState(false);

    const localPlayerId = player.citizenId || player.address || 'p1';

    // 1. Initialize Opponent Choices (Random for now)
    useEffect(() => {
        if (isResolved) {
            setStep('outcome_rsp');
            return;
        }

        const initialSurvivors = [localPlayerId, ...conflict.opponents.map(o => o.actorId)];
        setSurvivorIds(initialSurvivors);

        const choices: { [id: string]: string } = {};
        conflict.opponents.forEach(opp => {
            choices[opp.actorId] = opp.type || 'rock';
        });
        setOpponentChoices(choices);
        setStep('intro');
        setResult(null);
        setIsRoundTwo(false);
    }, [conflict.locId, isResolved, conflict.opponents, localPlayerId]);

    // 2. Logic: Resolve the Conflict
    const resolveConflict = (pChoice: string, applyBids: boolean = true): ConflictResult => {
        // Filter conflict for current survivors
        const currentConflictInput = {
            ...conflict,
            opponents: conflict.opponents.filter(o => survivorIds.includes(o.actorId))
        };

        return resolveConflictLogic(
            localPlayerId,
            pChoice,
            applyBids,
            currentConflictInput,
            opponentChoices,
            { id: localPlayerId, name: player.name || 'Player' }
        );
    };


    // Handler: "Reveal" Button Click
    const handleReveal = () => {
        // Bids only active on Round 1
        const areBidsActive = !isRoundTwo;
        const res = resolveConflict(playerChoice, areBidsActive);

        setResult(res);
        setStep('reveal');

        // Auto-advance to Outcome Modal after animation
        setTimeout(() => setStep('outcome_rsp'), 2000);
    };

    // Handler: Trigger a Re-Roll (from Tied Winners, Draw, or Electricity Bid)
    const handleReRollRequest = () => {
        if (!result) return;

        // Update survivors for next iteration
        const newSurvivors = result.survivorIds;
        setSurvivorIds(newSurvivors);
        setIsRoundTwo(true);

        // Reset the player's choice ONLY if they are still in the conflict
        if (newSurvivors.includes(localPlayerId)) {
            setPlayerChoice('');
        }

        const newOppChoices: { [id: string]: string } = {};
        conflict.opponents.forEach(opp => {
            if (newSurvivors.includes(opp.actorId)) {
                const roll = Math.random();
                newOppChoices[opp.actorId] = roll < 0.33 ? 'rock' : roll < 0.66 ? 'paper' : 'scissors';
            }
        });
        setOpponentChoices(newOppChoices);

        setResult(null);
        setStep('intro');
    };

    // Handler: Next (Check Bids or Close)
    const handleNext = () => {
        if (!result) return;

        // Bids logic that forces modal steps
        // Energy/Restart logic (Energy bid or Politician Draw)
        if (result.restart) {
            // Need to show "outcome_bid" first if it was an energy bid to explain the restart
            const hasEnergyBid = result.successfulBids?.some(b => b.bid === 'electricity');
            if (hasEnergyBid && step === 'outcome_rsp') {
                // First click: show the bid outcome explanation
                setStep('outcome_bid');
                return;
            }
            // After showing bid outcome (or if it's a Politician draw), transition to 'outcome_rsp' to show Re-Roll buttons
            if (step !== 'outcome_rsp') {
                setStep('outcome_rsp');
                return;
            }
            // If already on outcome_rsp, let user click the Re-Roll button (don't call onResolve)
            return;
        }

        // Product Bid logic (Win)
        const hasProductBid = result.successfulBids?.some(b => b.bid === 'product' && b.actorId === localPlayerId);
        if (hasProductBid && result.winnerId === localPlayerId) {
            if (step !== 'outcome_bid') {
                // Add the log dynamically right before showing
                const updatedLogs = [...result.logs, "Product Bid: DOUBLE PRIZE!"];
                setResult({ ...result, logs: updatedLogs });
                setStep('outcome_bid');
                return;
            }
        }

        // If no bid effect pending or already showed it -> Confirm & Close
        // Send the usedBid back to page.tsx so it knows whether to double the reward, independent of the initial actor bid state!
        onResolve(result);
    };

    const bgImage = LOCATION_IMAGES[conflict.locId] || LOCATION_IMAGES['square'];

    // Helper: Determine grayscale
    const isActorLoser = (actorId: string) => {
        if (step === 'intro' || step === 'reveal') {
            return !survivorIds.includes(actorId); // If they didn't survive previous round
        }
        if (!result) return !survivorIds.includes(actorId);

        // In outcome view
        if (result.isDraw || result.shareRewards) return false;
        if (result.winnerId === actorId) return false;

        // If it's a tied winner scenario, they are NOT losers
        if (result.restart && result.survivorIds.includes(actorId)) return false;

        return true;
    };

    return (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <Image src={bgImage} fill className="object-cover opacity-80" alt="Backdrop" priority />
            </div>

            {/* SCENE: Actors & Tokens */}
            <div className="relative z-10 w-full max-w-[1400px] h-full flex items-end justify-between px-10 pb-0">

                {/* Left: Player */}
                <div className={`relative w-[350px] h-[550px] flex items-end justify-center transition-all duration-1000 ${isActorLoser('p1') ? 'grayscale opacity-60' : ''}`}>
                    {/* Stack Above Head (Bottom to Top: Avatar -> RSP -> Bid) */}
                    <div className="absolute bottom-[100%] mb-4 flex flex-col-reverse items-center gap-3 z-30">
                        {/* 1. Player Avatar */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] relative bg-[#1a1a1c]">
                            <Image
                                src={player?.avatar || '/avatars/golden_avatar.png'}
                                fill
                                className="object-cover"
                                alt="Player"
                            />
                        </div>
                        {/* 2. RSP Token */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 relative"
                        >
                            {playerChoice ? (
                                <Image src={RSP_ICONS[playerChoice] || RSP_ICONS['rock']} fill className="object-contain drop-shadow-[0_0_20px_rgba(255,255,0,0.5)]" alt="Player Choice" />
                            ) : (
                                <div className="w-full h-full rounded-full border-2 border-white/20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <span className="text-4xl font-bold text-white/50">?</span>
                                </div>
                            )}
                        </motion.div>
                        {/* 3. Bid Token (Hide on re-roll - bets are burned) */}
                        {conflict.playerActor.bid && !isRoundTwo && (
                            <div className="w-12 h-12 relative animate-bounce">
                                <Image src={BID_ICONS[conflict.playerActor.bid]} fill className="object-contain drop-shadow-lg" alt="Bid" />
                            </div>
                        )}
                    </div>

                    {/* Actor Body */}
                    <div className="relative w-full h-[120%]">
                        {conflict.playerActor?.actorType === 'player' ? (
                            <div className="absolute inset-0 flex items-center justify-center p-12">
                                <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.3)]">
                                    <Image
                                        src={conflict.playerActor.avatar || player?.avatar || '/avatars/golden_avatar.png'}
                                        fill
                                        className="object-cover"
                                        alt="Player Avatar"
                                    />
                                </div>
                            </div>
                        ) : (
                            <Image
                                src={ACTOR_IMAGES[conflict.playerActor?.actorType?.toLowerCase()] || ACTOR_IMAGES['politician']}
                                fill
                                className="object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                                alt="Player Actor"
                            />
                        )}
                    </div>

                    {/* Tag */}
                    <div className="absolute bottom-8 bg-black/80 px-6 py-2 rounded-full border border-[#d4af37] text-[#d4af37] font-bold text-lg uppercase tracking-widest z-20">
                        {survivorIds.includes(localPlayerId) ? 'YOU' : 'EXITED'}
                    </div>
                </div>

                {/* Center: VS (Only Intro/Reveal) */}
                {(step === 'intro' || step === 'reveal') && (
                    <div className="mb-48">
                        <h1 className="text-[120px] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 drop-shadow-[0_0_30px_rgba(255,0,0,0.6)] font-rajdhani">
                            VS
                        </h1>
                    </div>
                )}

                {/* Right: Opponents */}
                <div className="flex gap-10">
                    {conflict.opponents.map((opp, idx) => (
                        <div key={opp.actorId} className={`relative w-[350px] h-[550px] flex items-end justify-center transition-all duration-1000 ${isActorLoser(opp.actorId) ? 'grayscale opacity-60' : ''}`}>

                            {/* Stack Above Head */}
                            <div className="absolute bottom-[100%] mb-4 flex flex-col-reverse items-center gap-3 z-30">
                                {/* 1. Opponent Player Avatar */}
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/40 relative bg-[#1a1a1c]">
                                    {opp.playerAvatar ? (
                                        <Image src={opp.playerAvatar} fill className="object-cover" alt={opp.name} />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800" />
                                    )}
                                </div>
                                {/* 2. RSP Token */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: step === 'intro' ? 0.9 : 1, opacity: 1 }}
                                    className="w-24 h-24 relative"
                                >
                                    {step === 'intro' ? (
                                        <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-pulse flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white/50">?</span>
                                        </div>
                                    ) : (
                                        <Image src={RSP_ICONS[opponentChoices[opp.actorId]] || RSP_ICONS['rock']} fill className="object-contain drop-shadow-2xl" alt="Opponent Choice" />
                                    )}
                                </motion.div>
                                {/* 3. Bid Token */}
                                {opp.bid && (
                                    <div className="w-12 h-12 relative animate-bounce">
                                        <Image src={BID_ICONS[opp.bid]} fill className="object-contain drop-shadow-lg" alt="Bid" />
                                    </div>
                                )}
                            </div>

                            {/* Actor Body */}
                            <div className="relative w-full h-[120%]">
                                {opp.actorType === 'player' ? (
                                    <div className="absolute inset-0 flex items-center justify-center p-12">
                                        <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-white/40 shadow-2xl">
                                            <Image
                                                src={opp.playerAvatar || '/avatars/viper.png'}
                                                fill
                                                className="object-cover"
                                                alt="Opponent Avatar"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <Image
                                        src={ACTOR_IMAGES[opp.actorType?.toLowerCase()] || ACTOR_IMAGES['robot']}
                                        fill
                                        className={`object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] ${idx % 2 === 0 ? 'sepia-0' : 'sepia'}`}
                                        alt="Opponent Actor"
                                    />
                                )}
                            </div>

                            {/* Tag */}
                            <div className="absolute bottom-8 bg-black/80 px-4 py-1 rounded-full border border-white/30 text-white font-bold tracking-wider z-20">
                                {survivorIds.includes(opp.actorId) ? opp.name : `${opp.name} (EXITED)`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BUTTON / SELECTION: Intro Only */}
            {step === 'intro' && (
                <div className="absolute bottom-10 z-[60] flex flex-col items-center gap-4">
                    {!playerChoice ? (
                        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <p className="text-white font-rajdhani text-xl uppercase tracking-widest bg-black/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                {isRoundTwo ? "Tie-Breaker: Select New Argument" : "Select Argument"}
                            </p>
                            <div className="flex gap-6 bg-black/80 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                                {['rock', 'paper', 'scissors'].map(token => (
                                    <button
                                        key={token}
                                        onClick={() => setPlayerChoice(token)}
                                        className="w-20 h-20 rounded-full border-2 border-white/20 hover:border-[#d4af37] hover:bg-[#d4af37]/20 transition-all flex items-center justify-center hover:scale-110 shadow-lg"
                                    >
                                        <Image src={RSP_ICONS[token]} width={40} height={40} alt={token} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleReveal}
                            className="px-16 py-4 bg-[#d4af37] text-black font-black text-2xl uppercase tracking-[0.2em] rounded-sm hover:bg-[#ffe066] shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-transform hover:scale-105 active:scale-95 animate-in zoom-in duration-300"
                        >
                            Reveal Conflict
                        </button>
                    )}
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
                                <h2 className={`font-rajdhani font-bold text-4xl tracking-widest uppercase ${result?.isDraw ? 'text-blue-400' : result?.winnerId === localPlayerId ? 'text-[#d4af37]' : 'text-red-500'}`}>
                                    {result?.isDraw
                                        ? (result.evictAll ? 'DISMISSED' : result.shareRewards ? 'TRUCE' : 'DRAW')
                                        : result?.winnerId === localPlayerId
                                            ? (conflict.opponents.length === 0 ? 'SECURED' : 'VICTORY')
                                            : 'DEFEAT'}
                                </h2>
                                <p className="text-white/60 text-sm mt-2 italic font-mono">
                                    {result?.isDraw
                                        ? (result.evictAll
                                            ? "Refusing to compromise, all Artists leave the location."
                                            : result.shareRewards
                                                ? "Finding common ground, all actors remain at the location."
                                                : "The negotiation stalled. A new argument is required.")
                                        : result?.winnerId === localPlayerId
                                            ? (conflict.opponents.length === 0 ? "Mining operations secured without opposition." : "Your arguments prevailed over the opposition.")
                                            : "You failed to convince the assembly."
                                    }
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-8 flex flex-col items-center gap-8">

                                {/* RE-ROLL STATE: Caused by Draw (Politician) OR Energy Bid (Loss) */}
                                {step === 'outcome_rsp' && result?.restart && (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <p className="text-white text-lg uppercase tracking-widest mb-2">
                                            {result.isDraw ? "Resolve the Conflict. Confrontation restarted:" : "Energy Bid active: Confrontation restarted!"}
                                        </p>
                                        <div className="flex gap-6 mt-4">
                                            <button
                                                onClick={handleReRollRequest}
                                                className="px-8 py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest hover:bg-[#ffe066] rounded shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                            >
                                                Select New Argument
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* WIN/LOSE/SPECIAL-DRAW: Next/Close */}
                                {step === 'outcome_rsp' && !result?.restart && (
                                    <div className="text-center">
                                        {result?.winnerId === localPlayerId && (
                                            <div className="flex flex-col items-center">
                                                <div className="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                                                    <div className="relative w-16 h-16">
                                                        <Image
                                                            src={(() => {
                                                                const actorType = conflict.playerActor?.actorType?.toLowerCase();
                                                                // Use resourceType from conflict first (passed from event reward)
                                                                if (conflict.resourceType) return RESOURCE_ICONS[conflict.resourceType] || RESOURCE_ICONS['fame'];

                                                                if (actorType === 'politician') return RESOURCE_ICONS['power'];
                                                                if (actorType === 'scientist') return RESOURCE_ICONS['knowledge'];
                                                                if (actorType === 'artist') return RESOURCE_ICONS['art'];
                                                                return RESOURCE_ICONS['fame'];
                                                            })()}
                                                            fill className="object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" alt="Resource Won"
                                                        />
                                                    </div>
                                                    <div className="absolute -bottom-2 right-0 bg-[#d4af37] text-black font-black text-xl px-2 py-0.5 rounded-md border-2 border-black shadow-lg shadow-[#d4af37]/50">
                                                        +{(() => {
                                                            const isRobot = conflict.playerActor?.actorType?.toLowerCase() === 'robot';
                                                            const baseReward = isRobot ? 3 : 1;
                                                            return conflict.playerActor?.bid === 'product' ? baseReward + 1 : baseReward;
                                                        })()}
                                                    </div>
                                                </div>
                                                <p className="text-xl font-bold uppercase text-white mb-6">Resource Secured</p>
                                            </div>
                                        )}
                                        {/* Shared Rewards Logic (Scientist/Robot Draw) */}
                                        {result?.isDraw && result?.shareRewards && (
                                            <div className="flex flex-col items-center">
                                                <div className="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                                                    <div className="relative w-16 h-16">
                                                        <Image
                                                            src={(() => {
                                                                const actorType = conflict.playerActor?.actorType?.toLowerCase();
                                                                if (actorType === 'politician') return RESOURCE_ICONS['power'];
                                                                if (actorType === 'scientist') return RESOURCE_ICONS['knowledge'];
                                                                if (actorType === 'artist') return RESOURCE_ICONS['art'];
                                                                return RESOURCE_ICONS[conflict.resourceType] || '/resources/resource_product.png';
                                                            })()}
                                                            fill className="object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" alt="Resource Won"
                                                        />
                                                    </div>
                                                    <div className="absolute -bottom-2 right-0 bg-[#d4af37] text-black font-black text-xl px-2 py-0.5 rounded-md border-2 border-black shadow-lg shadow-[#d4af37]/50">
                                                        +1
                                                    </div>
                                                </div>
                                                <p className="text-xl font-bold uppercase text-white mb-6">Shared Resource</p>
                                            </div>
                                        )}
                                        {/* If not a winner and not sharing, display nothing but the button */}
                                        <button
                                            onClick={handleNext}
                                            className="px-10 py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest rounded hover:bg-[#ffe066] mt-4"
                                        >
                                            {hasNextConflict ? 'Next Step' : 'Next Phase'}
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

