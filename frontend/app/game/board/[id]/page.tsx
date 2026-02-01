"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, Check, X, Box, Zap, Recycle } from "lucide-react";
import { useGameState } from "@/context/GameStateContext";
import { TooltipProvider } from "@/context/TooltipContext";
import CursorTooltip from "@/components/ui/CursorTooltip";
import { useParams } from "next/navigation";

// Modular Components
import NewPlayersPanel from "@/components/game/NewPlayersPanel";
import ActorsPanel from "@/components/game/ActorsPanel";
import MapContainer from "@/components/game/MapContainer";
import GameHeader from "@/components/game/GameHeader";
import GameResources from "@/components/game/GameResources";
import RSPRadialMenu from "@/components/game/RSPRadialMenu";

// Constants
import { EVENTS, LOCATIONS, ACTION_CARDS, getConflicts, ALLOWED_MOVES } from '@/data/gameConstants';

// --- MOCK DATA FOR ACTORS (Assuming these will come from State/Wallet later) ---
const ACTOR_TYPES: { [key: string]: { name: string, avatar: string } } = {
    "politician": { name: "Politician", avatar: "/actors/actor_scientist.png" },
    "robot": { name: "Robot", avatar: "/actors/actor_politician.png" },
    "scientist": { name: "Scientist", avatar: "/actors/actor_robot.png" },
    "artist": { name: "Artist", avatar: "/actors/actor_artist.png" }
};

const MY_ACTORS = [
    { id: "a1", type: "politician", avatar: ACTOR_TYPES.politician.avatar, name: ACTOR_TYPES.politician.name },
    { id: "a3", type: "scientist", avatar: ACTOR_TYPES.scientist.avatar, name: ACTOR_TYPES.scientist.name },
    { id: "a4", type: "artist", avatar: ACTOR_TYPES.artist.avatar, name: ACTOR_TYPES.artist.name },
    { id: "a2", type: "robot", avatar: ACTOR_TYPES.robot.avatar, name: ACTOR_TYPES.robot.name }
];

const PLAYERS = [
    { id: 'p2', name: 'Viper', avatar: '/avatars/viper.png', color: '#ff4444' },
    { id: 'p3', name: 'Ghost', avatar: '/avatars/ghost.png', color: '#44ff44' },
    { id: 'p4', name: 'Union', avatar: '/avatars/avatar_union.png', color: '#4444ff' },
];

