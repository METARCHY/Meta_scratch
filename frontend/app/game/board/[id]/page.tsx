"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, Check, X } from "lucide-react";
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
import ActionCardsPanel from "@/components/game/ActionCardsPanel";
import ExchangeModal from "@/components/game/ExchangeModal";
import { formatLog } from '@/lib/logUtils';

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

const AUTO_PLACEMENTS = [
    // Viper (p2)
    { actorId: "v1", playerId: "p2", locId: "square", type: "rock", isOpponent: true, name: "Politician", actorType: "politician", avatar: "/actors/actor_scientist.png", bid: "product" },
    { actorId: "v2", playerId: "p2", locId: "factory", type: "paper", isOpponent: true, name: "Robot", actorType: "robot", avatar: "/actors/actor_politician.png", bid: "energy" },
    { actorId: "v3", playerId: "p2", locId: "university", type: "scissors", isOpponent: true, name: "Scientist", actorType: "scientist", avatar: "/actors/actor_robot.png" },
    { actorId: "v4", playerId: "p2", locId: "theatre", type: "rock", isOpponent: true, name: "Artist", actorType: "artist", avatar: "/actors/actor_artist.png" },
    // Ghost (p3)
    { actorId: "g1", playerId: "p3", locId: "university", type: "scissors", isOpponent: true, name: "Politician", actorType: "politician", avatar: "/actors/actor_scientist.png", bid: "recycle" },
    { actorId: "g2", playerId: "p3", locId: "dump", type: "rock", isOpponent: true, name: "Robot", actorType: "robot", avatar: "/actors/actor_politician.png" },
    { actorId: "g3", playerId: "p3", locId: "theatre", type: "paper", isOpponent: true, name: "Scientist", actorType: "scientist", avatar: "/actors/actor_robot.png" },
    { actorId: "g4", playerId: "p3", locId: "square", type: "scissors", isOpponent: true, name: "Artist", actorType: "artist", avatar: "/actors/actor_artist.png" },
];

