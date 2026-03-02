"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Types
export interface ConflictResult {
    winnerId: string | null; // null if true draw (and no draw bid wins)
    isDraw: boolean;
    restart: boolean; // For "Energy Bid" logic or Politician Draw
    evictAll: boolean; // For Artist Draw
    shareRewards: boolean; // For Scientist/Robot Draw
    usedBid?: string; // Tracks if a bid was actively consumed this round
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
    hasNextConflict?: boolean;
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

const RESOURCE_ICONS: { [key: string]: string } = {
    'glory': '/intangibles/resource_Glory.png',
    'power': '/intangibles/resource_power.png',
    'art': '/intangibles/resource_Art.png',
    'knowledge': '/intangibles/resource_wisdom.png',
    'product': '/resources/resource_product.png',
    'energy': '/resources/resource_energy.png',
    'recycle': '/resources/resource_Recycle.png'
};

const ACTOR_IMAGES: { [key: string]: string } = {
    'politician': '/actors/Polotican.png',
    'robot': '/actors/Robot.png',
    'scientist': '/actors/Scientist.png',
    'artist': '/actors/Artist.png'
};

import { useGameState } from '@/context/GameStateContext';

export default function ConflictResolutionView({ conflict, hasNextConflict, onResolve, onClose }: ConflictResolutionViewProps) {
    const { player } = useGameState();
    const [step, setStep] = useState<'intro' | 'reveal' | 'outcome_rsp' | 'outcome_bid'>('intro');

    // State for choices (Player can change theirs in Draw)
    const [playerChoice, setPlayerChoice] = useState<string>(conflict.playerActor.type || 'rock');
    const [opponentChoices, setOpponentChoices] = useState<{ [id: string]: string }>({});

    // Calculated Result
    const [result, setResult] = useState<ConflictResult | null>(null);

    // 1. Initialize Opponent Choices (Random for now)
    useEffect(() => {
        if (conflict.opponents.length === 0) {
            // Peaceful Mining: No opponents, auto-resolve
            const res = resolveConflict(playerChoice);
            setResult(res);
            setStep('outcome_rsp');
            return;
        }

        const choices: { [id: string]: string } = {};
        conflict.opponents.forEach(opp => {
            const roll = Math.random();
            choices[opp.actorId] = roll < 0.33 ? 'rock' : roll < 0.66 ? 'paper' : 'scissors';
        });
        setOpponentChoices(choices);
        setStep('intro');
        setResult(null);
    }, [conflict.locId]);

    // 2. Logic: Resolve the Conflict
    const resolveConflict = (pChoice: string, applyBids: boolean = true): ConflictResult => {
        if (conflict.opponents.length === 0) {
            return {
                winnerId: 'p1',
                isDraw: false,
                restart: false,
                evictAll: false,
                shareRewards: false,
                usedBid: undefined,
                logs: ["Area secured without opposition."]
            };
        }

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

        // Initial Result Values
        let finalWinnerId = winners.length === 1 ? winners[0].id : null;
        let finalIsDraw = isDraw || winners.length > 1;
        let finalRestart = false;
        let finalEvictAll = false;
        let finalShareRewards = false;
        const logs: string[] = [];

        // Log the actual choices
        const p1ActorType = conflict.playerActor.actorType?.toUpperCase() || 'ACTOR';
        const p1ChoiceStr = choices.find(c => c.id === 'p1')?.choice?.toUpperCase() || 'UNKNOWN';
        const oppDetails = conflict.opponents.map(opp => {
            const oppChoice = choices.find(c => c.id === opp.actorId)?.choice?.toUpperCase() || 'UNKNOWN';
            const oppActorType = opp.actorType?.toUpperCase() || 'ACTOR';
            return `${opp.name || 'Opponent'} used ${oppActorType} with ${oppChoice}`;
        });

        const locName = conflict.locationName || 'Unknown Location';
        logs.push(`Conflict at ${locName.toUpperCase()}: ${player.name || '080'} used ${p1ActorType} with ${p1ChoiceStr}. Opponents: ${oppDetails.join(', ')}.`);

        // Apply Bids to the outcome BEFORE Actor-specific draw logic
        // Only apply to P1 for now since opponents don't actively bid yet
        const p1ChoiceObj = choices.find(c => c.id === 'p1');
        const p1Bid = applyBids ? p1ChoiceObj?.bid : undefined;
        let usedBid: string | undefined = undefined;

        let p1Won = finalWinnerId === 'p1';
        let p1Lost = !p1Won && !finalIsDraw;

        if (p1Bid === 'recycle' && finalIsDraw) {
            logs.push("Recycle Bid Activated: Player wins the draw!");
            finalWinnerId = 'p1';
            finalIsDraw = false;
            p1Won = true;
            p1Lost = false;
            usedBid = 'recycle';
        }

        if (p1Bid === 'energy' && p1Lost) {
            logs.push("Energy Bid Activated: Defeat averted, conflict restarts.");
            finalRestart = true;
            usedBid = 'energy';
            // Energy bid forces a restart, bypassing other draw/loss logic
            return { winnerId: null, isDraw: false, restart: true, evictAll: false, shareRewards: false, usedBid, logs };
        }

        if (p1Bid === 'product' && p1Won) {
            usedBid = 'product'; // Track that product was actively used in this successful resolution
        }

        // Apply Actor-Specific Draw Logic (If STILL a draw after Recycle bid overrides)
        if (finalIsDraw) {
            const actorType = conflict.playerActor.actorType.toLowerCase();

            if (actorType === 'politician') {
                logs.push("Politicians clash in debate: Conflict must be re-resolved.");
                finalRestart = true; // Handled like an energy bid (shows re-roll screen)
            } else if (actorType === 'artist') {
                logs.push("Artists refuse to compromise: All Artists leave the location.");
                finalEvictAll = true;
            } else if (actorType === 'scientist' || actorType === 'robot') {
                logs.push(`${actorType}s find common ground: All remain and share the location.`);
                finalShareRewards = true;
                // Treat this as a win for everyone involved in terms of game flow, but handled specially by parent
            }
        }

        return {
            winnerId: finalWinnerId,
            isDraw: finalIsDraw,
            restart: finalRestart,
            evictAll: finalEvictAll,
            shareRewards: finalShareRewards,
            usedBid,
            logs
        };
    };

    // Handler: "Reveal" Button Click
    const handleReveal = () => {
        // If we already have a usedBid from a previous fail/draw, we know bids are burned.
        // Otherwise, it's the first time, so we apply bids.
        const areBidsActive = !result?.usedBid && !result?.restart;
        const res = resolveConflict(playerChoice, areBidsActive);

        // Preserve the usedBid state if it was already burned by an Energy bid
        if (result?.usedBid && !res.usedBid) {
            res.usedBid = result.usedBid;
        }

        setResult(res);
        setStep('reveal');

        // Auto-advance to Outcome Modal after animation
        setTimeout(() => setStep('outcome_rsp'), 2000);
    };

    // Handler: Trigger a Re-Roll (from Energy Bid or Politician Draw)
    const handleReRollRequest = () => {
        // Clear the player's choice so they have to pick again
        setPlayerChoice('');

        // Let's re-roll opponents randomly for the new attempt
        const newOppChoices: { [id: string]: string } = {};
        conflict.opponents.forEach(opp => {
            const roll = Math.random();
            newOppChoices[opp.actorId] = roll < 0.33 ? 'rock' : roll < 0.66 ? 'paper' : 'scissors';
        });
        setOpponentChoices(newOppChoices);

        // Reset the view back to the intro phase so the player can select a new token
        // We do NOT clear result.usedBid here because we want to remember that bids are burned!
        // We will pass a flag to handleReveal on the next click to know bids are burned.
        setStep('intro');
    };

    // Handler: Next (Check Bids or Close)
    const handleNext = () => {
        if (!result) return;

        // Bids logic that forces modal steps
        // Energy/Restart logic (Energy bid or Politician Draw)
        if (result.restart) {
            // Need to show "outcome_bid" first if it was an energy bid to explain the restart
            if (result.usedBid === 'energy' && step !== 'outcome_bid' && !result.isDraw) {
                setStep('outcome_bid');
                return;
            }
            // If it's a Politician draw, we just transition to 'outcome_rsp' and rely on the UI to show the Re-Roll buttons.
            if (step !== 'outcome_rsp') {
                setStep('outcome_rsp');
            }
        }

        // Product Bid logic (Win)
        if (result.usedBid === 'product' && result.winnerId === 'p1') {
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
        if (step === 'intro' || step === 'reveal') return false;
        if (!result) return false;
        // If draw, no one is loser yet (unless specific logic).
        if (result.isDraw) return false;
        return result.winnerId !== actorId;
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
                                <Image src={RSP_ICONS[playerChoice]} fill className="object-contain drop-shadow-[0_0_20px_rgba(255,255,0,0.5)]" alt="Player Choice" />
                            ) : (
                                <div className="w-full h-full rounded-full border-2 border-white/20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <span className="text-4xl font-bold text-white/50">?</span>
                                </div>
                            )}
                        </motion.div>
                        {/* 3. Bid Token */}
                        {conflict.playerActor.bid && (
                            <div className="w-12 h-12 relative animate-bounce">
                                <Image src={BID_ICONS[conflict.playerActor.bid]} fill className="object-contain drop-shadow-lg" alt="Bid" />
                            </div>
                        )}
                    </div>

                    {/* Actor Body */}
                    <div className="relative w-full h-[120%]">
                        <Image
                            src={ACTOR_IMAGES[conflict.playerActor.actorType.toLowerCase()] || ACTOR_IMAGES['politician']}
                            fill
                            className="object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                            alt="Player Actor"
                        />
                    </div>

                    {/* Tag */}
                    <div className="absolute bottom-8 bg-black/80 px-6 py-2 rounded-full border border-[#d4af37] text-[#d4af37] font-bold text-lg uppercase tracking-widest z-20">
                        YOU
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
                                        <Image src={RSP_ICONS[opponentChoices[opp.actorId]]} fill className="object-contain drop-shadow-2xl" alt="Opponent Choice" />
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
                                <Image
                                    src={ACTOR_IMAGES[opp.actorType?.toLowerCase()] || ACTOR_IMAGES['robot']}
                                    fill
                                    className={`object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] ${idx % 2 === 0 ? 'sepia-0' : 'sepia'}`}
                                    alt="Opponent Actor"
                                />
                            </div>

                            {/* Tag */}
                            <div className="absolute bottom-8 bg-black/80 px-4 py-1 rounded-full border border-white/30 text-white font-bold tracking-wider z-20">
                                {opp.name}
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
                                Select New Argument
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
                                <h2 className={`font-rajdhani font-bold text-4xl tracking-widest uppercase ${result?.isDraw ? 'text-blue-400' : result?.winnerId === 'p1' ? 'text-[#d4af37]' : 'text-red-500'}`}>
                                    {result?.isDraw
                                        ? (result.evictAll ? 'DISMISSED' : result.shareRewards ? 'TRUCE' : 'DRAW')
                                        : result?.winnerId === 'p1'
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
                                        : result?.winnerId === 'p1'
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
                                            {result.isDraw ? "Resolve the dispute. Confrontation restarted:" : "Energy Bid active: Confrontation restarted!"}
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
                                        {result?.winnerId === 'p1' && (
                                            <div className="flex flex-col items-center">
                                                <div className="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                                                    <div className="relative w-16 h-16">
                                                        <Image
                                                            src={(() => {
                                                                const actorType = conflict.playerActor.actorType?.toLowerCase();
                                                                if (actorType === 'politician') return RESOURCE_ICONS['power'];
                                                                if (actorType === 'scientist') return RESOURCE_ICONS['knowledge'];
                                                                if (actorType === 'artist') return RESOURCE_ICONS['art'];
                                                                return RESOURCE_ICONS[conflict.resourceType] || '/resources/resource_product.png';
                                                            })()}
                                                            fill className="object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" alt="Resource Won"
                                                        />
                                                    </div>
                                                    <div className="absolute -bottom-2 right-0 bg-[#d4af37] text-black font-black text-xl px-2 py-0.5 rounded-md border-2 border-black shadow-lg shadow-[#d4af37]/50">
                                                        +{conflict.playerActor.bid === 'product' ? 2 : 1}
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
                                                                const actorType = conflict.playerActor.actorType?.toLowerCase();
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

