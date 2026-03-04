"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, Check, X, Crown, Trophy } from "lucide-react";
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
import ConflictsSidebar from "@/components/game/ConflictsSidebar";
import ConflictResolutionView from "@/components/game/ConflictResolutionView";
import { ConflictResult } from "@/lib/game/ConflictResolver";
import MarketOfferModal, { MarketOffer } from '@/components/game/MarketOfferModal';
import MarketRevealModal from '@/components/game/MarketRevealModal';
import BuyActionCardModal from '@/components/game/BuyActionCardModal';
import { formatLog } from '@/lib/logUtils';
import { triggerBotPhase3Actions, triggerOpponentPlacements } from '@/lib/game/BotAI';
import { handleNextPhase } from '@/lib/game/PhaseEngine';

// Constants
import { EVENTS, LOCATIONS, ACTION_CARDS, getConflicts, ALLOWED_MOVES } from '@/data/gameConstants';

// --- MOCK DATA FOR ACTORS (Assuming these will come from State/Wallet later) ---
const ACTOR_TYPES: { [key: string]: { name: string, avatar: string, headAvatar: string } } = {
    "politician": { name: "Politician", avatar: "/actors/Polotican.png", headAvatar: "/actors/Politican_head.png" },
    "robot": { name: "Robot", avatar: "/actors/Robot.png", headAvatar: "/actors/Robot_head.png" },
    "scientist": { name: "Scientist", avatar: "/actors/Scientist.png", headAvatar: "/actors/Scientist_head.png" },
    "artist": { name: "Artist", avatar: "/actors/Artist.png", headAvatar: "/actors/Artist_head.png" }
};

const MY_ACTORS = [
    { id: "a1", type: "politician", avatar: ACTOR_TYPES.politician.avatar, headAvatar: ACTOR_TYPES.politician.headAvatar, name: ACTOR_TYPES.politician.name },
    { id: "a3", type: "scientist", avatar: ACTOR_TYPES.scientist.avatar, headAvatar: ACTOR_TYPES.scientist.headAvatar, name: ACTOR_TYPES.scientist.name },
    { id: "a4", type: "artist", avatar: ACTOR_TYPES.artist.avatar, headAvatar: ACTOR_TYPES.artist.headAvatar, name: ACTOR_TYPES.artist.name },
    { id: "a2", type: "robot", avatar: ACTOR_TYPES.robot.avatar, headAvatar: ACTOR_TYPES.robot.headAvatar, name: ACTOR_TYPES.robot.name }
];

const PLAYERS = [
    { id: 'p2', name: 'Viper', avatar: '/avatars/viper.png', color: '#ff4444' },
    { id: 'p3', name: 'Ghost', avatar: '/avatars/ghost.png', color: '#44ff44' },
    { id: 'p4', name: 'Union', avatar: '/avatars/avatar_union.png', color: '#4444ff' },
];

const AUTO_PLACEMENTS = [
    // Viper (p2)
    { actorId: "v1", playerId: "p2", locId: "square", type: "rock", isOpponent: true, name: "Politician", actorType: "politician", avatar: "/actors/Polotican.png", headAvatar: "/actors/Politican_head.png", bid: "product" },
    { actorId: "v2", playerId: "p2", locId: "factory", type: "paper", isOpponent: true, name: "Robot", actorType: "robot", avatar: "/actors/Robot.png", headAvatar: "/actors/Robot_head.png", bid: "energy" },
    { actorId: "v3", playerId: "p2", locId: "university", type: "scissors", isOpponent: true, name: "Scientist", actorType: "scientist", avatar: "/actors/Scientist.png", headAvatar: "/actors/Scientist_head.png" },
    { actorId: "v4", playerId: "p2", locId: "theatre", type: "rock", isOpponent: true, name: "Artist", actorType: "artist", avatar: "/actors/Artist.png", headAvatar: "/actors/Artist_head.png" },
    // Ghost (p3)
    { actorId: "g1", playerId: "p3", locId: "university", type: "scissors", isOpponent: true, name: "Politician", actorType: "politician", avatar: "/actors/Polotican.png", headAvatar: "/actors/Politican_head.png", bid: "recycle" },
    { actorId: "g2", playerId: "p3", locId: "dump", type: "rock", isOpponent: true, name: "Robot", actorType: "robot", avatar: "/actors/Robot.png", headAvatar: "/actors/Robot_head.png" },
    { actorId: "g3", playerId: "p3", locId: "theatre", type: "paper", isOpponent: true, name: "Scientist", actorType: "scientist", avatar: "/actors/Scientist.png", headAvatar: "/actors/Scientist_head.png" },
    { actorId: "g4", playerId: "p3", locId: "square", type: "scissors", isOpponent: true, name: "Artist", actorType: "artist", avatar: "/actors/Artist.png", headAvatar: "/actors/Artist_head.png" },
];