export default function GameBoardPage() {
    const { id } = useParams();
    // --- State Management ---
    const { resources, updateResource, player } = useGameState();
    const [game, setGame] = useState<any>(null);
    const [phase, setPhase] = useState(2); // Game starts at T1P2
    const [turn, setTurn] = useState(1);

    // Fetch Specific Game Data
    useEffect(() => {
        if (!id) return;

        const fetchGame = async () => {
            try {
                const res = await fetch(`/api/games/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGame(data);
                    // Sync turn/phase if needed, but for now we keep local for simulation
                }
            } catch (e) {
                console.error("Fetch game error", e);
            }
        };

        fetchGame();
        const interval = setInterval(fetchGame, 2000);
        return () => clearInterval(interval);
    }, [id]);

    console.log("GameBoardPage Rendering, Phase:", phase, "Turn:", turn);

    // Phase 1: Events
    const [currentEvent, setCurrentEvent] = useState(EVENTS[0]);
    const [discardAmount, setDiscardAmount] = useState(0);
    const [eventResult, setEventResult] = useState<{ msg: string, win: boolean } | null>(null);

    // Phase 2: Distribution / Placement
    const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
    const [hoveredActorId, setHoveredActorId] = useState<string | null>(null);
    const [selectedHex, setSelectedHex] = useState<string | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);
    const [placedActors, setPlacedActors] = useState<any[]>([]);
    const [pendingPlacement, setPendingPlacement] = useState<{ actorId: string, locId: string } | null>(null);

    // Phase 3: Action Phase
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [activatedCards, setActivatedCards] = useState<string[]>([]);
    const [disabledLocations, setDisabledLocations] = useState<string[]>([]);
    const [exchangeTarget, setExchangeTarget] = useState<{ id: string, x: number, y: number } | null>(null);
    const [teleportSource, setTeleportSource] = useState<string | null>(null);

    // Phase 4: Conflicts
    const [activeConflictId, setActiveConflictId] = useState<string | null>(null);
    const [conflictState, setConflictState] = useState<'choose' | 'result'>('choose');

    // --- Derived State ---
    const usedRSPs = placedActors.filter(p => p.playerId === "p1").map(p => p.type);
    const availableActors = MY_ACTORS.filter(a => !placedActors.find(p => p.actorId === a.id));

    // Construct dynamic player list
    const dynamicPlayers = useMemo(() => {
        const mainPlayer = {
            id: 'p1',
            name: player.name || '080',
            avatar: player.avatar || '/avatars/golden_avatar.png',
            address: player.address
        };

        if (!game) return [mainPlayer, PLAYERS[0], PLAYERS[1]];

        // Filter out current player from joined players to find opponents
        const otherPlayers = game.players.filter((p: any) => p.citizenId !== player.citizenId);

        const opponent1 = otherPlayers.length > 0 ? otherPlayers[0] : PLAYERS[0];
        const opponent2 = otherPlayers.length > 1 ? otherPlayers[1] : PLAYERS[1];

        return [mainPlayer, opponent1, opponent2];
    }, [player, game]);

    // VP Calculation logic
    const vp = useMemo(() => {
        const { power, knowledge, art, glory } = resources;
        let p = power, k = knowledge, a = art, g = glory;
        while (g > 0) {
            if (p <= k && p <= a) p++;
            else if (k <= p && k <= a) k++;
            else a++;
            g--;
        }
        return Math.min(p, k, a);
    }, [resources]);

    // --- Effects ---
    useEffect(() => {
        // Hydration matching for random event
        const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        setCurrentEvent(randomEvent);
    }, []);


    // --- Handlers ---

    // Phase 1: Event Logic
    const handleEventConfirm = () => {
        let win = false;
        let msg = "";

        if (currentEvent.type === "discard") {
            const maxOpponentDiscard = Math.floor(Math.random() * 4);
            win = discardAmount > maxOpponentDiscard;
            const currentAmount = (resources as any)[currentEvent.targetResource] || 0;
            updateResource(currentEvent.targetResource, Math.max(0, currentAmount - discardAmount));
            msg = win
                ? `You discarded ${discardAmount} (Opponent max: ${maxOpponentDiscard}). You WIN an Action Card!`
                : `You discarded ${discardAmount} (Opponent max: ${maxOpponentDiscard}). You lost.`;
        } else {
            const opponentStats = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
            const myStat = (resources as any)[currentEvent.targetResource] || 0;
            if (currentEvent.winCondition === "min") {
                const minOpponent = Math.min(...opponentStats);
                win = myStat < minOpponent;
                msg = win ? "You WIN Glory!" : "You lost.";
            } else {
                const maxOpponent = Math.max(...opponentStats);
                win = myStat > maxOpponent;
                msg = win ? "You WIN Glory!" : "You lost.";
            }
        }

        if (win && currentEvent.reward === "glory") updateResource('glory', resources.glory + 1);
        setEventResult({ msg, win });
    };

    const closeEvent = () => {
        setEventResult(null);
        setPhase(2);
    };

    // Phase 2: Placement Logic
    const handleActorSelect = (id: string) => {
        if (placedActors.find(p => p.actorId === id)) return;
        setSelectedActorId(id);
        setPendingPlacement(null);
    };

    const handleHexClick = (locId: string) => {
        if (disabledLocations.includes(locId)) return;

        // Teleport overrides
        if (phase === 3 && activeCardId === 'teleport' && teleportSource) {
            setPlacedActors(prev => prev.map(p => p.actorId === teleportSource ? { ...p, locId } : p));
            setActivatedCards(prev => [...prev, 'teleport']);
            setActiveCardId(null);
            setTeleportSource(null);
            return;
        }

        if (phase !== 2 || isWaiting) return;
        if (selectedActorId) {
            const actor = MY_ACTORS.find(a => a.id === selectedActorId);
            if (!actor) return;

            // Check Allowed locations (Validation logic)
            const allowedLocs = ALLOWED_MOVES[actor.type] || [];
            if (!allowedLocs.includes(locId)) {
                console.log(`Placement blocked: ${actor.type} cannot go to ${locId}`);
                return;
            }

            // Allow stacking (Removed existing check)
            // const existing = placedActors.find(p => p.locId === locId && p.playerId === "p1");
            // if (existing) return;

            setPendingPlacement({ actorId: selectedActorId, locId });
        }
    };

    const handleRSPSelect = (type: string) => {
        if (pendingPlacement) {
            setPlacedActors(prev => [
                ...prev,
                { actorId: pendingPlacement.actorId, playerId: "p1", locId: pendingPlacement.locId, type, isOpponent: false }
            ]);
            setPendingPlacement(null);
            setSelectedActorId(null);

            // Auto-advance if all placed? Logic for now: user manually clicks Done or we check length
        }
    };

    const handleActorRecall = (actor: any) => {
        if (phase !== 2) return;
        if (actor.playerId !== 'p1') return;

        console.log("Recalling actor:", actor.actorId);
        setPlacedActors(prev => prev.filter(p => p.actorId !== actor.actorId));

        // Reset any pending states to prevent UI ghosting
        setSelectedActorId(null);
        setPendingPlacement(null);
    };

    // --- Phase Advancement ---
    const handleNextPhase = () => {
        if (turn === 7 && phase === 5) {
            alert("GAME FINISH");
            return;
        }

        if (phase < 5) {
            setPhase(phase + 1);
        } else {
            setPhase(1);
            setTurn(t => t + 1);
        }
    };

    // --- Render ---
    return (
        <TooltipProvider>
            <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans select-none">
                <CursorTooltip />

                {/* 1. Map Layer (Background / Center) */}
                <MapContainer
                    phase={phase}
                    placedActors={placedActors}
                    selectedActorId={selectedActorId}
                    hoveredActorId={hoveredActorId}
                    disabledLocations={disabledLocations}
                    teleportSource={teleportSource}
                    selectedHex={selectedHex}
                    playerActorsV2={MY_ACTORS}
                    players={PLAYERS}
                    onHexClick={handleHexClick}
                    onPlayerClick={(actor, e) => {
                        handleActorRecall(actor);
                    }}
                />

                {/* 2. UI Overlay Layer (Z-Indexed) */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* Top Center: Header (Snapped) */}
                    <GameHeader
                        turn={turn}
                        phase={phase}
                        phaseName={
                            phase === 1 ? "EVENT STAGE" :
                                phase === 2 ? "DISTRIBUTION" :
                                    phase === 3 ? "ACTION PHASE" :
                                        phase === 4 ? "CONFLICTS" : "RESOLUTION"
                        }
                    />

                    {/* Top Center: Resources (Layered ABOVE Header) */}
                    <GameResources resources={resources} vp={vp} />

                    {/* Top Left: New Players Panel (SVG) */}
                    <NewPlayersPanel players={dynamicPlayers} />

                    {/* Left Sidebar: Actors / Hand */}
                    <div className="pointer-events-auto">
                        {phase === 2 && !isWaiting && (
                            <ActorsPanel
                                actors={availableActors}
                                selectedActorId={selectedActorId}
                                onSelect={handleActorSelect}
                                onHover={setHoveredActorId}
                                onLeave={() => setHoveredActorId(null)}
                            />
                        )}
                    </div>

                    {/* Bottom Right: Next Phase Button */}
                    {/* Bottom Right: Next Phase Button */}
                    <div className="absolute bottom-10 right-10 pointer-events-auto">
                        {/* Only show Next Phase if not in Phase 2 OR if all actors distributed */}
                        {(phase !== 2 || availableActors.length === 0) && (
                            <button
                                onClick={handleNextPhase}
                                className="px-8 py-3 bg-[#d4af37] text-black font-bold rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#ffe066] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-widest"
                            >
                                Next Phase
                            </button>
                        )}
                    </div>

                    {/* --- Radial RSP Menu for Phase 2 --- */}
                    {phase === 2 && pendingPlacement && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
                            <RSPRadialMenu
                                actor={MY_ACTORS.find(a => a.id === pendingPlacement.actorId) || null}
                                usedTokens={usedRSPs}
                                onSelect={handleRSPSelect}
                                onCancel={() => setPendingPlacement(null)}
                            />
                        </div>
                    )}

                    {/* --- Phase 1: Event Modal --- */}
                    {phase === 1 && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
                            <div className="relative w-[600px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-2xl p-6 flex flex-col items-center">
                                <h2 className="text-xl font-bold text-[#d4af37] mb-2">{currentEvent.title}</h2>
                                <div className="relative w-full h-[200px] mb-4 border border-white/10 rounded overflow-hidden">
                                    <Image src={currentEvent.image} layout="fill" objectFit="cover" alt="event" />
                                </div>
                                <p className="italic text-gray-400 text-center mb-4">"{currentEvent.flavor}"</p>
                                <p className="text-white text-center mb-6">{currentEvent.desc}</p>

                                {!eventResult ? (
                                    <div className="flex gap-4">
                                        {currentEvent.type === "discard" && (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setDiscardAmount(d => Math.max(0, d - 1))} className="p-2 border rounded hover:bg-white/10">-</button>
                                                <span className="font-bold text-xl">{discardAmount}</span>
                                                <button onClick={() => setDiscardAmount(d => d + 1)} className="p-2 border rounded hover:bg-white/10">+</button>
                                            </div>
                                        )}
                                        <button onClick={handleEventConfirm} className="px-6 py-2 bg-[#d4af37] text-black font-bold rounded hover:bg-[#ffe066]">CONFIRM</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <p className={`font-bold ${eventResult.win ? 'text-green-400' : 'text-red-400'}`}>{eventResult.msg}</p>
                                        <button onClick={closeEvent} className="px-6 py-2 border border-white/30 rounded hover:bg-white/10">CONTINUE</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </TooltipProvider>
    );
}