export default function GameBoardPage() {
    const { id } = useParams();
    // --- State Management ---
    const { resources, updateResource, player } = useGameState();
    const [game, setGame] = useState<any>(null);
    const [phase, setPhase] = useState(2); // Game starts at T1P2
    const [turn, setTurn] = useState(1);
    const [opponentsReady, setOpponentsReady] = useState(false);

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

    // --- Opponent Emulation ---
    useEffect(() => {
        if (phase === 2 && !opponentsReady && game) {
            triggerOpponentPlacements();
        }
    }, [phase, game, opponentsReady]);

    const triggerOpponentPlacements = async () => {
        if (!game) return;
        setOpponentsReady(true);

        await new Promise(r => setTimeout(r, 1500));

        const opponentActions = AUTO_PLACEMENTS;

        for (const action of opponentActions) {
            setPlacedActors(prev => {
                if (prev.some(p => p.actorId === action.actorId)) return prev;
                return [...prev, action];
            });

            const playerName = PLAYERS.find(p => p.id === action.playerId)?.name || action.playerId;
            await addLog(`${playerName} placed ${action.name} with ${action.type.toUpperCase()} to ${action.locId}`);

            await new Promise(r => setTimeout(r, 600)); // Increased delay for stability
        }

        await addLog("Viper (p2) ready");
        await new Promise(r => setTimeout(r, 600));
        await addLog("Ghost (p3) ready");
    };

    const addLog = async (msg: string) => {
        if (!id || !game) return;

        // Optimistically update local state with a functional update to avoid stale closures
        const formattedMsg = formatLog(game.displayId || game.id as string, msg);
        setGame((prev: any) => ({
            ...prev,
            logs: [...(prev?.logs || []), formattedMsg]
        }));

        try {
            await fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add-log', message: msg })
            });
        } catch (e) {
            console.error("Failed to sync log", e);
        }
    };

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
    const [biddingActorId, setBiddingActorId] = useState<string | null>(null);
    const [p3Step, setP3Step] = useState<1 | 2 | 3 | 4>(1); // 1: Bidding, 2: Stop, 3: Teleport, 4: Exchange
    const [actionHand, setActionHand] = useState<any[]>([]);

    const filteredActionHand = useMemo(() => {
        if (p3Step === 1) return [];
        if (p3Step === 2) return actionHand.filter(c => c.type === 'location');
        if (p3Step === 3) return actionHand.filter(c => c.id.includes('relocation') || c.id.includes('teleport'));
        if (p3Step === 4) return actionHand.filter(c => c.id.includes('change_values') || c.id.includes('exchange'));
        return [];
    }, [p3Step, actionHand]);

    // Count available teleport cards
    const teleportCardsCount = useMemo(() => {
        return actionHand.filter(c => c.id.includes('relocation') || c.id.includes('teleport')).length;
    }, [actionHand]);

    // Count available exchange cards
    const exchangeCardsCount = useMemo(() => {
        return actionHand.filter(c => c.id.includes('change_values') || c.id.includes('exchange')).length;
    }, [actionHand]);


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

        // DEBUG: Seed action cards for testing
        setActionHand([
            { id: 'relocation_1', type: 'special', title: 'Relocation', desc: 'Teleport an actor' },
            { id: 'relocation_2', type: 'special', title: 'Relocation', desc: 'Teleport an actor' },
            { id: 'exchange_1', type: 'special', title: 'Exchange', desc: 'Swap resources' }
        ]);
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
        addLog(`Event Result: ${msg}`);
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

    // Generic Card Action Handler
    const handleCardAction = (cardId: string, locId: string) => {
        // Implement "Stopping Locations" logic (Phase 3 Step 2)
        if (p3Step === 2) {
            setDisabledLocations(prev => [...prev, locId]);
            addLog(`${player.name || '080'} disabled ${locId}`);
            // Decrement card... (Assuming unlimited for now or need similar logic to teleport)

            // Simple card consumption from hand simulation
            const cardIndex = actionHand.findIndex(c => c.type === 'location'); // roughly
            if (cardIndex !== -1) {
                setActionHand(prev => {
                    const newHand = [...prev];
                    newHand.splice(cardIndex, 1);
                    return newHand;
                });
            }
        }
    }

    const handleHexClick = async (locId: string) => {
        if (disabledLocations.includes(locId)) return;

        // Teleport overrides
        // Phase 3 Step 2: Stopping Locations
        if (phase === 3 && p3Step === 2 && activeCardId) {
            handleCardAction(activeCardId, locId);
            setActiveCardId(null);
            return;
        }

        // Phase 3 Step 3: Teleportation
        if (phase === 3 && p3Step === 3 && teleportSource) {
            const actor = placedActors.find(p => p.actorId === teleportSource);
            if (!actor) return;

            // Validate Move - Robot Requirement or general proximity if needed
            // For now, if robot, we can strictly enforce ALLOWED_MOVES again as a "hint"
            if (actor.type === 'robot') {
                const validTargets = ALLOWED_MOVES[actor.type];
                if (!validTargets?.includes(locId)) {
                    addLog(`Invalid move for Robot! Must move to ${validTargets?.join(', ')}`);
                    return;
                }
            }

            // Execute Teleport
            setPlacedActors(prev => prev.map(p => p.actorId === teleportSource ? { ...p, locId } : p));
            setTeleportSource(null);

            // Consume Card
            const cardIndex = actionHand.findIndex(c => c.id.includes('relocation') || c.id.includes('teleport'));
            if (cardIndex !== -1) {
                setActionHand(prev => {
                    const newHand = [...prev];
                    newHand.splice(cardIndex, 1);
                    return newHand;
                });
            }

            await addLog(`${player.name || '080'} teleported ${actor.type} to ${locId}`);
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

            const actor = MY_ACTORS.find(a => a.id === pendingPlacement.actorId);
            addLog(`${player.name || '080'} placed ${actor?.name} with ${type.toUpperCase()} to ${pendingPlacement.locId}`);
        }
    };

    const handleBid = (resourceType: 'product' | 'energy' | 'recycle' | null) => {
        if (!biddingActorId) return;

        const actorEntry = placedActors.find(p => p.actorId === biddingActorId);
        const oldBid = actorEntry?.bid as 'product' | 'energy' | 'recycle' | undefined;

        // 1. Clear/Detach Logic: If resourceType is null OR same as oldBid
        if (resourceType === null || oldBid === resourceType) {
            if (oldBid) {
                updateResource(oldBid, (resources[oldBid] || 0) + 1);
                setPlacedActors(prev => prev.map(p =>
                    p.actorId === biddingActorId ? { ...p, bid: undefined } : p
                ));
                addLog(`${player.name || '080'} removed bet from actor`);
            }
            setBiddingActorId(null);
            return;
        }

        // 2. Check if new resource is available
        const newAmount = (resources as any)[resourceType] || 0;
        if (newAmount <= 0) return;

        // 3. Swap Logic: Return old resource if it exists
        if (oldBid) {
            updateResource(oldBid, (resources[oldBid] || 0) + 1);
        }

        // 4. Deduct new resource
        updateResource(resourceType, newAmount - 1);

        // 5. Update placed actor
        setPlacedActors(prev => prev.map(p =>
            p.actorId === biddingActorId ? { ...p, bid: resourceType } : p
        ));

        const actor = MY_ACTORS.find(a => a.id === biddingActorId);
        const betType = resourceType === 'product' ? 'WIN' : resourceType === 'energy' ? 'LOSE' : 'DRAW';
        addLog(`${player.name || '080'} BET ON ${betType} with ${actor?.name}`);
        setBiddingActorId(null);
    };

    const handleActorRecall = (actor: any) => {
        if (phase !== 2) return;
        if (actor.playerId !== 'p1') return;

        console.log("Recalling actor:", actor.actorId);
        addLog(`Recalled ${actor.type} from map`);
        setPlacedActors(prev => prev.filter(p => p.actorId !== actor.actorId));

        // Reset any pending states to prevent UI ghosting
        setSelectedActorId(null);
        setPendingPlacement(null);
    };

    // Phase 3 Step 4: Exchange Logic
    const handleExchangeConfirm = (resource: 'authority' | 'influence' | 'media') => {
        if (!exchangeTarget) return;

        // In a real game, this would swap resources between players.
        // For MVP/Demo: Just log it and consume card to simulate the transaction.
        addLog(`${player.name || '080'} exchanged ${resource.toUpperCase()} with ${exchangeTarget.id === 'p2' ? 'Viper' : 'Ghost'}`);

        // Consume Card
        const cardIndex = actionHand.findIndex(c => c.id.includes('change_values') || c.id.includes('exchange'));
        if (cardIndex !== -1) {
            setActionHand(prev => {
                const newHand = [...prev];
                newHand.splice(cardIndex, 1);
                return newHand;
            });
        }

        setExchangeTarget(null);
    };

    // --- Phase Advancement ---
    const handleNextPhase = () => {
        if (turn === 7 && phase === 5) {
            alert("GAME FINISH");
            return;
        }

        // Phase 3 Sub-step Logic
        if (phase === 3) {
            if (p3Step < 4) {
                const nextStep = (p3Step + 1) as 1 | 2 | 3 | 4;
                setP3Step(nextStep);
                const stepNames = ["", "BIDDING", "STOPPING LOCATIONS", "RELOCATION", "EXCHANGE"];
                addLog(`${player.name || '080'} advanced to ${stepNames[nextStep]}`);
                return;
            }
        }

        if (phase < 5) {
            const nextPhase = phase + 1;
            setPhase(nextPhase);
            // Reset P3 step when leaving P3
            if (nextPhase !== 3) setP3Step(1);
            addLog(`${player.name || '080'} ready`);
            addLog(`PHASE ${nextPhase}`);
        } else {
            setPhase(1);
            setP3Step(1);
            setTurn(t => t + 1);
            addLog(`TURN ${turn + 1} BEGINS`);
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
                    p3Step={p3Step}
                    placedActors={placedActors}
                    selectedActorId={selectedActorId}
                    hoveredActorId={hoveredActorId}
                    disabledLocations={disabledLocations}
                    teleportSource={teleportSource}
                    selectedHex={selectedHex}
                    playerActorsV2={MY_ACTORS}
                    players={PLAYERS}
                    availableTeleportCards={teleportCardsCount}
                    onHexClick={handleHexClick}
                    onPlayerClick={(actor, e) => {
                        if (phase === 2) handleActorRecall(actor);
                        if (phase === 3 && p3Step === 1 && actor.playerId === 'p1') {
                            // Toggle menu
                            setBiddingActorId(prev => prev === actor.actorId ? null : actor.actorId);
                        }
                        if (phase === 3 && p3Step === 3 && actor.playerId === 'p1') {
                            // Start Teleport if cards available
                            if (teleportCardsCount > 0) {
                                setTeleportSource(prev => prev === actor.actorId ? null : actor.actorId);
                                if (teleportSource !== actor.actorId) {
                                    addLog(`Selected ${actor.type} for teleport... choose a destination.`);
                                }
                            } else {
                                addLog("No Relocation cards available.");
                            }
                        }
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
                                    phase === 3 ? (
                                        p3Step === 1 ? "ACTION: BIDDING" :
                                            p3Step === 2 ? "ACTION: STOP LOCATIONS" :
                                                p3Step === 3 ? "ACTION: RELOCATION" : "ACTION: EXCHANGE"
                                    ) :
                                        phase === 4 ? "CONFLICTS" : "RESOLUTION"
                        }
                    />

                    {/* Top Center: Resources (Layered ABOVE Header) */}
                    <GameResources resources={resources} vp={vp} />

                    {/* Top Left: New Players Panel (SVG) */}
                    <NewPlayersPanel
                        players={dynamicPlayers}
                        p3Step={p3Step}
                        availableExchangeCards={exchangeCardsCount}
                        onExchangeClick={(id, name) => setExchangeTarget({ id, x: 0, y: 0 })} // x/y not needed for modal
                    />

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
                        {phase === 3 && p3Step > 1 && (
                            <ActionCardsPanel
                                cards={filteredActionHand}
                                onSelect={setActiveCardId}
                                activeCardId={activeCardId}
                                emptyMessage="NO ACTION CARDS"
                                compact={p3Step >= 3}
                            />
                        )}
                    </div>



                    {/* Bottom Right: Next Phase Button */}
                    {/* Bottom Right: Next Phase Button */}
                    {/* Bottom Right: Next Phase Button */}
                    <div className="absolute bottom-10 right-10 pointer-events-auto">
                        {/* Only show Next Phase if not in Phase 2 OR if all actors distributed */}
                        {(phase !== 2 || availableActors.length === 0) && (
                            <button
                                onClick={handleNextPhase}
                                className="px-8 py-3 bg-[#d4af37] text-black font-bold rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#ffe066] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
                            >
                                {phase === 3 ? (
                                    p3Step === 1 ? "Start Disabling" :
                                        p3Step === 2 ? "Start Teleport" :
                                            p3Step === 3 ? "Start Exchange" :
                                                "Start Conflicts"
                                ) : "Next Phase"}
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

                    {/* --- Bidding Menu for Phase 3 --- */}
                    {phase === 3 && biddingActorId && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
                            <div className="bg-[#0d0d12]/90 backdrop-blur-md border border-[#d4af37]/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                                <h3 className="text-[#d4af37] font-rajdhani font-bold uppercase tracking-widest text-sm">Make a Bid...</h3>
                                <div className="flex gap-6">
                                    {[
                                        { type: 'product', label: 'bet on win', icon: '/resources/resource_box.png', color: 'bg-red-500/10' },
                                        { type: 'energy', label: 'bet on lose', icon: '/resources/resource_energy.png', color: 'bg-blue-500/10' },
                                        { type: 'recycle', label: 'bet on draw', icon: '/resources/resource_bio.png', color: 'bg-green-500/10' }
                                    ].map((res) => (
                                        <button
                                            key={res.type}
                                            onClick={() => handleBid(res.type as any)}
                                            disabled={resources[res.type as keyof typeof resources] <= 0}
                                            className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 hover:border-[#d4af37]/50 hover:bg-white/5 transition-all disabled:opacity-30 disabled:grayscale"
                                        >
                                            <div className={`relative w-12 h-12 p-2 rounded-full ${res.color} border border-white/5 group-hover:border-[#d4af37]/30 transition-colors`}>
                                                <Image
                                                    src={res.icon}
                                                    fill
                                                    className="object-contain p-1"
                                                    alt={res.type}
                                                />
                                            </div>
                                            <span className="text-[10px] uppercase font-bold tracking-tighter text-gray-400 group-hover:text-white">{res.label}</span>
                                            <span className="text-xs font-mono text-white/50">{resources[res.type as keyof typeof resources]}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <button
                                        onClick={() => handleBid(null)}
                                        className="w-full py-2 text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest font-bold border border-red-500/20 rounded hover:bg-red-500/10 transition-all mb-2"
                                    >
                                        Undo / Clear Bet
                                    </button>
                                    <button
                                        onClick={() => setBiddingActorId(null)}
                                        className="w-full text-[10px] text-gray-500 hover:text-white uppercase tracking-[0.2em] font-bold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div >
                    )
                    }

                    {/* --- Exchange Modal --- */}
                    {exchangeTarget && (
                        <div className="absolute inset-0 z-[60] pointer-events-auto">
                            <ExchangeModal
                                isOpen={true}
                                onClose={() => setExchangeTarget(null)}
                                onConfirm={handleExchangeConfirm}
                                targetName={exchangeTarget.id === 'p2' ? 'Viper' : 'Ghost'}
                            />
                        </div>
                    )}

                    {/* --- Phase 1: Event Modal --- */}
                    {
                        phase === 1 && (
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
                        )
                    }
                </div >
            </main >
        </TooltipProvider >
    );
}