interface OpponentData {
    id: string;
    resources: Record<string, number>;
    cards: Record<string, number>;
}
export default function GameBoardPage() {
    const { id } = useParams();
    // --- State Management ---
    const { resources, updateResource, player } = useGameState();
    // --- Core Game State ---
    const [game, setGame] = useState<any>(null);
    const [phase, setPhase] = useState(2); // Game starts at T1P2
    const [turn, setTurn] = useState(1);
    const [placedActors, setPlacedActors] = useState<any[]>([]);
    const [disabledLocations, setDisabledLocations] = useState<string[]>([]);
    const [opponentsReady, setOpponentsReady] = useState(false);
    const [opponentsData, setOpponentsData] = useState<Record<string, OpponentData>>({});
    const [isGameOver, setIsGameOver] = useState(false);
    const [activeConflictLocId, setActiveConflictLocId] = useState<string | null>(null);
    const [resolvedConflicts, setResolvedConflicts] = useState<string[]>([]);
    const localPlayerId = player.citizenId || player.address || 'p1';



    // Initialize opponents data dynamically
    useEffect(() => {
        const initialOpponents: Record<string, OpponentData> = {};
        const isTest = game?.isTest;

        // Use game players if available (especially for bots)
        if (game && game.players) {
            game.players.forEach((p: any) => {
                if (p.citizenId !== player.citizenId) {
                    const id = p.citizenId || p.address;
                    initialOpponents[id] = {
                        id,
                        resources: isTest ? {
                            gato: 1000,
                            product: 2, energy: 2, recycle: 2,
                            power: 2, art: 2, knowledge: 2, glory: 2, vp: 0
                        } : {
                            gato: 1000,
                            product: 1, energy: 1, recycle: 1,
                            power: 0, art: 0, knowledge: 0, glory: 0, vp: 0
                        },
                        cards: isTest ? ACTION_CARDS.reduce((acc: any, c) => ({ ...acc, [c.id]: 2 }), {}) : {}
                    };
                }
            });
        } else {
            // Fallback for simulation
            PLAYERS.forEach(opp => {
                initialOpponents[opp.id] = {
                    id: opp.id,
                    resources: isTest ? {
                        gato: 1000,
                        product: 2, energy: 2, recycle: 2,
                        power: 2, art: 2, knowledge: 2, glory: 2, vp: 0
                    } : {
                        gato: 1000,
                        product: 1, energy: 1, recycle: 1,
                        power: 0, art: 0, knowledge: 0, glory: 0, vp: 0
                    },
                    cards: isTest ? ACTION_CARDS.reduce((acc: any, c) => ({ ...acc, [c.id]: 2 }), {}) : {}
                };
            });
        }
        setOpponentsData(initialOpponents);
    }, [game, player.citizenId]);

    // Fetch Specific Game Data
    useEffect(() => {
        if (!id) return;

        const fetchGame = async () => {
            try {
                const res = await fetch(`/api/games/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGame(data);

                    // IF TEST GAME: Initialize resources and cards
                    if (data.isTest && !game) { // Only do this once
                        // Set my resources
                        ['product', 'energy', 'recycle', 'power', 'art', 'knowledge', 'glory'].forEach(r => {
                            updateResource(r, 2);
                        });

                        // Set my cards (2 of each)
                        const testHand: any[] = [];
                        ACTION_CARDS.forEach(card => {
                            testHand.push({ ...card, instanceId: `${card.id}_1` });
                            testHand.push({ ...card, instanceId: `${card.id}_2` });
                        });
                        setActionHand(testHand);

                        // Opponent resources are now initialized in the useEffect above to prevent overwrites
                    }
                }
            } catch (e) {
                console.error("Fetch game error", e);
            }
        };

        fetchGame();
        const interval = setInterval(fetchGame, 2000);
        return () => clearInterval(interval);
    }, [id, game, player.citizenId, updateResource]);

    // Construct dynamic player list
    const dynamicPlayers = useMemo(() => {
        const mainPlayer = {
            id: player.citizenId || player.address || 'p1',
            name: player.name || '080',
            avatar: player.avatar || '/avatars/golden_avatar.png',
            address: player.address
        };

        if (!game) return [mainPlayer, PLAYERS[0], PLAYERS[1]];

        // Filter out current player from joined players to find opponents
        const otherPlayers = game.players
            .filter((p: any) => {
                if (player.citizenId && p.citizenId === player.citizenId) return false;
                if (player.address && p.address === player.address) return false;
                if (p.name && p.name === (player.name || '080')) return false;
                if (!player.citizenId && !player.address && p === game.players[0]) return false;
                return true;
            })
            .map((p: any, index: number) => ({
                ...p,
                id: p.citizenId || p.address || p.id || `bot-${index + 1}`, // Ensure consistent 'id' field
                name: p.name || PLAYERS[index]?.name || 'Citizen',
                avatar: p.avatar || PLAYERS[index]?.avatar || '/avatars/ghost.png'
            }));

        const finalPlayers = [mainPlayer, ...otherPlayers];

        // Only enforce exact 3-player formatting if it's a test game
        if (game?.isTest && finalPlayers.length < 3) {
            if (finalPlayers.length === 1) finalPlayers.push(PLAYERS[0], PLAYERS[1]);
            else if (finalPlayers.length === 2) finalPlayers.push(PLAYERS[1]);
        }

        return finalPlayers;
    }, [player.citizenId, player.address, player.name, player.avatar, game?.players, game?.isTest]);

    useEffect(() => {
        if (phase === 4) {
            import('@/lib/game/BotAI').then(m => {
                m.resolveBotOnlyConflicts(
                    placedActors,
                    disabledLocations,
                    resolvedConflicts,
                    dynamicPlayers,
                    localPlayerId,
                    addLog,
                    setOpponentsData,
                    setPlacedActors,
                    setResolvedConflicts
                );
            });
        }
    }, [phase, localPlayerId]);

    const localPhaseTicker = useRef(0);
    const isPlacingRef = useRef(false);
    const isStepActionRef = useRef(false);

    const [isWaitingForPlayers, setIsWaitingForPlayers] = useState(false);
    const [triggerGlobalPhaseAdvance, setTriggerGlobalPhaseAdvance] = useState(0);

    // Conflict Detection Logic (Local override of gameConstants version)
    const activeConflicts = useMemo(() => {
        if (phase !== 4) return [];

        const locsWithActors: { [key: string]: any[] } = {};
        placedActors.forEach(p => {
            if (!locsWithActors[p.locId]) locsWithActors[p.locId] = [];
            locsWithActors[p.locId].push(p);
        });

        const conflicts: any[] = [];
        Object.entries(locsWithActors).forEach(([locId, actors]) => {
            // Process ALL locations where actors exist, ignoring disabled locations
            if (!disabledLocations.includes(locId)) {
                // Determine all actor types present at this location to identify conflicts/peaceful resolutions
                const actorTypesAtLoc = Array.from(new Set(actors.map(a => a.actorType)));

                actorTypesAtLoc.forEach(actorType => {
                    // Find all actors of this type at this location
                    const actorsOfType = actors.filter(a => a.actorType === actorType);

                    // A "conflict" object is created if there's at least one actor (Peaceful or VS)
                    const locDef = LOCATIONS.find(l => l.id === locId);
                    const uniqueConflictId = `${locId}_${actorType}`;

                    // Don't duplicate
                    if (conflicts.find(c => c.locId === uniqueConflictId)) return;

                    // Divide into player and opponents for consistent modal display
                    const playerActorRaw = actorsOfType.find(a => a.playerId === localPlayerId) || actorsOfType[0];
                    const opponentsRaw = actorsOfType.filter(a => a.actorId !== playerActorRaw.actorId);

                    const playerActorSource = MY_ACTORS.find(p => p.id === playerActorRaw.actorId) ||
                        { avatar: playerActorRaw.avatar, headAvatar: playerActorRaw.headAvatar, type: playerActorRaw.actorType, name: playerActorRaw.name };

                    const playerActor = {
                        ...playerActorRaw,
                        avatar: playerActorSource?.avatar || '',
                        headAvatar: playerActorSource?.headAvatar || '',
                        type: playerActorRaw.type || playerActorSource?.type || 'unknown',
                        actorType: playerActorRaw.actorType || 'unknown'
                    };

                    conflicts.push({
                        locId: uniqueConflictId,
                        realLocId: locId,
                        locationName: locDef?.name || locId,
                        playerActor,
                        opponents: opponentsRaw.map(o => ({
                            ...o,
                            name: dynamicPlayers.find(p => p.id === o.playerId)?.name || PLAYERS.find(p => p.id === o.playerId)?.name || 'Unknown',
                            playerAvatar: dynamicPlayers.find(p => p.id === o.playerId)?.avatar || PLAYERS.find(p => p.id === o.playerId)?.avatar || '',
                        })),
                        resourceType: locDef?.resource || 'glory',
                        isPeaceful: opponentsRaw.length === 0,
                        hasPlayer: actorsOfType.some(a => a.playerId === localPlayerId)
                    });
                });
            }

        });
        return conflicts;
    }, [phase, placedActors, disabledLocations, resolvedConflicts, dynamicPlayers, localPlayerId]);

    const [stickyConflicts, setStickyConflicts] = useState<any[]>([]);

    // Logic to lock in conflicts when Phase 4 starts
    useEffect(() => {
        if (phase === 4 && activeConflicts.length > 0 && stickyConflicts.length === 0) {
            setStickyConflicts(activeConflicts);
        } else if (phase !== 4) {
            setStickyConflicts([]);
        }
    }, [phase, activeConflicts, stickyConflicts.length]);

    const commitTurn = async () => {
        if (!game || !player.citizenId) return;

        // If this is a Test Game against bots, we bypass the multiplayer lock entirely
        // NEW: But WE MUST wait for bots to be ready if they are performing actions!
        if (game.isTest) {
            if (!opponentsReady && phase !== 4) { // Phase 4 has its own resolution logic
                addLog("Wait for others to be ready...");
                return;
            }
            handleNextPhaseWrapper();
            addLog("All players are ready");
            return;
        }

        setIsWaitingForPlayers(true);
        try {
            const mainPlayerId = player.citizenId || player.address || 'p1';
            const myActors = placedActors.filter(a => a.playerId === mainPlayerId);

            await fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync-turn',
                    citizenId: mainPlayerId,
                    placedActors: myActors
                })
            });
        } catch (e) {
            console.error("Sync error", e);
            setIsWaitingForPlayers(false);
        }
    };


    // Client polling listener for global Phase Advance
    useEffect(() => {
        if (!game || !game.gameState) return;

        if (game.gameState.phaseTicker > localPhaseTicker.current) {
            localPhaseTicker.current = game.gameState.phaseTicker;

            // Merge staged actors from everyone
            let allStagedActors: any[] = [];
            Object.values(game.gameState.stagedActors || {}).forEach((actors: any) => {
                allStagedActors = [...allStagedActors, ...actors];
            });

            if (allStagedActors.length > 0) {
                setPlacedActors(allStagedActors);
            }

            setIsWaitingForPlayers(false);
            setTriggerGlobalPhaseAdvance(prev => prev + 1);
        }
    }, [game?.gameState?.phaseTicker]);

    // Triggers local progression with fresh states once sync resolves
    useEffect(() => {
        if (triggerGlobalPhaseAdvance > 0) {
            handleNextPhaseWrapper();
        }
    }, [triggerGlobalPhaseAdvance]);

    const handleNextPhaseWrapper = async () => {
        // --- End of Phase 4 Rewards ---
        if (phase === 4) {
            // Give rewards to all surviving actors that are not on disabled locations
            placedActors.forEach(actor => {
                const mainPlayerId = player.citizenId || player.address || 'p1';
                if ((actor.playerId === 'p1' || actor.playerId === mainPlayerId) && !disabledLocations.includes(actor.locId)) {
                    const actorType = actor.actorType?.toLowerCase();
                    const locDef = LOCATIONS.find(l => l.id === actor.locId);
                    let earnedResource = '';

                    if (actorType === 'politician') earnedResource = 'power';
                    else if (actorType === 'scientist') earnedResource = 'knowledge';
                    else if (actorType === 'artist') earnedResource = 'art';
                    else if (actorType === 'robot') earnedResource = locDef?.resource || '';

                    if (earnedResource) {
                        const isDouble = actor.bid === 'product'; // Product bet gives +1
                        let baseReward = 1;

                        // Rule: Robots earn 3 units normally, but only 1 if shared (Draw)
                        if (actorType === 'robot') {
                            const robotsAtLoc = placedActors.filter(a => a.locId === actor.locId && a.actorType?.toLowerCase() === 'robot' && !disabledLocations.includes(a.locId));
                            baseReward = robotsAtLoc.length > 1 ? 1 : 3;
                        }

                        const finalReward = isDouble ? (baseReward + 1) : baseReward;

                        updateResource(earnedResource, (resources as any)[earnedResource] + finalReward);
                        addLog(`${player.name || '080'} won ${finalReward} ${earnedResource.toUpperCase()} from ${actorType} at ${locDef?.name}!`);
                    }
                }
            });
        }

        const { handleNextPhase } = await import('@/lib/game/PhaseEngine');

        // Reset readiness if we are staying in Phase 3 or moving to a synced phase
        if (game?.isTest && (phase === 3 || (phase === 2 && availableActors.length === 0))) {
            setOpponentsReady(false);
        }

        // Custom wrapper for bot actions
        const triggerBotPhase3ActionsWrapper = async (step: number) => {
            if (isStepActionRef.current) return;
            isStepActionRef.current = true;
            try {
                const { triggerBotPhase3Actions } = await import('@/lib/game/BotAI');
                await triggerBotPhase3Actions(
                    game, step,
                    dynamicPlayers.filter(p => (p.citizenId || p.address || 'p1') !== (player.citizenId || player.address || 'p1')),
                    placedActors, addLog, setDisabledLocations, setPlacedActors,
                    setOpponentsReady // Pass readiness setter
                );
            } finally {
                isStepActionRef.current = false;
            }
        };


        const { isGameOver: gameEnded } = handleNextPhase(
            turn,
            phase,
            p3Step,
            player,
            dynamicPlayers,
            placedActors,
            disabledLocations,
            addLog,
            triggerBotPhase3ActionsWrapper,
            setPhase,
            setP3Step as any,
            setP5Step as any,
            setTurn,
            setPlacedActors,
            setResolvedConflicts,
            setDisabledLocations,
            setOpponentsReady,
            game?.isTest
        );


        if (gameEnded) {
            setIsGameOver(true);
        }


    };

    // --- Opponent Emulation ---
    useEffect(() => {
        if (phase === 2 && !opponentsReady && game) {
            triggerOpponentPlacements();
        }
    }, [phase, game, opponentsReady]);

    const triggerOpponentPlacements = async () => {
        if (isPlacingRef.current) return;
        isPlacingRef.current = true;
        try {
            const { triggerOpponentPlacements } = await import('@/lib/game/BotAI');
            await triggerOpponentPlacements(
                game,
                AUTO_PLACEMENTS,
                PLAYERS,
                setOpponentsReady,
                setPlacedActors,
                setOpponentsData,
                addLog
            );
        } finally {
            isPlacingRef.current = false;
        }
    };


    const triggerBotPhase3ActionsWrapper = async (step: number) => {
        if (!game) return;
        const mainPlayerId = player.citizenId || player.address || 'p1';
        const opponents = dynamicPlayers.filter(p => p.id !== mainPlayerId);

        const { triggerBotPhase3Actions } = await import('@/lib/game/BotAI');
        await triggerBotPhase3Actions(
            game, step, opponents, placedActors, addLog,
            setDisabledLocations, setPlacedActors, setOpponentsReady
        );
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
    const [pendingPlacement, setPendingPlacement] = useState<{ actorId: string, locId: string } | null>(null);

    // Phase 3: Action Phase
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [activatedCards, setActivatedCards] = useState<string[]>([]);
    const [exchangeTarget, setExchangeTarget] = useState<{ id: string, name: string, avatar: string } | null>(null);
    const [teleportSource, setTeleportSource] = useState<string | null>(null);
    const [biddingActorId, setBiddingActorId] = useState<string | null>(null);
    const [p3Step, setP3Step] = useState<1 | 2 | 3 | 4>(1); // 1: Bidding, 2: Stop, 3: Teleport, 4: Exchange
    const [p5Step, setP5Step] = useState<1 | 2 | 3>(1); // 1: Market Offer, 2: Market Reveal, 3: Buy Cards
    const [playerMarketOffer, setPlayerMarketOffer] = useState<MarketOffer | null>(null);
    const [botMarketOffers, setBotMarketOffers] = useState<{ [id: string]: MarketOffer | null }>({});
    const [marketMatchId, setMarketMatchId] = useState<string | null>(null);
    const [actionHand, setActionHand] = useState<any[]>([]);
    const [activationEffect, setActivationEffect] = useState<string | null>(null);

    const filteredActionHand = useMemo(() => {
        if (p3Step === 1) return [];
        if (p3Step === 2) return actionHand.filter(c => c.type === 'turn off location');
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


    // Derived: Current Active Conflict Object
    const currentConflict = useMemo(() => {
        return stickyConflicts.find(c => c.locId === activeConflictLocId);
    }, [stickyConflicts, activeConflictLocId]);


    // Auto-advance Phase 4 removed per user request:
    // Players must manually click "Next Phase" after resolving their own conflicts.



    const handleConflictResolve = (result: ConflictResult) => {
        if (!activeConflictLocId) return;

        // --- Burning Bets Rule ---
        // Clear the 'bid' property of all actors involved in this specific conflict immediately.
        // This ensures bets are lost even on restart/draw/loss.
        const involvedActorIds = [
            currentConflict?.playerActor.actorId,
            ...(currentConflict?.opponents.map((o: any) => o.actorId) || [])
        ].filter(Boolean);

        setPlacedActors(prev => prev.map(actor => {
            if (involvedActorIds.includes(actor.actorId)) {
                if (actor.bid) {
                    addLog(`The bet on ${actor.actorType} was burned during the conflict.`);
                }
                return { ...actor, bid: undefined };
            }
            return actor;
        }));

        // Detailed conflict logs are passed from ConflictResolutionView
        result.logs.forEach(l => addLog(`${l}`));

        // Process successful bids (grant immediate rewards for Product bets)
        if (result.successfulBids && result.successfulBids.length > 0) {
            result.successfulBids.forEach(used => {
                // If Product bet won, give +1 immediately
                if (used.bid === 'product') {
                    const actor = placedActors.find(a => a.actorId === used.actorId);
                    if (actor) {
                        const isMain = actor.playerId === localPlayerId;
                        const actorType = actor.actorType?.toLowerCase();
                        const currentLocDef = LOCATIONS.find(l => l.id === actor.locId);
                        let earnedResource = '';

                        if (actorType === 'politician') earnedResource = 'power';
                        else if (actorType === 'scientist') earnedResource = 'knowledge';
                        else if (actorType === 'artist') earnedResource = 'art';
                        else if (actorType === 'robot') earnedResource = currentLocDef?.resource || '';

                        if (earnedResource) {
                            if (isMain) {
                                updateResource(earnedResource, (resources as any)[earnedResource] + 1);
                                addLog(`${player.name || '080'}'s ${actor.actorType.toUpperCase()} secured +1 ${earnedResource.toUpperCase()} from early Product Bet!`);
                            } else {
                                setOpponentsData((prev: any) => {
                                    const oppId = actor.playerId;
                                    const oppData = prev[oppId] || { resources: { glory: 0, power: 0, knowledge: 0, art: 0, product: 0, energy: 0, recycle: 0 } };
                                    return {
                                        ...prev,
                                        [oppId]: {
                                            ...oppData,
                                            resources: {
                                                ...oppData.resources,
                                                [earnedResource]: (oppData.resources[earnedResource] || 0) + 1
                                            }
                                        }
                                    };
                                });
                                addLog(`${actor.name}'s ${actor.actorType.toUpperCase()} secured +1 ${earnedResource.toUpperCase()} from early Product Bet!`);
                            }
                        }
                    }
                }
            });
        }

        if (result.restart) {
            // Logic to restart: Log but DON'T close modal
            addLog("Conflict is restarting due to Lose Bid or Politician Draw...");
            // setActiveConflictLocId(null); // REMOVED: Keep modal open for re-roll choice
            return;
        }


        const realLocId = currentConflict?.realLocId;
        const locDef = LOCATIONS.find(l => l.id === realLocId);

        // Handle Evictions based on Conflict Outcome
        const conflictActorType = currentConflict?.playerActor.actorType;

        if (result.evictAll) {
            addLog(`Draw: All ${conflictActorType}s evicted from location.`);
            setPlacedActors(prev => prev.filter(actor => !(actor.locId === realLocId && actor.actorType === conflictActorType)));
        } else if (result.winnerId) {
            // A winner was chosen, evict all other actors of this type from the location
            setPlacedActors(prev => prev.filter(actor => {
                // Keep the actor if it's NOT part of this specific conflict group (different location or different type)
                if (actor.locId !== realLocId || actor.actorType !== conflictActorType) return true;

                // If it IS in this conflict group, only keep it if it's the winner
                // The winnerId could be the player marker 'p1' or an opponent's specific actorId
                const isWinner = (result.winnerId === localPlayerId && actor.playerId === localPlayerId) || (actor.actorId === result.winnerId);

                return isWinner;
            }));
        }

        // Mark as resolved
        setResolvedConflicts(prev => {
            const updated = [...prev, activeConflictLocId];
            return updated;
        });
        setActiveConflictLocId(null);
    };


    // --- Derived State ---
    const usedRSPs = placedActors.filter(p => p.playerId === localPlayerId).map(p => p.type);
    const availableActors = MY_ACTORS.filter(a => !placedActors.find(p => p.actorId === a.id));



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

        // DEBUG: Hand is empty at start
        setActionHand([]);
    }, []);


    // --- Handlers ---

    // Phase 1: Event Logic
    const handleEventConfirm = () => {
        let win = false;
        let msg = "";

        if (currentEvent.type === "discard") {
            const oppDiscards = dynamicPlayers
                .filter(p => (p.citizenId || p.address) !== player.citizenId)
                .map(p => {
                    const amount = Math.floor(Math.random() * 4);
                    return { name: p.name, amount };
                });

            const maxOpponentDiscard = Math.max(...oppDiscards.map(o => o.amount), 0);
            win = discardAmount > maxOpponentDiscard;
            const currentAmount = (resources as any)[currentEvent.targetResource] || 0;
            updateResource(currentEvent.targetResource, Math.max(0, currentAmount - discardAmount));

            msg = win
                ? `${player.name || '080'} discarded ${discardAmount} (Opponents: ${oppDiscards.map(o => `${o.name} discarded ${o.amount}`).join(', ')}). ${player.name || '080'} WON an Action Card!`
                : `${player.name || '080'} discarded ${discardAmount} (Opponents: ${oppDiscards.map(o => `${o.name} discarded ${o.amount}`).join(', ')}). ${player.name || '080'} lost.`;
        } else {
            const oppStats = dynamicPlayers
                .filter(p => (p.citizenId || p.address) !== player.citizenId)
                .map(p => {
                    const id = p.citizenId || p.address;
                    const amount = (opponentsData[id]?.resources as any)?.[currentEvent.targetResource] || 0;
                    return { name: p.name, amount };
                });

            const myStat = (resources as any)[currentEvent.targetResource] || 0;
            if (currentEvent.winCondition === "min") {
                const minOpponent = Math.min(...oppStats.map(o => o.amount), Infinity);
                win = myStat < minOpponent;
                msg = win
                    ? `${player.name || '080'} WON Glory! (Stats: ${player.name || '080'}: ${myStat}, ${oppStats.map(o => `${o.name}: ${o.amount}`).join(', ')})`
                    : `${player.name || '080'} lost. (Stats: ${player.name || '080'}: ${myStat}, ${oppStats.map(o => `${o.name}: ${o.amount}`).join(', ')})`;
            } else {
                const maxOpponent = Math.max(...oppStats.map(o => o.amount), -1);
                win = myStat > maxOpponent;
                msg = win
                    ? `${player.name || '080'} WON Glory! (Stats: ${player.name || '080'}: ${myStat}, ${oppStats.map(o => `${o.name}: ${o.amount}`).join(', ')})`
                    : `${player.name || '080'} lost. (Stats: ${player.name || '080'}: ${myStat}, ${oppStats.map(o => `${o.name}: ${o.amount}`).join(', ')})`;
            }
        }

        if (win && currentEvent.reward === "glory") updateResource('glory', resources.glory + 1);
        setEventResult({ msg, win });
        addLog(`Event Result: ${msg}`);
    };

    const closeEvent = () => {
        setEventResult(null);
        addLog("All players are ready");
        setPhase(2);
    };

    // Phase 2: Placement Logic
    const handleActorSelect = (id: string) => {
        if (placedActors.find(p => p.actorId === id)) return;
        setSelectedActorId(id);
        setPendingPlacement(null);
    };

    const handleCardActivate = (card: any) => {
        if (!card) return;

        // Visual Feedback
        setActivationEffect(card.title);
        setTimeout(() => setActivationEffect(null), 2000);

        // Turn Off Location Logic
        if (card.type === 'turn off location' && card.disables) {
            setDisabledLocations(prev => [...prev, card.disables]);
            addLog(`${player.name || '080'} activated ${card.title} - ${card.disables} is now DISABLED`);

            // Consume card
            const cardIndex = actionHand.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
                setActionHand(prev => {
                    const newHand = [...prev];
                    newHand.splice(cardIndex, 1);
                    return newHand;
                });
            }
        }
    };

    const handleCardAction = (cardId: string, locId: string) => {
        // ... (this might be deprecated now for Turn Off Location if we use double click on card)
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
                    addLog(`Invalid move for Robot! Must move to ${validTargets?.map(t => t.toUpperCase()).join(', ')}`);
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

            const actorSource = MY_ACTORS.find(a => a.id === actor.actorId);
            await addLog(`${player.name || '080'} teleported ${actorSource?.name || actor.actorType} with ${actor.type.toUpperCase()} to ${locId.toUpperCase()}`);
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
            const actor = MY_ACTORS.find(a => a.id === pendingPlacement.actorId);
            setPlacedActors(prev => [
                ...prev,
                {
                    actorId: pendingPlacement.actorId,
                    playerId: localPlayerId,
                    locId: pendingPlacement.locId,
                    type,
                    isOpponent: false,
                    actorType: actor?.type || 'unknown' // Add actorType for conflict matching
                }
            ]);
            setPendingPlacement(null);
            setSelectedActorId(null);


            addLog(`${player.name || '080'} placed ${actor?.name} with ${type.toUpperCase()} to ${pendingPlacement.locId.toUpperCase()}`);
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
        if (actor.playerId !== localPlayerId) return;

        console.log("Recalling actor:", actor.actorId);
        addLog(`Recalled ${actor.type} from map`);
        setPlacedActors(prev => prev.filter(p => p.actorId !== actor.actorId));

        // Reset any pending states to prevent UI ghosting
        setSelectedActorId(null);
        setPendingPlacement(null);
    };

    // Phase 3 Step 4: Exchange Logic
    const handleExchangeConfirm = (give: 'power' | 'art' | 'wisdom', take: 'power' | 'art' | 'wisdom') => {
        if (!exchangeTarget) return;

        const opponentId = exchangeTarget.id;
        const opponentName = exchangeTarget.name;

        // Functional updates for safety
        setOpponentsData(prev => {
            const next = { ...prev };
            if (!next[opponentId]) return prev;

            const oppRes = { ...next[opponentId].resources };

            // Adjust opponent resources
            const giveKey = give === 'wisdom' ? 'knowledge' : give;
            const takeKey = take === 'wisdom' ? 'knowledge' : take;

            oppRes[giveKey] = (oppRes[giveKey] || 0) + 1;
            oppRes[takeKey] = Math.max(0, (oppRes[takeKey] || 0) - 1);

            next[opponentId] = { ...next[opponentId], resources: oppRes };
            return next;
        });

        // Update player resources
        const playerGiveKey = give === 'wisdom' ? 'knowledge' : give;
        const playerTakeKey = take === 'wisdom' ? 'knowledge' : take;

        updateResource(playerGiveKey, (resources as any)[playerGiveKey] - 1);
        updateResource(playerTakeKey, (resources as any)[playerTakeKey] + 1);

        addLog(`${player.name || '080'} exchanged ${give.toUpperCase()} for ${take.toUpperCase()} with ${opponentName}`);


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

    // Local phase advancement removed and delegated to PhaseEngine
    // Phase 5 handlers
    const handleMarketOfferConfirm = (offer: MarketOffer | null) => {
        setPlayerMarketOffer(offer);

        // Generate Bot Offers and Log them
        const offers: { [id: string]: MarketOffer | null } = {};
        let foundMatch: string | null = null;
        const RESOURCE_TYPES = ['product', 'energy', 'recycle'] as const;

        const mainPlayerId = player.citizenId || player.address || 'p1';
        const opponents = dynamicPlayers.filter(p => p.id !== mainPlayerId);

        opponents.forEach(opp => {
            // 30% chance a bot doesn't trade
            if (Math.random() < 0.3) {
                offers[opp.id] = null;
                addLog(`${opp.name} skipped the Market`);
                return;
            }

            // For the MVP, if the player made an offer, there's a 40% chance ONE bot will perfectly match it
            if (offer && !foundMatch && Math.random() < 0.4) {
                offers[opp.id] = {
                    giveType: offer.takeType,
                    giveAmount: offer.takeAmount,
                    takeType: offer.giveType,
                    takeAmount: offer.giveAmount
                };
                foundMatch = opp.id;
            } else {
                // Random sensible offer (1-2 resources for 1-2 resources)
                const giveT = RESOURCE_TYPES[Math.floor(Math.random() * 3)];
                let takeT = RESOURCE_TYPES[Math.floor(Math.random() * 3)];
                while (takeT === giveT) takeT = RESOURCE_TYPES[Math.floor(Math.random() * 3)];

                offers[opp.id] = {
                    giveType: giveT,
                    giveAmount: Math.floor(Math.random() * 2) + 1,
                    takeType: takeT,
                    takeAmount: Math.floor(Math.random() * 2) + 1
                };
            }

            const botOffer = offers[opp.id];
            if (botOffer) {
                addLog(`${opp.name} offered ${botOffer.giveAmount} ${botOffer.giveType.toUpperCase()} for ${botOffer.takeAmount} ${botOffer.takeType.toUpperCase()}`);
            }
        });

        setBotMarketOffers(offers);
        setMarketMatchId(foundMatch);
        setP5Step(2);
    };

    const handleMarketRevealComplete = (tradePartnerId: string | null) => {
        if (tradePartnerId && playerMarketOffer) {
            updateResource(playerMarketOffer.giveType as any, -playerMarketOffer.giveAmount);
            updateResource(playerMarketOffer.takeType as any, playerMarketOffer.takeAmount);
            addLog(`${player.name || '080'} successfully traded with ${dynamicPlayers.find(p => p.id === tradePartnerId)?.name}!`);
        } else {
            addLog(`${player.name || '080'} continued without a trade`);
        }
        addLog("All players are ready");
        setP5Step(3);
    };


    const handleBuyActionCard = (card: any) => {
        updateResource('product', -1);
        updateResource('energy', -1);
        updateResource('recycle', -1);

        const mappedCard = {
            ...card,
            id: `card_${Date.now()}_${Math.random()}`, // Truly unique ID
            instanceId: `${card.id}_${Date.now()}`
        };
        setActionHand(prev => [...prev, mappedCard]);
        addLog(`${player.name || '080'} purchased action card: ${card.title}`);
        addLog("All players are ready");
        handleNextPhaseWrapper();
    };


    const handleSkipBuyActionCard = () => {
        addLog(`${player.name || '080'} skipped buying action card`);
        addLog("All players are ready");
        handleNextPhaseWrapper();
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
                    players={dynamicPlayers}
                    localPlayerId={localPlayerId}
                    availableTeleportCards={teleportCardsCount}
                    availableExchangeCards={exchangeCardsCount}
                    onHexClick={handleHexClick}
                    onPlayerClick={(actor, e) => {
                        console.log("onPlayerClick triggered for actor:", actor);
                        if (phase === 2) handleActorRecall(actor);
                        if (phase === 3 && p3Step === 1 && actor.playerId === localPlayerId) {
                            // Toggle menu
                            setBiddingActorId(prev => prev === actor.actorId ? null : actor.actorId);
                        }
                        if (phase === 3 && p3Step === 3 && actor.playerId === localPlayerId) {
                            // Start Teleport if cards available
                            if (teleportCardsCount > 0) {
                                setTeleportSource(prev => prev === actor.actorId ? null : actor.actorId);
                                if (teleportSource !== actor.actorId) {
                                    const actorSource = MY_ACTORS.find(a => a.id === actor.actorId);
                                    addLog(`Selected ${actorSource?.name || actor.actorType} with ${actor.type.toUpperCase()} for teleport... choose a destination.`);
                                }
                            } else {
                                addLog("No Relocation cards available.");
                            }
                        }

                        // NEW: Exchange interaction on map markers
                        if (phase === 3 && p3Step === 4 && actor.playerId !== localPlayerId) {
                            console.log("Exchange condition met, exchangeCardsCount:", exchangeCardsCount);
                            if (exchangeCardsCount > 0) {
                                const targetPlayer = dynamicPlayers.find(p => p.id === actor.playerId);
                                console.log("Target player found:", targetPlayer);
                                setExchangeTarget({
                                    id: actor.playerId,
                                    name: targetPlayer?.name || 'Opponent',
                                    avatar: targetPlayer?.avatar || '/avatars/golden_avatar.png'
                                });
                                console.log("setExchangeTarget called with id:", actor.playerId);
                            } else {
                                addLog("No Change of Values cards available.");
                            }
                        }
                    }}
                />

                {/* 2. UI Overlay Layer (Z-Indexed) */}
                <div className="absolute inset-0 z-[200] pointer-events-none">
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
                                        phase === 4 ? "CONFLICTS REVEAL" : "MARKET & CARDS"
                        }
                    />

                    {/* Phase 4: Conflicts Sidebar */}
                    {phase === 4 && (
                        <ConflictsSidebar
                            conflicts={stickyConflicts.filter(c => c.hasPlayer)}
                            resolvedIds={resolvedConflicts}
                            activeConflictLocId={activeConflictLocId}
                            onSelectConflict={setActiveConflictLocId}
                        />

                    )}

                    {/* Phase 4: Conflict Resolution Modal */}
                    {phase === 4 && activeConflictLocId && currentConflict && (
                        <div className="absolute inset-0 z-0 pointer-events-auto">
                            <ConflictResolutionView
                                conflict={currentConflict}
                                onResolve={handleConflictResolve}
                                onClose={() => setActiveConflictLocId(null)}
                                hasNextConflict={stickyConflicts.filter(c => c.hasPlayer && !resolvedConflicts.includes(c.locId)).length > 1}
                            />
                        </div>
                    )}


                    {/* Top Center: Resources (Layered ABOVE Header) */}
                    <GameResources resources={resources} vp={vp} />

                    {/* Top Left: New Players Panel (SVG) */}
                    <NewPlayersPanel
                        players={dynamicPlayers}
                        p3Step={p3Step}
                        availableExchangeCards={exchangeCardsCount}
                        onExchangeClick={(id, name) => {
                            const target = dynamicPlayers.find(p => p.id === id);
                            setExchangeTarget({ id, name, avatar: target?.avatar || '/avatars/golden_avatar.png' });
                        }}
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
                                onActivate={handleCardActivate}
                                activeCardId={activeCardId}
                                emptyMessage="NO ACTION CARDS"
                                compact={p3Step >= 3}
                            />
                        )}

                        {/* Activation Feedback Overlay */}
                        {activationEffect && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] pointer-events-none animate-in fade-in zoom-in duration-300">
                                <div className="px-12 py-6 bg-[#d4af37] text-black rounded-full shadow-[0_0_50px_rgba(212,175,55,0.6)] border-4 border-white/20">
                                    <div className="text-center">
                                        <span className="block text-[10px] uppercase font-black tracking-[0.4em] opacity-60 mb-1">Action Card</span>
                                        <span className="text-3xl font-bold uppercase font-rajdhani tracking-wider">ACTIVATED</span>
                                        <span className="block text-sm font-bold mt-1 opacity-80">{activationEffect}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Bottom Right: Next Phase Button */}
                    <div className="absolute bottom-10 right-10 z-[300] pointer-events-auto">
                        {/* Only show Next Phase if not in Phase 2 OR if all actors distributed. And in Phase 4, only if all player conflicts are resolved. */}
                        {phase !== 5 && ((phase !== 2 || availableActors.length === 0) && (phase !== 4 || stickyConflicts.filter(c => c.hasPlayer && !resolvedConflicts.includes(c.locId)).length === 0)) && (
                            <button
                                onClick={(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? undefined : commitTurn}
                                disabled={isWaitingForPlayers || (game?.isTest && !opponentsReady)}
                                className={`px-8 py-3 font-bold rounded-lg uppercase tracking-widest text-xs transition-all ${(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500' : 'bg-[#d4af37] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#ffe066] transform hover:scale-105 active:scale-95'}`}
                            >
                                {(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? "WAITING FOR OTHERS..." :
                                    phase === 3 ? (
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
                                        { type: 'product', label: 'bet on win', icon: '/resources/resource_product.png', color: 'bg-red-500/10' },
                                        { type: 'energy', label: 'bet on lose', icon: '/resources/resource_energy.png', color: 'bg-blue-500/10' },
                                        { type: 'recycle', label: 'bet on draw', icon: '/resources/resource_Recycle.png', color: 'bg-green-500/10' }
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
                        <div className="fixed inset-0 z-[1000] pointer-events-auto overflow-hidden">
                            <ExchangeModal
                                isOpen={true}
                                onClose={() => setExchangeTarget(null)}
                                onConfirm={handleExchangeConfirm}
                                targetName={exchangeTarget.name}
                                targetAvatar={exchangeTarget.avatar}
                                playerName={player.name || '080'}
                                playerAvatar={player.avatar || '/avatars/golden_avatar.png'}
                                playerResources={resources}
                                opponentResources={opponentsData[exchangeTarget.id]?.resources || {}}
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

                    {/* --- Phase 5: Modals --- */}
                    {phase === 5 && p5Step === 1 && (
                        <MarketOfferModal
                            isOpen={true}
                            playerResources={{
                                product: resources.product,
                                energy: resources.energy,
                                recycle: resources.recycle
                            }}
                            onConfirm={handleMarketOfferConfirm}
                        />
                    )}

                    {phase === 5 && p5Step === 2 && (
                        <MarketRevealModal
                            isOpen={true}
                            playerOffer={playerMarketOffer}
                            opponents={dynamicPlayers
                                .filter(p => p.id !== (player.citizenId || player.address || 'p1'))
                                .map(p => ({
                                    ...p,
                                    name: p.name || PLAYERS.find(bp => bp.id === p.id)?.name || 'Unknown',
                                    avatar: p.avatar || PLAYERS.find(bp => bp.id === p.id)?.avatar || '/avatars/golden_avatar.png'
                                }))
                            }
                            botOffers={botMarketOffers}
                            matchId={marketMatchId}
                            onComplete={handleMarketRevealComplete}
                        />
                    )}

                    {phase === 5 && p5Step === 3 && (
                        <BuyActionCardModal
                            isOpen={true}
                            onClose={handleSkipBuyActionCard}
                            onBuy={handleBuyActionCard}
                            canAfford={resources.product >= 1 && resources.energy >= 1 && resources.recycle >= 1}
                            availableCards={ACTION_CARDS}
                        />
                    )}

                    {/* --- Game Over Overlay --- */}
                    {isGameOver && (() => {
                        // 1. Calculate final VPs for everyone
                        const playersWithVP = dynamicPlayers.map((p) => {
                            const isMain = p.id === localPlayerId;
                            const res = isMain ? resources : (opponentsData[p.id]?.resources || {});
                            const { power = 0, knowledge = 0, art = 0, glory = 0 } = res as any;

                            let currP = power, currK = knowledge, currA = art, currG = glory;
                            while (currG > 0) {
                                if (currP <= currK && currP <= currA) currP++;
                                else if (currK <= currP && currK <= currA) currK++;
                                else currA++;
                                currG--;
                            }
                            const finalVP = Math.min(currP, currK, currA);
                            return { ...p, finalVP, isMain };
                        });

                        // 2. Find Max VP
                        const maxVP = Math.max(...playersWithVP.map(p => p.finalVP));

                        // 3. Check if local player won
                        const localPlayerResults = playersWithVP.find(p => p.isMain);
                        const playerWon = localPlayerResults && localPlayerResults.finalVP === maxVP;

                        return (
                            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-1000">
                                <div className="flex flex-col items-center gap-10 p-16 border-[3px] border-[#d4af37]/50 bg-gradient-to-b from-[#1a1a24] to-[#0d0d12] rounded-[3rem] shadow-[0_0_150px_rgba(212,175,55,0.2)]">
                                    <div className="text-center relative">
                                        <h1 className={`text-8xl font-black uppercase tracking-[0.2em] animate-in slide-in-from-bottom-5 duration-700 ${playerWon ? 'text-[#d4af37] drop-shadow-[0_0_40px_rgba(212,175,55,0.8)]' : 'text-red-500 drop-shadow-[0_0_40px_rgba(255,0,0,0.8)]'}`}>
                                            {playerWon ? 'VICTORY' : 'DEFEAT'}
                                        </h1>
                                        <p className="text-white/50 text-xl font-rajdhani uppercase tracking-[0.4em] mt-4">Simulation Concluded</p>
                                    </div>

                                    <div className="flex gap-16 mt-8">
                                        {playersWithVP.sort((a, b) => b.finalVP - a.finalVP).map((p, idx) => {
                                            const isWinner = p.finalVP === maxVP;
                                            return (
                                                <div key={p.id} className={`relative flex flex-col items-center gap-6 p-8 rounded-3xl border-2 transition-all duration-700 animate-in zoom-in-95 delay-${idx * 200} ${isWinner ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_50px_rgba(212,175,55,0.5)] scale-110 z-10' : 'border-white/10 bg-black/40 opacity-70 scale-95'}`}>

                                                    {/* Laurels / Crown for Winner */}
                                                    {isWinner && (
                                                        <div className="absolute -top-10 text-[#d4af37] animate-bounce drop-shadow-[0_0_20px_rgba(212,175,55,1)]">
                                                            <Crown size={64} strokeWidth={2.5} />
                                                        </div>
                                                    )}

                                                    <div className={`relative w-28 h-28 rounded-full border-4 p-1 ${isWinner ? 'border-[#d4af37]' : 'border-white/20'}`}>
                                                        <Image src={p.avatar} fill className="object-cover rounded-full" alt={p.name} />
                                                    </div>

                                                    <div className="text-center">
                                                        <p className="font-bold font-rajdhani text-white/80 uppercase tracking-widest text-lg">{p.name}</p>
                                                        <p className={`text-5xl font-black mt-2 ${isWinner ? 'text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]' : 'text-white/60'}`}>{p.finalVP} <span className="text-2xl opacity-50">VP</span></p>
                                                    </div>

                                                    {p.isMain && (
                                                        <div className="absolute -bottom-4 bg-black px-4 py-1 rounded-full border border-white/20 text-xs text-white/60 tracking-widest uppercase">
                                                            You
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => window.location.href = '/dashboard'}
                                        className="mt-12 px-16 py-5 bg-gradient-to-r from-[#d4af37] to-[#f3bd48] text-black font-black text-xl uppercase tracking-[0.4em] rounded-2xl hover:from-[#ffe066] hover:to-[#ffd700] shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        Return to Lobby
                                    </button>
                                </div>
                            </div>
                        );
                    })()}


                </div >
            </main >
        </TooltipProvider >
    );
}
