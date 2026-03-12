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
import BidRadialMenu from "@/components/game/BidRadialMenu";
import { ConflictResult, EventCardDefinition } from "@/lib/modules/core/types";
import MarketOfferModal, { MarketOffer } from '@/components/game/MarketOfferModal';
import MarketRevealModal from '@/components/game/MarketRevealModal';
import BuyActionCardModal from '@/components/game/BuyActionCardModal';
import { formatLog } from '@/lib/logUtils';
import { triggerBotPhase3Actions, triggerOpponentPlacements } from '@/lib/game/BotAI';
import { handleNextPhase } from '@/lib/game/PhaseEngine';
import { getActorRewardType, calculateReward } from '@/lib/modules/resources/resourceManager';

// Constants
import { EVENTS, LOCATIONS, ACTION_CARDS, getConflicts, ALLOWED_MOVES } from '@/data/gameConstants';
import { RSP_ICONS } from '@/data/assetManifest';

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
    { actorId: "v1", playerId: "p2", locId: "square", type: "rock", isOpponent: true, name: "Politician", actorType: "politician", avatar: "/actors/Polotican.png", headAvatar: "/actors/Politican_head.png" },
    { actorId: "v2", playerId: "p2", locId: "factory", type: "paper", isOpponent: true, name: "Robot", actorType: "robot", avatar: "/actors/Robot.png", headAvatar: "/actors/Robot_head.png" },
    { actorId: "v3", playerId: "p2", locId: "university", type: "scissors", isOpponent: true, name: "Scientist", actorType: "scientist", avatar: "/actors/Scientist.png", headAvatar: "/actors/Scientist_head.png" },
    { actorId: "v4", playerId: "p2", locId: "theatre", type: "rock", isOpponent: true, name: "Artist", actorType: "artist", avatar: "/actors/Artist.png", headAvatar: "/actors/Artist_head.png" },
    // Ghost (p3)
    { actorId: "g1", playerId: "p3", locId: "university", type: "scissors", isOpponent: true, name: "Politician", actorType: "politician", avatar: "/actors/Polotican.png", headAvatar: "/actors/Politican_head.png" },
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
    // --- Helper: Draw Action Card ---
    const drawActionCard = () => {
        let deck = game?.gameState?.actionDeck || [];
        if (deck.length === 0) {
            deck = [...ACTION_CARDS].map(c => c.id).sort(() => Math.random() - 0.5);
            addLog("Action Deck empty - reshuffled.");
        }
        const cardId = deck.pop();
        const card = ACTION_CARDS.find(c => c.id === cardId) || ACTION_CARDS[0];

        if (game) {
             const nextGameState = { ...game.gameState, actionDeck: deck };
             // Update locally to prevent double drawing before fetch returns
             setGame((prev: any) => prev ? { ...prev, gameState: nextGameState } : prev);
             fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    updates: { gameState: nextGameState }
                })
            }).catch(e => console.error("Failed syncing Action Deck", e));
        }
        return card;
    };

    // --- State Management ---    // Context / Local states
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

    // Initial value is a placeholder; actual event is set by useEffect when phase === 1
    const [currentEvent, setCurrentEvent] = useState<EventCardDefinition | null>(null);
    const [discardAmount, setDiscardAmount] = useState(0);
    const [eventResult, setEventResult] = useState<{ msg: string, win: boolean } | null>(null);
    const [eventTieBreakerActive, setEventTieBreakerActive] = useState<{ conflict: any } | null>(null);



    // Initialize opponents data dynamically (Memoize with guard)
    useEffect(() => {
        const isTest = game?.isTest;
        const mainId = player.citizenId || player.address || 'p1';

        const initialOpponents: Record<string, OpponentData> = {};
        if (game && game.players) {
            game.players.forEach((p: any) => {
                const pid = p.citizenId || p.address;
                if (pid !== mainId) {
                    initialOpponents[pid] = {
                        id: pid,
                        resources: { gato: 1000, product: 1, electricity: 1, recycling: 1, power: 0, art: 0, knowledge: 0, fame: 0, victoryPoints: 0 },
                        cards: isTest ? ACTION_CARDS.reduce((acc: any, c) => ({ ...acc, [c.id]: 2 }), {}) : {}
                    };
                }
            });
        } else {
            PLAYERS.forEach(opp => {
                initialOpponents[opp.id] = {
                    id: opp.id,
                    resources: { gato: 1000, product: 1, electricity: 1, recycling: 1, power: 0, art: 0, knowledge: 0, fame: 0, victoryPoints: 0 },
                    cards: isTest ? ACTION_CARDS.reduce((acc: any, c) => ({ ...acc, [c.id]: 2 }), {}) : {}
                };
            });
        }

        // Only update if actually different (deep check or simple length check for optimization)
        setOpponentsData(prev => {
            if (Object.keys(prev).length === Object.keys(initialOpponents).length) return prev;
            return initialOpponents;
        });
    }, [game?.id, player.citizenId, player.address]); // Use stable IDs as dependencies

    const stopPollingRef = useRef(false);

    // Fetch Specific Game Data
    useEffect(() => {
        if (!id) return;
        console.log("Setting up game fetch interval for id:", id);
        stopPollingRef.current = false;

        const fetchGame = async () => {
            if (stopPollingRef.current) return;
            try {
                const res = await fetch(`/api/games/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGame((prev: any) => {
                        if (prev === '404') return prev;
                        // Optimization: Only update if the phaseTicker or important state changed
                        if (prev && prev.gameState?.phaseTicker === data.gameState?.phaseTicker && prev.players?.length === data.players?.length) {
                            return prev;
                        }
                        return data;
                    });
                } else if (res.status === 404) {
                    console.warn("Polling: Game NOT FOUND (404)");
                    stopPollingRef.current = true;
                    setGame('404');
                }
            } catch (e) {
                console.error("Fetch game error", e);
            }
        };

        fetchGame();
        const interval = setInterval(() => {
            if (!stopPollingRef.current) {
                fetchGame();
            }
        }, 3000);

        return () => {
            stopPollingRef.current = true;
            clearInterval(interval);
        };
    }, [id]); // Only depend on id to prevent interval thrashing

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
                        type: playerActorRaw.type || 'rock', // this is the rock/paper/scissors token
                        actorType: playerActorRaw.actorType || playerActorSource?.type || 'unknown'
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
                        resourceType: locDef?.resource || 'fame',
                        isPeaceful: opponentsRaw.length === 0,
                        hasPlayer: actorsOfType.some(a => a.playerId === localPlayerId)
                    });
                });
            }

        });
        return conflicts;
    }, [phase, placedActors, disabledLocations, resolvedConflicts, dynamicPlayers, localPlayerId]);

    const [stickyConflicts, setStickyConflicts] = useState<any[]>([]);

    // Logic to lock in conflicts when Phase 4 starts (with Guard)
    useEffect(() => {
        if (phase === 4 && activeConflicts.length > 0 && stickyConflicts.length === 0) {
            setStickyConflicts(activeConflicts);
        } else if (phase !== 4 && stickyConflicts.length > 0) {
            setStickyConflicts([]);
        }
    }, [phase, activeConflicts, stickyConflicts.length]);

    // Auto-proceed test games if player has committed but was waiting on opponents
    useEffect(() => {
        if (game?.isTest && isWaitingForPlayers && opponentsReady && phase !== 4) {
            setIsWaitingForPlayers(false);
            handleNextPhaseWrapper();
            addLog("All players are ready");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWaitingForPlayers, opponentsReady, game?.isTest]);

    const commitTurn = async () => {
        const myId = player.citizenId || player.address || 'p1';
        if (!game || !myId) return;

        // Immediately set waiting state so UI button changes to "WAITING FOR OTHERS..."
        setIsWaitingForPlayers(true);

        // If this is a Test Game against bots, we bypass the multiplayer lock entirely
        if (game.isTest) {
            if (!opponentsReady && phase !== 4) {
                addLog("Wait for others to be ready...");
                return;
            }
            // Add a small delay so user sees "WAITING FOR OTHERS..." as feedback
            await new Promise(r => setTimeout(r, 1000));
            setIsWaitingForPlayers(false);
            handleNextPhaseWrapper();
            addLog("All players are ready");
            return;
        }
        try {
            const mainPlayerId = myId;
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
            // Give rewards to PEACEFUL (uncontested) actors — those that won without a conflict.
            // Conflict WINNERS are awarded inside handleConflictResolve directly.
            const localPlayerId = player.citizenId || player.address || 'p1';
            placedActors.forEach(actor => {
                if (actor.playerId !== localPlayerId) return; // Not my actor
                if (disabledLocations.includes(actor.locId)) return; // Disabled location

                // Only give reward if this actor was NOT part of any active conflict
                // (conflict actors already got their reward from handleConflictResolve)
                const wasInConflict = activeConflicts.some(c =>
                    c.playerActor?.actorId === actor.actorId ||
                    c.opponents?.some((o: any) => o.actorId === actor.actorId)
                );
                if (wasInConflict) return;
                if (actor) {
                    const actorType = actor.actorType?.toLowerCase();
                    const earnedResource = getActorRewardType(actorType, actor.locId);

                    if (earnedResource) {
                        const isDouble = actor.bid === 'product';
                        const finalReward = calculateReward(actorType as any, true, isDouble, [], '');
                        updateResource(earnedResource, finalReward);
                        addLog(`${player.name || '080'} secured ${finalReward} ${earnedResource.toUpperCase()} (uncontested ${actorType} at ${LOCATIONS.find(l => l.id === actor.locId)?.name})!`);
                    }
                }
            });
        }

        // --- Execute Relocations Before Advancing ---
        if (phase === 3 && p3Step === 2 && pendingRelocations.length > 0) {
            addLog(`Resolving ${pendingRelocations.length} pending relocations...`);
            resolveActionRelocations();
            return; // Exit early; resolveActionRelocations will call handleNextPhaseWrapper again when done
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
                    setOpponentsReady, setPendingRelocations, botActionCommitsRef.current
                );
            } finally {
                isStepActionRef.current = false;
            }
        };

        // SIMULTANEOUS COMMITS: Before leaving Step 0, lock bot actions alongside the player.
        // Bots start with 0 action cards, so they can NEVER play Block Location (step 1).
        // Only Relocation (step 2) and Exchange (step 3) can be committed if bots had cards in future turns.
        if (phase === 3 && p3Step === 0) {
            const mainPlayerId = player.citizenId || player.address || 'p1';
            const opponents = dynamicPlayers.filter(p => p.id !== mainPlayerId);
            const commits: Record<string, number[]> = {};
            opponents.forEach(opp => {
                commits[opp.id] = [];
                // Bots never block locations (no action cards on turn 1; future turns need card tracking)
                // if (Math.random() < 0.3) commits[opp.id].push(1); // DISABLED: no cards
                if (Math.random() < 0.5) commits[opp.id].push(2); // 50% chance Relocate
                if (Math.random() < 0.6) commits[opp.id].push(3); // 60% chance Change Values
            });
            botActionCommitsRef.current = commits;
        }


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

            // Sync game completion state to backend
            try {
                fetch(`/api/games/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update', updates: { status: 'finished' } })
                });
            } catch (e) {
                console.error("Failed to sync game over state", e);
            }

            return; // CRITICAL: Exit early to prevent phase advancement when game is over
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





    const addLog = async (msg: string) => {
        if (!id || !game || game === '404') return;

        // Optimistically update local state with a functional update to avoid stale closures
        const formattedMsg = formatLog(game.displayId || game.id || id as string, msg);
        setGame((prev: any) => {
            if (prev === '404') return prev;
            return {
                ...prev,
                logs: [...(prev?.logs || []), formattedMsg]
            };
        });

        try {
            const res = await fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add-log', message: msg })
            });

            if (res.status === 404) {
                console.warn("Game not found on server during log sync.");
                setGame('404');
                setIsGameOver(true);
                return;
            }

        } catch (e) {
            console.error("Failed to sync log", e);
        }
    };

    console.log("GameBoardPage Rendering, Phase:", phase, "Turn:", turn);

    const handleEventTieBreakerResolve = (result: any) => {
        if (result.restart) return; // Modal handles rerolls internally

        // Safety check: currentEvent should always be set at this point, but guard against null
        if (!currentEvent) {
            console.error("handleEventTieBreakerResolve called without currentEvent set");
            setEventTieBreakerActive(null);
            closeEvent();
            return;
        }

        if (result.winnerId === localPlayerId) {
            if (currentEvent.reward === 'action_card') {
                const drawnCard = drawActionCard();
                setActionHand(prev => [...prev, drawnCard]);
                addLog(`${player.name || '080'} WON the Tie-Breaker Conflict and earned the Action Card: ${drawnCard.title}!`);
            } else {
                updateResource(currentEvent.reward || 'fame', 1);
                addLog(`${player.name || '080'} WON the Tie-Breaker Conflict and earned ${currentEvent.reward || 'Fame'}!`);
            }
        } else if (result.winnerId) {
            const winnerName = dynamicPlayers.find(p => p.id === result.winnerId)?.name || 'Opponent';
            setOpponentsData((prev: any) => {
                const next = { ...prev };
                if (!next[result.winnerId]) return prev;
                const oppRes = { ...next[result.winnerId].resources };
                const key = currentEvent.reward || 'fame';
                oppRes[key] = (oppRes[key] || 0) + 1;
                next[result.winnerId] = { ...next[result.winnerId], resources: oppRes };
                return next;
            });
            addLog(`${winnerName} WON the Tie-Breaker Conflict and received ${currentEvent.reward === 'action_card' ? 'an Action Card' : 'Fame'}.`);
        } else if (result.isDraw && result.evictAll) {
            addLog(`Tie-Breaker ended in a complete DISMISSAL. No one receives the reward.`);
        }

        setEventTieBreakerActive(null);
        closeEvent(); // Proceed to next phase
    };

    // Phase 2: Distribution / Placement
    const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
    const [hoveredActorId, setHoveredActorId] = useState<string | null>(null);
    const [selectedHex, setSelectedHex] = useState<string | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);
    const [pendingPlacement, setPendingPlacement] = useState<{ actorId: string, locId: string } | null>(null);
    const [pendingRsp, setPendingRsp] = useState<string | null>(null);

    // Phase 3: Action Phase
    const [selectedActionCards, setSelectedActionCards] = useState<Record<string, number>>({});
    const [activatedCards, setActivatedCards] = useState<string[]>([]);
    const [exchangeTarget, setExchangeTarget] = useState<{ id: string, name: string, avatar: string } | null>(null);
    const [relocationSource, setRelocationSource] = useState<string | null>(null);
    const [pendingRelocations, setPendingRelocations] = useState<{ playerId: string, actorId: string, targetLocId: string }[]>([]);

    interface PlayerConflictContextType {
        actorId: string;
        moves: { playerId: string, targetLocId: string, choice?: string }[];
    }
    const [playerConflictContext, setPlayerConflictContext] = useState<PlayerConflictContextType | null>(null);

    const [biddingActorId, setBiddingActorId] = useState<string | null>(null);
    const botActionCommitsRef = useRef<Record<string, number[]>>({});
    const [p3Step, setP3Step] = useState<0 | 1 | 2 | 3>(0); // 0: Select, 1: Stop, 2: Relocate, 3: Exchange
    const [p5Step, setP5Step] = useState<1 | 2 | 3>(1); // 1: Market Offer, 2: Market Reveal, 3: Buy Cards
    const [playerMarketOffer, setPlayerMarketOffer] = useState<MarketOffer | null>(null);
    const [botMarketOffers, setBotMarketOffers] = useState<{ [id: string]: MarketOffer | null }>({});
    const [marketMatchId, setMarketMatchId] = useState<string | null>(null);
    const [actionHand, setActionHand] = useState<any[]>([]);
    const [activationEffect, setActivationEffect] = useState<string | null>(null);

    const filteredActionHand = useMemo(() => {
        if (p3Step === 0) return actionHand; // Show all to select
        if (p3Step === 1) return actionHand.filter(c => c.type === 'turn off location');
        if (p3Step === 2) return actionHand.filter(c => c.id.includes('relocation'));
        if (p3Step === 3) return actionHand.filter(c => c.id.includes('change_values') || c.id.includes('exchange'));
        return [];
    }, [p3Step, actionHand]);

    // Count available relocation cards from queued selection
    const relocationCardsCount = useMemo(() => {
        let count = 0;
        Object.entries(selectedActionCards).forEach(([id, qty]) => {
            if (id.includes('relocation')) count += qty;
        });
        return count;
    }, [selectedActionCards]);

    // Count available exchange cards from queued selection
    const exchangeCardsCount = useMemo(() => {
        let count = 0;
        Object.entries(selectedActionCards).forEach(([id, qty]) => {
            if (id.includes('change_values') || id.includes('exchange')) count += qty;
        });
        return count;
    }, [selectedActionCards]);


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
        // This applies even on restart (Draw) — bets are ONE-TIME only per the rules.
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

        // Also clear bets from the stickyConflicts snapshot so the ConflictResolutionView
        // does NOT display the bid icon after it has been burned (important on Draw restart).
        setStickyConflicts(prev => prev.map(conflict => ({
            ...conflict,
            playerActor: involvedActorIds.includes(conflict.playerActor?.actorId)
                ? { ...conflict.playerActor, bid: undefined }
                : conflict.playerActor,
            opponents: conflict.opponents.map((o: any) =>
                involvedActorIds.includes(o.actorId) ? { ...o, bid: undefined } : o
            )
        })));

        // Detailed conflict logs are passed from ConflictResolutionView
        result.logs.forEach(l => addLog(`${l}`));

        // Process successful bids (grant immediate rewards for Product bets)
        if (result.successfulBids && result.successfulBids.length > 0) {
            result.successfulBids.forEach(used => {
                // If Product bet won, give +1 immediately
                if (used.bid === 'product') {
                    const actor = placedActors.find(a => a.actorId === used.actorId);
                    if (actor) {
                        const actorType = actor.actorType?.toLowerCase();
                        const earnedResource = getActorRewardType(actorType, actor.locId);

                        if (earnedResource) {
                            if (actor.playerId === localPlayerId) {
                                updateResource(earnedResource, 1); // delta +1
                                addLog(`${player.name || '080'}'s ${actor.actorType?.toUpperCase()} secured +1 ${earnedResource.toUpperCase()} from early Product Bet!`);
                            } else {
                                setOpponentsData((prev: any) => {
                                    const oppId = actor.playerId;
                                    const oppData = prev[oppId] || { resources: { fame: 0, power: 0, knowledge: 0, art: 0, product: 0, electricity: 0, recycling: 0 } };
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
                                addLog(`${actor.name}'s ${actor.actorType?.toUpperCase()} secured +1 ${earnedResource.toUpperCase()} from early Product Bet!`);
                            }
                        }
                    }
                }
            });
        }

        if (result.restart) {
            // Conflict restarts (Politician Draw). Bets are already burned above.
            // Keep modal open for re-roll — do NOT close it.
            addLog("Conflict is restarting — bets discarded, select a new Argument.");
            return;
        }


        const realLocId = currentConflict?.realLocId;
        const locDef = LOCATIONS.find(l => l.id === realLocId);

        // Handle Evictions based on Conflict Outcome
        const conflictActorType = currentConflict?.playerActor.actorType;

        if (result.evictAll) {
            addLog(`Draw: All ${conflictActorType}s evicted from location.`);
            setPlacedActors(prev => prev.filter(actor => !(actor.locId === realLocId && actor.actorType === conflictActorType)));
        } else if (result.loserIds && result.loserIds.length > 0) {
            // Losers Exit: Remove specific actors that were beaten in this iteration
            setPlacedActors(prev => prev.filter(actor => !result.loserIds.includes(actor.actorId)));
            result.loserIds.forEach(lId => {
                const lActor = [...placedActors, ...stickyConflicts.flatMap(c => [c.playerActor, ...c.opponents])].find(a => a?.actorId === lId);
                if (lActor) addLog(`${lActor.name}'s ${lActor.actorType?.toUpperCase()} lost the argument and exited.`);
            });
        }

        if (result.winnerId) {
            // A final winner was found
            // Evict all other actors of this type from the location (clean up survivors who weren't the winner)
            setPlacedActors(prev => prev.filter(actor => {
                if (actor.locId !== realLocId || actor.actorType !== conflictActorType) return true;
                return (result.winnerId === localPlayerId && actor.playerId === localPlayerId) || (actor.actorId === result.winnerId);
            }));

            // --- AWARD RESOURCES TO THE CONFLICT WINNER immediately ---
            if (result.winnerId === localPlayerId) {
                const winnerActor = currentConflict?.playerActor;
                if (winnerActor) {
                    const winActorType = winnerActor.actorType?.toLowerCase();
                    const earnedResource = getActorRewardType(winActorType, realLocId || '');

                    if (earnedResource) {
                        const isDouble = result.successfulBids?.some(b => b.bid === 'product' && b.actorId === result.winnerId);
                        const finalReward = calculateReward(winActorType as any, true, isDouble, [], '');

                        updateResource(earnedResource, finalReward);
                        addLog(`${player.name || '080'} WON ${finalReward} ${earnedResource.toUpperCase()} from ${winActorType?.toUpperCase()} conflict at ${locDef?.name}!`);
                    }
                }
            }
        } else if (result.shareRewards && result.isDraw) {
            // Scientist/Robot TRUCE — both players get 1 resource
            const trActor = currentConflict?.playerActor;
            if (trActor) {
                const trActorType = trActor.actorType?.toLowerCase();
                const earnedResource = getActorRewardType(trActorType, realLocId || '');

                if (earnedResource) {
                    updateResource(earnedResource, 1);
                    addLog(`${player.name || '080'} earned 1 ${earnedResource.toUpperCase()} from TRUCE at ${locDef?.name}!`);
                }
            }
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

    const victoryPoints = useMemo(() => {
        const mainPlayerId = player.citizenId || player.address || 'p1';
        const myActors = placedActors.filter(a => a.playerId === mainPlayerId);
        const playerResources = resources;
        const p = playerResources.power, k = playerResources.knowledge, a = playerResources.art, f = playerResources.fame;
        let totalFame = f;
        let powerValue = p, knowValue = k, artValue = a;
        while (totalFame > 0) {
            if (powerValue <= knowValue && powerValue <= artValue) powerValue++;
            else if (knowValue <= powerValue && knowValue <= artValue) knowValue++;
            else artValue++;
            totalFame--;
        }
        const vpValue = Math.min(powerValue, knowValue, artValue);
        return vpValue;
    }, [resources]);

    // --- Effects ---
    // Phase 1: Draw from Event Deck (No repeats until all 7 are used)
    useEffect(() => {
        // Only run when it's Phase 1, we haven't set the local event yet, and the game is loaded
        if (phase === 1 && !currentEvent && game && !isWaitingForPlayers) {
            const serverEventId = game.gameState?.currentEventId;
            const currentTurn = turn;

            if (serverEventId && game.gameState?.eventDeckTurn === currentTurn) {
                // If the server already drew an event for this specific turn, just use it
                const event = EVENTS.find(e => e.id === serverEventId);
                if (event) {
                    setCurrentEvent(event);
                    addLog(`EVENT DRAWN: ${event.title}`);
                }
            } else {
                // Only the primary host (or the local user in a bot match) draws to avoid race conditions
                const isHost = player.citizenId === dynamicPlayers[0]?.id || game.isTest;
                if (!isHost) return; 

                let serverDeck = game.gameState?.eventDeck || [];
                
                // Shuffle a new deck if empty
                if (serverDeck.length === 0) {
                    serverDeck = [...EVENTS].map(e => e.id).sort(() => Math.random() - 0.5);
                    addLog("Event Deck empty - reshuffled.");
                }
                
                const nextEventId = serverDeck.pop();
                const nextEvent = EVENTS.find(e => e.id === nextEventId);
                
                if (nextEvent) {
                    setCurrentEvent(nextEvent);
                    addLog(`EVENT DRAWN: ${nextEvent.title}`);
                    
                    // Sync the drawn event and new deck state to the backend
                    fetch(`/api/games/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'update',
                            updates: {
                                gameState: {
                                    ...game.gameState,
                                    eventDeck: serverDeck,
                                    currentEventId: nextEvent.id,
                                    eventDeckTurn: currentTurn
                                }
                            }
                        })
                    }).catch(err => console.error("Failed to sync event deck", err));
                }
            }
        }
    }, [phase, turn, currentEvent, game?.isTest]);


    // --- Handlers ---

    // Phase 1: Event Logic
    const handleEventConfirm = () => {
        let win = false;
        let msg = "";

        if (currentEvent && currentEvent.type === "discard") {
            const humanOpponents = dynamicPlayers.filter(p => p.id !== localPlayerId && !p.id.startsWith('bot') && !game?.isTest);
            if (humanOpponents.length > 0) {
                setIsWaitingForPlayers(true);
                // Expected: backend sync will resolve this instead of random bots
                addLog(`Waiting for other players to discard...`);
                return;
            }

            const oppDiscards = dynamicPlayers
                .filter(p => p.id !== localPlayerId)
                .map(p => {
                    const amount = Math.floor(Math.random() * 4);
                    return { id: p.id, name: p.name, amount };
                });

            const statValues: { id: string; name: string; amount: number }[] = [];
            statValues.push({ id: localPlayerId, name: player.name || '080', amount: discardAmount });

            oppDiscards.forEach(opp => {
                statValues.push({ id: opp.id, name: opp.name, amount: opp.amount });
            });

            const maxDiscard = Math.max(...statValues.map(s => s.amount));
            const winners = statValues.filter(s => s.amount === maxDiscard);

            // Deduct the resources that players decided to discard
            updateResource(currentEvent.targetResource!, -discardAmount);

            // Apply opponent discards graphically
            setOpponentsData((prev: any) => {
                const next = { ...prev };
                oppDiscards.forEach(opp => {
                    if (!next[opp.id]) next[opp.id] = { resources: { power: 0, art: 0, knowledge: 0, fame: 0 } };
                    const oppRes = { ...next[opp.id].resources };
                    const key = currentEvent.targetResource!;
                    oppRes[key] = Math.max(0, (oppRes[key] || 0) - opp.amount);
                    next[opp.id] = { ...next[opp.id], resources: oppRes };
                });
                return next;
            });

            const oppStatsStr = oppDiscards.map(o => `${o.name} discarded ${o.amount}`).join(', ');

            if (winners.length > 1) {
                if (winners.some(w => w.id === localPlayerId)) {
                    addLog(`TIE DETECTED for Event: ${currentEvent.title}. Initiating Conflict Resolution!`);
                    setEventTieBreakerActive({
                        conflict: {
                            locId: `event_tie_${Date.now()}`,
                            locationName: currentEvent.title,
                            playerActor: {
                                actorType: 'player',
                                actorId: localPlayerId,
                                type: '', // Trigger selection menu
                                playerId: localPlayerId,
                                avatar: player.avatar
                            },
                            opponents: winners.filter(w => w.id !== localPlayerId).map((w, idx) => ({
                                actorId: w.id,
                                playerId: w.id,
                                name: w.name,
                                actorType: 'player',
                                type: ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)],
                                playerAvatar: dynamicPlayers.find(p => p.id === w.id)?.avatar
                            })),
                            resourceType: currentEvent.reward || 'action_card'
                        }
                    });
                    return; // Wait for the modal to resolve
                } else {
                    const randomBotWinner = winners[Math.floor(Math.random() * winners.length)];
                    msg = `${player.name || '080'} discarded ${discardAmount} (Opponents: ${oppStatsStr}). WINNER: ${randomBotWinner.name} won the tie-breaker and receives an Action Card. ${player.name || '080'} lost.`;
                    win = false;
                }
            } else if (winners[0].id === localPlayerId) {
                win = true;
                msg = `${player.name || '080'} discarded ${discardAmount} (Opponents: ${oppStatsStr}). WINNER: ${player.name || '080'} receives an Action Card!`;
            } else {
                win = false;
                msg = `${player.name || '080'} discarded ${discardAmount} (Opponents: ${oppStatsStr}). WINNER: ${winners[0].name} receives an Action Card. ${player.name || '080'} lost.`;
            }

        } else if (currentEvent) {
            const statValues: { id: string; name: string; amount: number }[] = [];
            let statLabel = "";

            if (currentEvent.type === "compare_sum") {
                const keys = currentEvent.targetResources || [];
                statLabel = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join('+');
                const mySum = keys.reduce((acc, k) => acc + ((resources as any)[k] || 0), 0);
                statValues.push({ id: localPlayerId, name: player.name || '080', amount: mySum });
                dynamicPlayers.filter(p => p.id !== localPlayerId).forEach(p => {
                    const sum = keys.reduce((acc, k) => acc + ((opponentsData[p.id]?.resources as any)?.[k] || 0), 0);
                    statValues.push({ id: p.id, name: p.name, amount: sum });
                });
            } else {
                statLabel = currentEvent.targetResource?.toUpperCase() || "";
                const myStat = (resources as any)[currentEvent.targetResource!] || 0;
                statValues.push({ id: localPlayerId, name: player.name || '080', amount: myStat });
                dynamicPlayers.filter(p => p.id !== localPlayerId).forEach(p => {
                    const amount = (opponentsData[p.id]?.resources as any)?.[currentEvent.targetResource!] || 0;
                    statValues.push({ id: p.id, name: p.name, amount });
                });
            }

            const targetAmount = currentEvent.winCondition === "min"
                ? Math.min(...statValues.map(s => s.amount))
                : Math.max(...statValues.map(s => s.amount));

            const winners = statValues.filter(s => s.amount === targetAmount);
            const myStatAmount = statValues.find(s => s.id === localPlayerId)?.amount || 0;
            const oppStatsStr = statValues.filter(s => s.id !== localPlayerId).map(o => `${o.name}: ${o.amount}`).join(', ');

            if (winners.length > 1) {
                if (winners.some(w => w.id === localPlayerId)) {
                    addLog(`TIE DETECTED for Event: ${currentEvent.title}. Initiating Conflict Resolution!`);
                    setEventTieBreakerActive({
                        conflict: {
                            locId: `event_tie_${Date.now()}`,
                            locationName: currentEvent.title,
                            playerActor: {
                                actorType: 'player',
                                actorId: localPlayerId,
                                type: '', // Trigger selection menu
                                playerId: localPlayerId,
                                avatar: player.avatar
                            },
                            opponents: winners.filter(w => w.id !== localPlayerId).map((w, idx) => ({
                                actorId: w.id,
                                playerId: w.id,
                                name: w.name,
                                actorType: 'player',
                                type: ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)],
                                playerAvatar: dynamicPlayers.find(p => p.id === w.id)?.avatar
                            })),
                            resourceType: currentEvent.reward || 'fame'
                        }
                    });
                    return; // Wait for the modal to resolve
                } else {
                    const randomBotWinner = winners[Math.floor(Math.random() * winners.length)];
                    win = false;
                    msg = `${player.name || '080'} lost. ${randomBotWinner.name} won the tie-breaker! (Stats: Me: ${myStatAmount}, ${oppStatsStr})`;

                    setOpponentsData((prev: any) => {
                        const next = { ...prev };
                        if (!next[randomBotWinner.id]) return prev;
                        const oppRes = { ...next[randomBotWinner.id].resources };
                        const key = currentEvent.reward || 'fame';
                        oppRes[key] = (oppRes[key] || 0) + 1;
                        next[randomBotWinner.id] = { ...next[randomBotWinner.id], resources: oppRes };
                        return next;
                    });
                }
            } else if (winners[0].id === localPlayerId) {
                win = true;
                const rewardText = currentEvent.reward === 'action_card' ? 'Action Card' : 'Fame';
                msg = `${player.name || '080'} won the Event requirement! Reward: ${rewardText}`;
            } else {
                win = false;
                const winnerName = winners[0].name;
                const rewardText = currentEvent.reward === 'action_card' ? 'an Action Card' : 'Fame';
                msg = `WINNER: ${winnerName} receives ${rewardText}! (Stats: Me: ${myStatAmount}, ${oppStatsStr})`;

                const botWinnerId = winners[0].id;
                setOpponentsData((prev: any) => {
                    const next = { ...prev };
                    if (!next[botWinnerId]) return prev;
                    const oppRes = { ...next[botWinnerId].resources };
                    const key = currentEvent.reward || 'fame';
                    oppRes[key] = (oppRes[key] || 0) + 1;
                    next[botWinnerId] = { ...next[botWinnerId], resources: oppRes };
                    return next;
                });
            }
        }

        if (win && currentEvent) {
            if (currentEvent.reward === "fame") {
                updateResource('fame', 1);
            } else if (win && currentEvent?.reward === 'action_card') {
            const drawn = drawActionCard();
            setActionHand(prev => [...prev, drawn]);
            msg += ` Found action card: ${drawn.title}`;
        } else if (win && currentEvent?.reward) {
                updateResource(currentEvent.reward, 1);
            }
        }

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

    // Phase 3 Step 1: Auto-Execute Block Locations, then smart-skip to the right next step
    useEffect(() => {
        if (phase === 3 && p3Step === 1) {
            const newDisabled: string[] = [];

            // Find selected Block Location cards
            const blockCards = actionHand.filter(card =>
                card.type === 'turn off location' && selectedActionCards[card.id] > 0
            );

            if (blockCards.length > 0) {
                for (const card of blockCards) {
                    if (card.disables && !disabledLocations.includes(card.disables) && !newDisabled.includes(card.disables)) {
                        newDisabled.push(card.disables);
                        addLog(`${player.name || '080'} activated ${card.title} - ${card.disables} is now DISABLED`);
                    }
                }

                if (newDisabled.length > 0) {
                    setDisabledLocations(prev => [...prev, ...newDisabled]);
                }

                // Consume the cards from hand
                setActionHand(prev => {
                    const newHand = [...prev];
                    blockCards.forEach(card => {
                        const countToConsume = selectedActionCards[card.id] || 0;
                        for (let i = 0; i < countToConsume; i++) {
                            const idx = newHand.findIndex(c => c.id === card.id);
                            if (idx !== -1) newHand.splice(idx, 1);
                        }
                    });
                    return newHand;
                });
            }

            // Smart-skip: only show sub-steps if relevant cards were selected by ANY player
            let hasReloc = relocationCardsCount > 0;
            let hasExchange = exchangeCardsCount > 0;

            const commits = botActionCommitsRef.current || {};
            Object.values(commits).forEach(botSteps => {
                if (botSteps.includes(2)) hasReloc = true;
                if (botSteps.includes(3)) hasExchange = true;
            });

            setTimeout(() => {
                if (hasReloc) {
                    // Advance to Step 2 (Relocation) normally
                    setP3Step(2);
                    addLog('STEP: RELOCATION');
                } else if (hasExchange) {
                    // Skip Relocation, go straight to Step 3 (Change Values)
                    addLog('No Relocation cards played — skipping Relocation step.');
                    setP3Step(3);
                    addLog('STEP: CHANGE VALUES');
                } else {
                    // No Relocation or Exchange cards — exit Phase 3
                    addLog('No Relocation or Exchange cards played — advancing to Conflicts.');
                    handleNextPhaseWrapper();
                }
            }, 1000); // 1s delay for UI to register the disabled locations
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, p3Step]);



    const handleHexClick = async (locId: string) => {
        if (disabledLocations.includes(locId)) return;

        // Phase 3 Step 2: Relocation
        if (phase === 3 && p3Step === 2 && relocationSource) {
            const actor = placedActors.find(p => p.actorId === relocationSource);
            if (!actor) return;

            // Validate Move - Enforce ALLOWED_MOVES for ALL Actors
            const extractedType = actor.type || actor.actorType;
            if (extractedType) {
                const validTargets = ALLOWED_MOVES[extractedType];
                if (validTargets && !validTargets.includes(locId)) {
                    addLog(`Invalid relocation for ${extractedType}! Must move to ${validTargets.map(t => t.toUpperCase()).join(', ')}`);
                    return;
                }
            }

            if (actor.locId === locId) {
                addLog("Cannot relocate actor to its current location.");
                return;
            }

            // Execute Relocation Queue
            setPendingRelocations(prev => [...prev, { playerId: localPlayerId, actorId: relocationSource, targetLocId: locId }]);
            setRelocationSource(null);

            // Deduct from queued action cards
            setSelectedActionCards(prev => {
                const next = { ...prev };
                const relocKey = Object.keys(next).find(k => k.includes('relocation') && next[k] > 0);
                if (relocKey) next[relocKey]--;
                return next;
            });

            // Consume Card from hand visual representation
            const cardIndex = actionHand.findIndex(c => c.id.includes('relocation'));
            if (cardIndex !== -1) {
                setActionHand(prev => {
                    const newHand = [...prev];
                    newHand.splice(cardIndex, 1);
                    return newHand;
                });
            }

            addLog(`${player.name || '080'} queued relocation target.`);

            const actorSource = MY_ACTORS.find(a => a.id === actor.actorId);
            await addLog(`${player.name || '080'} relocated ${actorSource?.name || actor.actorType} with ${actor.type.toUpperCase()} to ${locId.toUpperCase()}`);
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
            setPendingRsp(type);
        }
    };

    const handleBid = (resourceType: 'product' | 'electricity' | 'recycling' | null) => {
        if (!pendingPlacement || !pendingRsp) return;

        const actor = MY_ACTORS.find(a => a.id === pendingPlacement.actorId);

        // 1. Check if new resource is available
        if (resourceType) {
            const newAmount = (resources as any)[resourceType] || 0;
            if (newAmount > 0) {
                // Deduct resource
                updateResource(resourceType, -1); // delta -1; can't go below 0 (checked above)
            } else {
                return; // Not enough resources
            }
        }

        // 2. Finalize Placement
        setPlacedActors(prev => [
            ...prev,
            {
                actorId: pendingPlacement.actorId,
                playerId: localPlayerId,
                locId: pendingPlacement.locId,
                type: pendingRsp,
                bid: resourceType || undefined,
                isOpponent: false,
                actorType: actor?.type || 'unknown'
            }
        ]);

        const betLog = resourceType ? ` and BET ON ${resourceType === 'product' ? 'WIN' : resourceType === 'electricity' ? 'LOSE' : 'DRAW'}` : '';
        addLog(`${player.name || '080'} placed ${actor?.name} with ${pendingRsp.toUpperCase()} to ${pendingPlacement.locId.toUpperCase()}${betLog}`);

        // 3. Clear transient states
        setPendingRsp(null);
        setPendingPlacement(null);
        setSelectedActorId(null);
    };

    const handleActorRecall = (actor: any) => {
        if (phase !== 2) return;
        if (actor.playerId !== localPlayerId) return;

        console.log("Recalling actor:", actor.actorId);
        addLog(`Recalled ${actor.type} from map`);

        if (actor.bid) {
            updateResource(actor.bid, 1); // refund delta +1
            addLog(`Refunded 1 ${actor.bid.toUpperCase()} for recalled bet.`);
        }

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

        updateResource(playerGiveKey, -1); // delta -1
        updateResource(playerTakeKey, 1);  // delta +1

        addLog(`${player.name || '080'} exchanged ${give.toUpperCase()} for ${take.toUpperCase()} with ${opponentName}`);


        // Deduct from queued action cards
        setSelectedActionCards(prev => {
            const next = { ...prev };
            const key = Object.keys(next).find(k => (k.includes('change_values') || k.includes('exchange')) && next[k] > 0);
            if (key) next[key] -= 1;
            return next;
        });

        // Consume Card visually from hand
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

    const resolvePlayerConflictLogic = (context: PlayerConflictContextType) => {
        const choices = context.moves.map(m => m.choice!);
        const hasRock = choices.includes('rock');
        const hasPaper = choices.includes('paper');
        const hasScissors = choices.includes('scissors');

        let winners: typeof context.moves = [];
        if (hasRock && hasPaper && hasScissors) {
            winners = context.moves;
            addLog("Relocation Conflict DRAW! Rock, Paper, and Scissors were all played. Retrying...");
        } else if (hasRock && hasPaper && !hasScissors) {
            winners = context.moves.filter(m => m.choice === 'paper');
        } else if (hasPaper && hasScissors && !hasRock) {
            winners = context.moves.filter(m => m.choice === 'scissors');
        } else if (hasScissors && hasRock && !hasPaper) {
            winners = context.moves.filter(m => m.choice === 'rock');
        } else {
            winners = context.moves; // All played same
            addLog(`Relocation Conflict DRAW! Everyone played ${choices[0]?.toUpperCase()}. Retrying...`);
        }

        if (winners.length === 1) {
            const winner = winners[0];
            const wName = dynamicPlayers.find(p => p.id === winner.playerId)?.name || 'Player';
            addLog(`Relocation Conflict Solved! ${wName} won with ${winner.choice?.toUpperCase()}!`);

            // Re-map pendingRelocations specifically dropping losers for THIS actor
            setPendingRelocations(prev => {
                const others = prev.filter(r => r.actorId !== context.actorId);
                return [...others, {
                    playerId: winner.playerId,
                    actorId: context.actorId,
                    targetLocId: winner.targetLocId
                }];
            });
            setPlayerConflictContext(null);
            setTimeout(resolveActionRelocations, 1000);
        } else {
            // Tie-break among winners
            setPendingRelocations(prev => {
                const others = prev.filter(r => r.actorId !== context.actorId);
                const tied = winners.map(w => ({
                    playerId: w.playerId,
                    actorId: context.actorId,
                    targetLocId: w.targetLocId
                }));
                return [...others, ...tied];
            });
            setPlayerConflictContext(null);
            setTimeout(resolveActionRelocations, 1000);
        }
    };

    const handlePlayerConflictSubmit = (choice: string) => {
        if (!playerConflictContext) return;
        const updatedMoves = playerConflictContext.moves.map(m => {
            if (m.playerId === localPlayerId) return { ...m, choice };
            if (!m.choice) return { ...m, choice: ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)] };
            return m;
        });
        resolvePlayerConflictLogic({ ...playerConflictContext, moves: updatedMoves });
    };

    const resolveActionRelocations = () => {
        // Group queued relocations by actorId
        const groups: Record<string, typeof pendingRelocations> = {};
        // Access latest via callback to prevent stale closures when called repeatedly
        setPendingRelocations(latestQueue => {
            latestQueue.forEach(r => {
                if (!groups[r.actorId]) groups[r.actorId] = [];
                groups[r.actorId].push(r);
            });
            return latestQueue;
        });

        // Search for FIRST conflict
        for (const [actorId, moves] of Object.entries(groups)) {
            if (moves.length > 1) {
                const isLocal = moves.some(m => m.playerId === localPlayerId);
                if (!isLocal) {
                    const hasHuman = moves.some(m => {
                        const p = dynamicPlayers.find(dp => dp.id === m.playerId);
                        return p && !p.id.startsWith('bot') && !game?.isTest;
                    });
                    if (hasHuman) {
                        setIsWaitingForPlayers(true);
                        addLog(`Waiting for players to resolve their relocation conflict...`);
                        return; // PAUSE Execution Loop here until conflict resolves via backend
                    }
                    // Auto resolve bots immediately
                    const botMoves = moves.map(m => ({ ...m, choice: ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)] }));
                    resolvePlayerConflictLogic({ actorId, moves: botMoves });
                } else {
                    // Show modal to local player
                    setPlayerConflictContext({ actorId, moves: moves.map(m => ({ ...m })) });
                }
                return; // PAUSE Execution Loop here until conflict resolves
            }
        }

        // Apply all valid moves (Since there are no remaining > 1 groups)
        const validMoves: typeof pendingRelocations = [];
        Object.entries(groups).forEach(([actorId, moves]) => {
            validMoves.push(moves[0]);
            const pName = dynamicPlayers.find(p => p.id === moves[0].playerId)?.name || 'Player';
            const actorName = placedActors.find(a => a.actorId === actorId)?.actorType || 'Actor';
            addLog(`Relocation complete: ${pName} relocated a ${actorName} to ${moves[0].targetLocId.toUpperCase()}`);
        });

        if (validMoves.length > 0) {
            setPlacedActors(prev => prev.map(a => {
                const move = validMoves.find(m => m.actorId === a.actorId);
                return move ? { ...a, locId: move.targetLocId } : a;
            }));
        }

        setPendingRelocations([]);
        handleNextPhaseWrapper();
    };

    // Local phase advancement removed and delegated to PhaseEngine
    // Phase 5 handlers
    const handleMarketOfferConfirm = (offer: MarketOffer | null) => {
        setPlayerMarketOffer(offer);

        // Generate Bot Offers and Log them
        const offers: { [id: string]: MarketOffer | null } = {};
        let foundMatch: string | null = null;
        const RESOURCE_TYPES = ['product', 'electricity', 'recycling'] as const;

        const mainPlayerId = player.citizenId || player.address || 'p1';
        const opponents = dynamicPlayers.filter(p => p.id !== mainPlayerId);

        opponents.forEach(opp => {
            const isHuman = !opp.id.startsWith('bot') && !game?.isTest;
            if (isHuman) return; // Wait for backend sync for human offers

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

        const humanOpponents = opponents.filter(opp => !opp.id.startsWith('bot') && !game?.isTest);
        if (humanOpponents.length > 0) {
            setIsWaitingForPlayers(true);
            addLog(`Waiting for other players to complete their market offers...`);
            return;
        }

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
        updateResource('electricity', -1);
        updateResource('recycling', -1);

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
    if (game === '404') {
        return (
            <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans flex items-center justify-center p-10">
                <div className="flex flex-col items-center gap-10 p-16 border-[3px] border-red-500/50 bg-gradient-to-b from-[#1a1a24] to-[#0d0d12] rounded-[3rem] shadow-[0_0_150px_rgba(255,0,0,0.2)] max-w-2xl w-full">
                    <div className="text-center">
                        <h1 className="text-6xl font-black uppercase tracking-[0.2em] text-red-500 drop-shadow-[0_0_40px_rgba(255,0,0,0.8)]">
                            GAME NOT FOUND
                        </h1>
                        <p className="text-white/50 text-xl font-rajdhani uppercase tracking-[0.4em] mt-4">Simulation ID invalid or expired</p>
                    </div>
                    <p className="text-gray-400 text-center leading-relaxed font-rajdhani font-semibold px-8 mt-4">
                        We couldn't locate the game session you're looking for. This can happen if the game was deleted, or if the URL is incorrect.
                    </p>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="mt-8 px-16 py-5 bg-gradient-to-r from-red-500 to-red-700 text-white font-black text-xl uppercase tracking-[0.4em] rounded-2xl hover:from-red-400 hover:to-red-600 shadow-[0_0_40px_rgba(255,0,0,0.5)] transition-all transform hover:scale-105 active:scale-95"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </main>
        );
    }

    if (!game) {
        return (
            <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.4)]"></div>
                    <p className="text-[#d4af37] font-bold font-rajdhani tracking-[0.3em] uppercase animate-pulse">Initializing Board...</p>
                </div>
            </main>
        );
    }

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
                    relocationSource={relocationSource}
                    selectedHex={selectedHex}
                    playerActorsV2={MY_ACTORS}
                    players={dynamicPlayers}
                    localPlayerId={localPlayerId}
                    availableRelocationCards={relocationCardsCount}
                    availableExchangeCards={exchangeCardsCount}
                    onHexClick={handleHexClick}
                    onPlayerClick={(actor, e) => {
                        console.log("onPlayerClick triggered for actor:", actor);
                        if (phase === 2) handleActorRecall(actor);
                        if (phase === 3 && p3Step === 2) {
                            // Start Relocation if cards available - can relocate ANY actor (own or opponent's)
                            if (relocationCardsCount > 0) {
                                setRelocationSource(prev => prev === actor.actorId ? null : actor.actorId);
                                if (relocationSource !== actor.actorId) {
                                    const actorSource = MY_ACTORS.find(a => a.id === actor.actorId) || { name: actor.actorType, actorType: actor.actorType };
                                    const ownerName = actor.playerId === localPlayerId ? 'your' : dynamicPlayers.find(p => p.id === actor.playerId)?.name + "'s";
                                    addLog(`Selected ${ownerName} ${actorSource.name || actor.actorType} with ${actor.type.toUpperCase()} for relocation... choose a destination.`);
                                }
                            } else {
                                addLog("No Relocation cards available.");
                            }
                        }

                        // NEW: Exchange interaction on map markers
                        if (phase === 3 && p3Step === 3 && actor.playerId !== localPlayerId) {
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
                                        p3Step === 0 ? "ACTION: SELECT CARDS" :
                                            p3Step === 1 ? "ACTION: STOP LOCATIONS" :
                                                p3Step === 2 ? "ACTION: RELOCATION" :
                                                    "ACTION: CHANGE VALUES"
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

                    {/* Phase 1: Event Tie Breaker Modal */}
                    {phase === 1 && eventTieBreakerActive && (
                        <div className="absolute inset-0 z-[400] pointer-events-auto">
                            <ConflictResolutionView
                                conflict={eventTieBreakerActive.conflict}
                                onResolve={(result) => handleEventTieBreakerResolve(result)}
                                onClose={() => { setEventTieBreakerActive(null); closeEvent(); }}
                                hasNextConflict={false}
                            />
                        </div>
                    )}


                    {/* Top Center: Resources (Layered ABOVE Header) */}
                    <GameResources resources={resources} victoryPoints={victoryPoints} />

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
                        {phase === 3 && (
                            <ActionCardsPanel
                                cards={filteredActionHand}
                                selectedCounts={selectedActionCards}
                                onToggleCard={(cardId, count) => {
                                    if (p3Step > 0) return; // Prevent changing selection after lock
                                    setSelectedActionCards(prev => ({ ...prev, [cardId]: count }));
                                }}
                                emptyMessage="NO ACTION CARDS"
                                compact={p3Step >= 1}
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
                        {/* Only show Next Phase if not in Phase 2 OR if all actors distributed. And in Phase 4, only if all player conflicts are resolved. HIDE if game is over. */}
                        {isGameOver && (() => {
                            // 1. Calculate final VPs for everyone
                            const playersWithVP = dynamicPlayers.map((p) => {
                                const isMain = p.id === localPlayerId;
                                const res = isMain ? resources : (opponentsData[p.id]?.resources || {});
                                const { power = 0, knowledge = 0, art = 0, fame = 0 } = res as any;

                                let currP = power, currK = knowledge, currA = art, currF = fame;
                                while (currF > 0) {
                                    if (currP <= currK && currP <= currA) currP++;
                                    else if (currK <= currP && currK <= currA) currK++;
                                    else currA++;
                                    currF--;
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
                                <div className="absolute inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-1000">
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

                                                        {isWinner && (
                                                            <div className="absolute -top-10 text-[#d4af37] animate-bounce drop-shadow-[0_0_20px_rgba(212,175,55,1)]">
                                                                <Crown size={64} strokeWidth={2.5} />
                                                            </div>
                                                        )}

                                                        <div className={`relative w-28 h-28 rounded-full border-4 p-1 ${isWinner ? 'border-[#d4af37]' : 'border-white/20'}`}>
                                                            <Image src={p.avatar || '/avatars/golden_avatar.png'} fill className="object-cover rounded-full" alt={p.name} />
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
                        {!isGameOver && phase !== 5 && ((phase !== 2 || availableActors.length === 0) && (phase !== 4 || stickyConflicts.filter(c => c.hasPlayer && !resolvedConflicts.includes(c.locId)).length === 0)) && (
                            <button
                                onClick={(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? undefined : commitTurn}
                                disabled={isWaitingForPlayers || (game?.isTest && !opponentsReady)}
                                className={`px-8 py-3 font-bold rounded-lg uppercase tracking-widest text-xs transition-all ${(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500' : 'bg-[#d4af37] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#ffe066] transform hover:scale-105 active:scale-95'}`}
                            >
                                {(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? "WAITING FOR OTHERS..." :
                                    phase === 3 ? (
                                        p3Step === 0
                                            ? (actionHand.length === 0 ? "Play No Cards" : "Commit Action Cards")
                                            : p3Step === 2
                                                ? (relocationCardsCount > 0 ? "Done Relocation" : "No Relocation")
                                                : p3Step === 3
                                                    ? (exchangeCardsCount > 0 ? "Done Exchange" : "No Exchange")
                                                    : "Next Phase"
                                    ) : "Next Phase"}
                            </button>
                        )}
                    </div>



                    {/* --- Radial RSP Menu for Phase 2 --- */}
                    {phase === 2 && pendingPlacement && !pendingRsp && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
                            <RSPRadialMenu
                                actor={MY_ACTORS.find(a => a.id === pendingPlacement.actorId) || null}
                                usedTokens={usedRSPs}
                                onSelect={handleRSPSelect}
                                onCancel={() => setPendingPlacement(null)}
                            />
                        </div>
                    )}

                    {/* --- Radial Bid Menu for Phase 2 --- */}
                    {phase === 2 && pendingPlacement && pendingRsp && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
                            <BidRadialMenu
                                actor={pendingPlacement ? (MY_ACTORS.find(a => a.id === pendingPlacement.actorId) as any) : null}
                                resources={{
                                    product: resources.product,
                                    electricity: resources.electricity,
                                    recycling: resources.recycling
                                }}
                                onSelect={handleBid}
                                onCancel={() => setPendingPlacement(null)}
                            />
                        </div>
                    )}



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
                        phase === 1 && currentEvent && (
                            <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
                                <div className="relative w-[600px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-2xl p-6 flex flex-col items-center">
                                    <h2 className="text-xl font-bold text-[#d4af37] mb-2">{currentEvent.title}</h2>
                                    <div className="relative w-full h-[200px] mb-4 border border-white/10 rounded overflow-hidden">
                                        <Image src={currentEvent.image} layout="fill" objectFit="cover" alt="event" />
                                    </div>
                                    <p className="italic text-gray-400 text-center mb-4">"{currentEvent.flavor}"</p>
                                    <p className="text-white text-center mb-6">{currentEvent.desc}</p>

                                    {!eventResult ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex gap-4">
                                                {currentEvent.type === "discard" && (
                                                    <div className="flex items-center gap-2 text-white">
                                                        <button onClick={() => setDiscardAmount(d => Math.max(0, d - 1))} className="p-2 border rounded hover:bg-white/10">-</button>
                                                        <span className="font-bold text-xl">{discardAmount}</span>
                                                        <button onClick={() => setDiscardAmount(d => Math.min((resources as any)[currentEvent.targetResource!] || 0, d + 1))} className="p-2 border rounded hover:bg-white/10">+</button>
                                                    </div>
                                                )}
                                                <button onClick={handleEventConfirm} className="px-6 py-2 bg-[#d4af37] text-black font-bold rounded hover:bg-[#ffe066]">CONFIRM</button>
                                            </div>

                                            {/* --- TEMPORARY DEBUG BUTTON --- */}
                                            <button
                                                onClick={() => {
                                                    setCurrentEvent(null);
                                                    setEventResult(null);
                                                }}
                                                className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mt-4"
                                            >
                                                Debug: Next Event (Test Deck Lifecycle)
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <p className={`text-xl font-bold mb-4 text-center ${eventResult.win ? 'text-green-400' : 'text-red-400'}`}>
                                                {eventResult.win ? "SUCCESS!" : "FAILED"}
                                            </p>
                                            <p className="text-sm text-center mb-6">{eventResult.msg}</p>
                                            <button onClick={closeEvent} className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200">
                                                GET IT!
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* --- Phase 5: Modals --- */}
                    {phase === 5 && p5Step === 1 && (
                        <MarketOfferModal
                            isOpen={phase === 5 && p5Step === 1}
                            playerResources={{
                                product: resources.product,
                                electricity: resources.electricity,
                                recycling: resources.recycling
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
                            canAfford={resources.product >= 1 && resources.electricity >= 1 && resources.recycling >= 1}
                            availableCards={ACTION_CARDS}
                        />
                    )}

                    {/* Modals End Here */}
                </div>

                {/* Player Conflict Modal */}
                {playerConflictContext && (
                    <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto animate-in fade-in">
                        <div className="bg-[#171B21] border-2 border-[#d4af37] p-8 rounded-3xl flex flex-col items-center max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                            <h2 className="text-2xl font-rajdhani font-bold text-white mb-2 tracking-widest uppercase text-center">Relocation Conflict</h2>
                            <p className="text-[#d4af37] text-center mb-6 text-sm">
                                Multiple players are competing to relocate a {placedActors.find(a => a.actorId === playerConflictContext.actorId)?.actorType.toUpperCase()}!<br /><br />
                                Choose your Argument to decide the winner:
                            </p>

                            <div className="flex gap-6 mb-2">
                                {['rock', 'paper', 'scissors'].map(token => (
                                    <button
                                        key={token}
                                        onClick={() => handlePlayerConflictSubmit(token)}
                                        className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/5 hover:bg-[#d4af37]/20 hover:border-[#d4af37] hover:scale-110 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
                                    >
                                        <Image src={RSP_ICONS[token as keyof typeof RSP_ICONS]} width={50} height={50} className="group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]" alt={token} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </TooltipProvider>
    );
}
