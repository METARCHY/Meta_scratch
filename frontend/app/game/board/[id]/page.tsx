"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, Check, X, Crown, Trophy } from "lucide-react";
import { useGameState } from "@/context/GameStateContext";
import { TooltipProvider } from "@/context/TooltipContext";
import CursorTooltip from "@/components/ui/CursorTooltip";
import { useParams, useRouter } from "next/navigation";

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
import { ConflictResult, EventCardDefinition, ActionCardInstance } from "@/lib/modules/core/types";
import MarketOfferModal, { MarketOffer } from '@/components/game/MarketOfferModal';
import MarketRevealModal from '@/components/game/MarketRevealModal';
import BuyActionCardModal from '@/components/game/BuyActionCardModal';
import InventoryStatsModal from '@/components/game/InventoryStatsModal';
import { Briefcase } from 'lucide-react';
import { formatLog } from '@/lib/logUtils';
import { triggerBotPhase3Actions, triggerOpponentPlacements } from '@/lib/game/BotAI';
import { handleNextPhase } from '@/lib/game/PhaseEngine';
import { getActorRewardType, calculateReward, calculateVictoryPoints } from '@/lib/modules/resources/resourceManager';

// Constants
import { EVENTS, LOCATIONS, ACTION_CARDS, getConflicts, ALLOWED_MOVES } from '@/data/gameConstants';
import { RSP_ICONS, RESOURCE_ICONS } from '@/data/assetManifest';

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


interface OpponentData {
    id: string;
    name: string;
    resources: Record<string, number>;
    cards: Record<string, number>;
}
export default function GameBoardPage() {
    const { id } = useParams();
    const router = useRouter();
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
    const { resources, updateResource, setResources, player } = useGameState();
    // --- Core Game State ---
    const [game, setGame] = useState<any>(null);
    const [phase, setPhase] = useState(2); // Game starts at T1P2
    const [turn, setTurn] = useState(1);
    const [placedActors, setPlacedActors] = useState<any[]>([]);
    const [disabledLocations, setDisabledLocations] = useState<string[]>([]);
    const [actionDiscardPile, setActionDiscardPile] = useState<ActionCardInstance[]>([]);
    const [opponentsReady, setOpponentsReady] = useState(false);
    const [opponentsData, setOpponentsData] = useState<Record<string, OpponentData>>({});
    const [isGameOver, setIsGameOver] = useState(false);
    const [isTieBreakerScreen, setIsTieBreakerScreen] = useState(false);
    const [tieWinners, setTieWinners] = useState<{ id: string, name: string, vp: number }[]>([]);
    const [isWaitingForTieBreaker, setIsWaitingForTieBreaker] = useState(false);
    const [activeConflictLocId, setActiveConflictLocId] = useState<string | null>(null);
    const [resolvedConflicts, setResolvedConflicts] = useState<string[]>([]);
    const localPlayerId = player.citizenId || player.address || 'p1';

    // Initial value is a placeholder; actual event is set by useEffect when phase === 1
    const [currentEvent, setCurrentEvent] = useState<EventCardDefinition | null>(null);
    const [discardAmount, setDiscardAmount] = useState(0);
    const [eventResult, setEventResult] = useState<{ msg: string, win: boolean } | null>(null);
    const [eventTieBreakerActive, setEventTieBreakerActive] = useState<{ conflict: any } | null>(null);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    // Refs
    const isDrawingRef = useRef(false);
    const lastResetTurnRef = useRef(0);



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
                        name: p.name || 'Anonymous',
                        resources: { gato: 1000, product: 1, electricity: 1, recycling: 1, power: 0, art: 0, knowledge: 0, fame: 0, victoryPoints: 0 },
                        cards: {}
                    };
                }
            });
        } else {
            PLAYERS.forEach(opp => {
                initialOpponents[opp.id] = {
                    id: opp.id,
                    name: opp.name,
                    resources: { gato: 1000, product: 1, electricity: 1, recycling: 1, power: 0, art: 0, knowledge: 0, fame: 0, victoryPoints: 0 },
                    cards: {}
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
                const actorTypesAtLoc = Array.from(new Set(actors.map(a => (a.actorType || a.type || 'unknown').toLowerCase())));

                actorTypesAtLoc.forEach(actorType => {
                    // Find all actors of this type at this location (case-insensitive)
                    const actorsOfType = actors.filter(a => (a.actorType || a.type || '').toLowerCase() === actorType);

                    // A "conflict" object is created if there's at least one actor (Peaceful or VS)
                    const locDef = LOCATIONS.find(l => l.id === locId);
                    const uniqueConflictId = `${locId}_${actorType}`;

                    // Don't duplicate
                    if (conflicts.find(c => c.locId === uniqueConflictId)) return;

                    // Divide into player and opponents for consistent modal display
                    const playerActorRaw = actorsOfType.find(a => a.playerId === localPlayerId) || actorsOfType[0];
                    const opponentsRaw = actorsOfType.filter(a => a.actorId !== playerActorRaw.actorId);

                    const playerActorSource = MY_ACTORS.find(p => p.id === playerActorRaw.actorId) ||
                        { avatar: playerActorRaw.avatar, headAvatar: playerActorRaw.headAvatar, type: actorType, name: playerActorRaw.name };

                    const playerActor = {
                        ...playerActorRaw,
                        avatar: playerActorRaw.avatar || playerActorSource?.avatar || '',
                        headAvatar: playerActorRaw.headAvatar || playerActorSource?.headAvatar || '',
                        type: playerActorRaw.type || 'rock', 
                        actorType: actorType
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
                            actorType: actorType,
                            avatar: o.avatar || ACTOR_TYPES[actorType as keyof typeof ACTOR_TYPES]?.avatar || '',
                            headAvatar: o.headAvatar || ACTOR_TYPES[actorType as keyof typeof ACTOR_TYPES]?.headAvatar || ''
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
        if (game?.isTest && isWaitingForPlayers && opponentsReady) {
            setIsWaitingForPlayers(false);
            handleNextPhaseWrapper();
            addLog("All players are ready");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWaitingForPlayers, opponentsReady, game?.isTest]);
 
    // Phase 4: Auto-advance for peaceful/resolved players
    useEffect(() => {
        if (phase === 4 && game?.isTest && opponentsReady) {
            const myConflicts = activeConflicts.filter(c => c.hasPlayer);
            // PERSISTENCE FIX: We MUST require all conflicts (even peaceful ones) to be explicitly viewed/resolved by the player
            // as per Rule 4 "Conflicts Reveal" which says players click on the Sidebar to open the board.
            const allResolved = myConflicts.every(c => resolvedConflicts.includes(c.locId));
            
            console.log(`[DEBUG] Phase 4 Auto-Advance Check:`, {
                allResolved,
                myConflictsCount: myConflicts.length,
                resolvedConflicts,
                activeConflicts: activeConflicts.map(c => c.locId)
            });

            // Fix: Auto-advance even if myConflicts is empty (player has no actors or only non-conflicting ones)
            if (allResolved) {
                const timer = setTimeout(() => {
                    const msg = myConflicts.length > 0 ? "All conflicts secured. Advancing to Market..." : "No active conflicts. Advancing to Market...";
                    addLog(msg);
                    handleNextPhaseWrapper();
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [phase, activeConflicts, resolvedConflicts, opponentsReady, game?.isTest]);

    const commitTurn = async () => {
        const myId = player.citizenId || player.address || 'p1';
        if (!game || !myId) return;

        if (phase === 3 && p3Step === 0) {
            // Find selected Block Location cards
            const blockCards = actionHand.filter(card =>
                card.type === 'turn off location' && selectedActionCards[card.id] > 0
            );

            const newDisabled: string[] = [];
            const newDiscarded: ActionCardInstance[] = [];
            
            if (blockCards.length > 0) {
                for (const card of blockCards) {
                    if (card.disables && !disabledLocations.includes(card.disables)) {
                        newDisabled.push(card.disables);
                        const locName = LOCATIONS.find(l => l.id === card.disables)?.name || card.disables;
                        addLog(`${player.name || '080'} activated ${card.title} - ${locName} is now DISABLED`);
                    }
                    newDiscarded.push(card);
                }
            }

            const updatedDisabled = [...disabledLocations, ...newDisabled];
            const updatedDiscardPile = [...actionDiscardPile, ...newDiscarded];
            const filteredHand = actionHand.filter(c => !blockCards.some(bc => bc.id === c.id));

            // Apply locally first
            setDisabledLocations(updatedDisabled);
            setActionDiscardPile(updatedDiscardPile);
            setActionHand(filteredHand);
            setP3Step(1);

            // Sync to server immediately
            fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    updates: {
                        gameState: {
                            ...game?.gameState,
                            playerInventories: { 
                                ...(game?.gameState?.playerInventories || {}),
                                [myId]: filteredHand 
                            },
                            discardPile: [...(game?.gameState?.discardPile || []), ...newDiscarded],
                            disabledLocations: updatedDisabled,
                            // PERSISTENCE FIX: Advancing the step on server so other players see the Step 1 board
                            p3Step: 1 
                        }
                    }
                })
            }).catch(e => console.error("Failed to sync Phase 3 Step 0 commit", e));
            return;
        }

        if (phase === 3 && p3Step === 1) {
            setP3Step1Ready(true);
            setIsWaitingForPlayers(true); // Ensure local feedback
            
            if (game.isTest) {
                setOpponentsP3Step1Ready(prev => {
                    const next = { ...prev };
                    dynamicPlayers.forEach(p => { if (p.id !== localPlayerId) next[p.id] = true; });
                    return next;
                });
            } else {
                // Sync to server for PvP
                fetch(`/api/games/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update',
                        updates: {
                            gameState: {
                                ...game?.gameState,
                                decisions: {
                                    ...(game?.gameState?.decisions || {}),
                                    [myId]: { 
                                        ...(game?.gameState?.decisions?.[myId] || {}),
                                        p3Step1Ready: true 
                                    }
                                }
                            }
                        }
                    })
                }).catch(e => console.error("Failed to sync p3Step1Ready", e));
            }
            return;
        }

        if (phase === 3 && p3Step === 2) {
            if (relocationCardsCount === 0) {
                handleNextPhaseWrapper();
                return;
            }
            if (!relocationSource || !selectedHex) {
                addLog("Please select an Actor and a Destination hex first.");
                return;
            }

            // Actual execution on Submit
            const actor = placedActors.find(a => a.actorId === relocationSource);
            const extractedType = (actor?.actorType || (actor as any)?.type || 'Actor').toString().toLowerCase();
            
            const newMove = { playerId: myId, actorId: relocationSource, targetLocId: selectedHex };
            setPendingRelocations(prev => {
                const filtered = prev.filter(r => !(r.playerId === myId && r.actorId === relocationSource));
                return [...filtered, newMove];
            });

            // Deduct the card
            setSelectedActionCards(prev => {
                const next = { ...prev };
                const relocKey = Object.keys(next).find(k => k.includes('relocation') && next[k] > 0);
                if (relocKey) next[relocKey]--;
                return next;
            });

            // Consume Card from hand
            const cardToUse = actionHand.find(c => c.id.includes('relocation'));
            let newHand = actionHand;
            let newDiscard = actionDiscardPile;

            if (cardToUse) {
                newHand = actionHand.filter(c => c.instanceId !== cardToUse.instanceId);
                newDiscard = [...actionDiscardPile, cardToUse];
                
                // Update local state for immediate feedback
                setActionHand(newHand);
                setActionDiscardPile(newDiscard);
            }

            addLog(`Relocation Submitted: ${extractedType} to ${selectedHex.toUpperCase()}`);
            
            // SYNC HAND AND DISCARD
            if (game && game.id && !game.isTest) {
                try {
                    fetch(`/api/games/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'sync-turn',
                            citizenId: myId,
                            resources: {
                                ...resources,
                                actionHand: newHand,
                                actionDiscardPile: newDiscard
                            }
                        })
                    });
                } catch (e) {
                    console.error("Failed to sync hand/discard", e);
                }
            }

            // Check if we have more relocation cards to play
            const remainingCards = relocationCardsCount - 1;

            // Reset for next card
            setRelocationSource(null);
            setSelectedHex(null);

            if (remainingCards <= 0) {
                // PASS the final move and NEW states directly to avoid race condition
                resolveActionRelocations([newMove], newHand, newDiscard);
            }
            return;
        }

        if (phase === 3 && p3Step === 3) {
            if (exchangeCardsCount === 0) {
                handleNextPhaseWrapper();
                return;
            }
            if (exchangeStep !== 2 || !exchangeSourceValue || !exchangeTargetPlayer || !exchangeTargetValue) {
                addLog("Please finalize your exchange selection before submitting.");
                return;
            }

            // Actual execution on Submit
            const newExchange = { 
                playerId: myId, 
                sourceValue: exchangeSourceValue, 
                targetPlayerId: exchangeTargetPlayer, 
                targetValue: exchangeTargetValue 
            };

            setPendingExchanges(prev => [...prev, newExchange]);

            // Deduct the card
            setSelectedActionCards(prev => {
                const next = { ...prev };
                const exchangeKey = Object.keys(next).find(k => k.includes('change_values') && next[k] > 0);
                if (exchangeKey) next[exchangeKey]--;
                return next;
            });

            // Consume Card from hand
            const cardToUse = actionHand.find(c => c.id.includes('change_values'));
            let newHand = actionHand;
            let newDiscard = actionDiscardPile;

            if (cardToUse) {
                newHand = actionHand.filter(c => c.instanceId !== cardToUse.instanceId);
                newDiscard = [...actionDiscardPile, cardToUse];
                
                // Update local state for immediate feedback
                setActionHand(newHand);
                setActionDiscardPile(newDiscard);
            }

            addLog(`Exchange Submitted: Your ${exchangeSourceValue?.toUpperCase()} for ${opponentsData[exchangeTargetPlayer]?.name}'s ${exchangeTargetValue?.toUpperCase()}`);
            
            // Check if we have more exchange cards to play
            const remainingCards = exchangeCardsCount - 1;

            setExchangeSourceValue(null);
            setExchangeTargetPlayer(null);
            setExchangeTargetValue(null);

            // Sequential Logging for Multi-Card plays
            const ordinal = ["FIRST", "SECOND", "THIRD"];
            const currentOrdinal = ordinal[currentExchangeIndex] || `${currentExchangeIndex + 1}TH`;
            addLog(`Finalizing the ${currentOrdinal} Change Values card...`);

            if (remainingCards <= 0) {
                setExchangeDone(true);
                setCurrentExchangeIndex(0); // Reset for next turn

                // Use the already calculated states
                await resolveActionExchanges([newExchange], newHand, newDiscard);
            } else {
                setCurrentExchangeIndex(prev => prev + 1);
                setExchangeStep(1); // Repeat for next card
                const nextOrdinal = ordinal[currentExchangeIndex + 1] || `${currentExchangeIndex + 2}TH`;
                addLog(`Initializing the ${nextOrdinal} Change Values card...`);
            }
            // Immediately set waiting state so UI button changes to "WAITING FOR OTHERS..."
            setIsWaitingForPlayers(true);

            // SYNC HAND AND DISCARD
            if (game && game.id && !game.isTest) {
                try {
                    await fetch(`/api/games/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'sync-turn',
                            citizenId: myId,
                            resources: {
                                ...resources,
                                actionHand: newHand,
                                actionDiscardPile: newDiscard
                            }
                        })
                    });
                } catch (e) {
                    console.error("Failed to sync hand/discard", e);
                }
            }
            return;
        }

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

            // Calculate player intentions for Phase 3 Step 0
            let p3Steps: number[] | undefined = undefined;
            if (phase === 3 && p3Step === 0) {
                const steps: number[] = [];
                Object.entries(selectedActionCards).forEach(([cid, qty]) => {
                    if (qty <= 0) return;
                    const card = actionHand.find(c => c.id === cid);
                    if (!card) return;
                    const title = (card.title || '').toLowerCase();
                    const cardId = (card.id || '').toLowerCase();

                    if (cardId.includes('stop') || cardId.includes('turn_off') || title.includes('stop') || title.includes('block')) {
                        steps.push(1);
                    }
                    if (cardId.includes('relocation') || title.includes('relocation')) {
                        steps.push(2);
                    }
                    if (cardId.includes('change_values') || cardId.includes('exchange') || title.includes('change') || title.includes('exchange')) {
                        steps.push(3);
                    }
                });
                p3Steps = Array.from(new Set(steps));
            }

            await fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync-turn',
                    citizenId: mainPlayerId,
                    placedActors: myActors,
                    resources: resources, // PERSISTENCE FIX
                    decisions: p3Steps ? { [mainPlayerId]: { phase3Steps: p3Steps } } : undefined,
                    playerInventories: { [mainPlayerId]: actionHand } // DISCARD PERSISTENCE FIX
                })
            });
        } catch (e) {
            console.error("Sync error", e);
            setIsWaitingForPlayers(false);
        }
    };


    // Client polling listener for global State Sync
    useEffect(() => {
        if (!game || !game.gameState) return;

        const myId = player.citizenId || player.address || 'p1';
        
        // 0. Initialize Resources from Server if available (Persistence Fix)
        if (game.gameState.playerResources && game.gameState.playerResources[myId]) {
            const serverResources = game.gameState.playerResources[myId];
            const keys = Object.keys(serverResources);
            const isDifferent = keys.some(k => (serverResources as any)[k] !== (resources as any)[k]);
            if (isDifferent) {
                console.log("[DEBUG] Initializing local resources from server state:", serverResources);
                setResources(serverResources);
            }
        }

        // 0.1 Initialize Inventory from Server (Persistence Fix)
        if (game.gameState.playerInventories && game.gameState.playerInventories[myId]) {
            const serverInventory = game.gameState.playerInventories[myId];
            const isDifferent = serverInventory.length !== actionHand.length || 
                                serverInventory.some((c: any, i: number) => c.instanceId !== actionHand[i]?.instanceId);
            
            if (isDifferent) {
                console.log("[DEBUG] Initializing local inventory from server state:", serverInventory);
                setActionHand(serverInventory);
            }
        }

        // 0.2 Initialize Discard Pile and Disabled Locations from Server
        if (game.gameState.discardPile) {
            const serverDiscard = game.gameState.discardPile;
            if (serverDiscard.length !== actionDiscardPile.length) {
                console.log("[DEBUG] Initializing action discard pile from server:", serverDiscard);
                setActionDiscardPile(serverDiscard);
            }
        }

        if (game.gameState.disabledLocations) {
            const serverDisabled: string[] = game.gameState.disabledLocations;
            if (serverDisabled.length !== disabledLocations.length || serverDisabled.some((l: string) => !disabledLocations.includes(l))) {
                console.log("[DEBUG] Initializing disabled locations from server:", serverDisabled);
                setDisabledLocations(serverDisabled);
            }
        }

        // 1. Phase Advance Logic (Consensus)
        if (game.gameState.phaseTicker > localPhaseTicker.current) {
            localPhaseTicker.current = game.gameState.phaseTicker;
            setIsWaitingForPlayers(false);
            setTriggerGlobalPhaseAdvance(prev => prev + 1);
        }

        // 2. Real-time Actor Sync (Board state)
        // Decoupled from phaseTicker so players see each other's placements/moves in real-time
        let allStagedActors: any[] = [];
        Object.values(game.gameState.stagedActors || {}).forEach((actors: any) => {
            allStagedActors = [...allStagedActors, ...actors];
        });

        // Only update if the total count or IDs changed to avoid jitter
        setPlacedActors(prev => {
            if (prev.length === allStagedActors.length) {
                // Quick check if IDs are different
                const prevIds = prev.map((a: any) => a.actorId).sort().join(',');
                const nextIds = allStagedActors.map((a: any) => a.actorId).sort().join(',');
                if (prevIds === nextIds) {
                    // IDs match, check for locId changes (moves)
                    const prevLocs = prev.map((a: any) => `${a.actorId}:${a.locId}`).sort().join(',');
                    const nextLocs = allStagedActors.map((a: any) => `${a.actorId}:${a.locId}`).sort().join(',');
                    if (prevLocs === nextLocs) return prev;
                }
            }
            return allStagedActors;
        });

        // 3. Phase 3 Step 1 Ready Sync
        if (game.gameState.decisions) {
            const decisions = game.gameState.decisions;
            setOpponentsP3Step1Ready(prev => {
                const next = { ...prev };
                let changed = false;
                dynamicPlayers.forEach(p => {
                    if (p.id !== myId && decisions[p.id]?.p3Step1Ready) {
                        if (!next[p.id]) {
                            next[p.id] = true;
                            changed = true;
                        }
                    }
                });
                return changed ? next : prev;
            });
        }

        // 4. Action Phase Step Persistence Fix
        if (game.gameState.p3Step !== undefined && game.gameState.p3Step !== p3Step) {
            console.log("[DEBUG] Syncing p3Step from server:", game.gameState.p3Step);
            setP3Step(game.gameState.p3Step);
        }
    }, [game?.gameState]);

    // Triggers local progression with fresh states once sync resolves
    useEffect(() => {
        if (triggerGlobalPhaseAdvance > 0) {
            handleNextPhaseWrapper();
        }
    }, [triggerGlobalPhaseAdvance]);

    const triggerBotPhase3ActionsWrapper = async (step: number) => {
        const { triggerBotPhase3Actions } = await import('@/lib/game/BotAI');
        await triggerBotPhase3Actions(
            game,
            step,
            dynamicPlayers.filter(p => (p.citizenId || p.address || 'p1') !== localPlayerId),
            placedActors,
            addLog,
            setDisabledLocations,
            setPlacedActors,
            setOpponentsReady,
            setPendingRelocations,
            botActionCommitsRef.current
        );
    };

    const handleNextPhaseWrapper = async (skipResolution = false) => {
        const localPlayerId = player.citizenId || player.address || 'p1';

        // --- End of Phase 4 Rewards ---
        if (phase === 4) {
            placedActors.forEach(actor => {
                if (actor.playerId !== localPlayerId) return;
                if (disabledLocations.includes(actor.locId)) return;
                const wasInContestedConflict = activeConflicts.some(c =>
                    !c.isPeaceful && (
                        c.playerActor?.actorId === actor.actorId ||
                        c.opponents?.some((o: any) => o.actorId === actor.actorId)
                    )
                );
                if (wasInContestedConflict) return;

                // PERSISTENCE FIX: If the location (even peaceful) was already manually resolved/viewed, 
                // don't apply the fallback reward! This prevents double rewards.
                const isAlreadyResolved = resolvedConflicts.some(id => id.startsWith(actor.locId) && id.includes(actor.actorType || ''));
                if (isAlreadyResolved) return;

                const actorType = actor.actorType?.toLowerCase();
                const earnedResource = getActorRewardType(actorType, actor.locId);
                if (earnedResource) {
                    const finalReward = calculateReward(actorType as any, true, false, (actor.bid === 'product' ? [{ actorId: actor.actorId, bid: 'product' }] : []), actor.actorId);
                    updateResource(earnedResource, finalReward);
                    addLog(`${player.name || '080'} secured ${finalReward} ${earnedResource.toUpperCase()} (uncontested ${actorType} at ${LOCATIONS.find(l => l.id === actor.locId)?.name})!`);
                }
            });
        }

        if (!skipResolution && phase === 3 && p3Step === 2 && pendingRelocations.length > 0) {
            addLog(`Resolving ${pendingRelocations.length} pending relocations...`);
            resolveActionRelocations();
            return; 
        }

        if (phase === 3 && p3Step === 3 && pendingExchanges.length > 0) {
            await resolveActionExchanges();
        }

        const { handleNextPhase } = await import('@/lib/game/PhaseEngine');

        // Construct all action commits for synchronization
        const playerSteps: number[] = [];
        Object.entries(selectedActionCards).forEach(([id, qty]) => {
            if (qty <= 0) return;
            const card = actionHand.find(c => c.id === id);
            if (!card) return;
            const title = (card.title || '').toLowerCase();
            const cardId = (card.id || '').toLowerCase();

            if (cardId.includes('stop') || cardId.includes('turn_off') || title.includes('stop') || title.includes('block')) {
                playerSteps.push(1);
            }
            if (cardId.includes('relocation') || title.includes('relocation')) {
                playerSteps.push(2);
            }
            if (cardId.includes('change_values') || cardId.includes('exchange') || title.includes('change') || title.includes('exchange')) {
                playerSteps.push(3);
            }
        });

        // SIMULTANEOUS COMMITS: Before leaving Step 0, lock bot actions alongside the player.
        let finalCommits: Record<string, number[]> = {
            [localPlayerId]: Array.from(new Set(playerSteps))
        };

        if (phase === 3 && p3Step === 0) {
            const opponents = dynamicPlayers.filter(p => (p.id || p.citizenId) !== localPlayerId);
            const botCommits: Record<string, number[]> = {};
            let anyBotAction = false;
            
            opponents.forEach(opp => {
                const id = opp.id || opp.citizenId || 'bot';
                botCommits[id] = [];
                
                // Bot decision logic: Only play if they actually HAVE the card in opponentsData
                const oppInv = opponentsData[id]?.cards || {};
                const hasBlock = Object.keys(oppInv).some(k => (k.includes('stop') || k.includes('block')) && oppInv[k] > 0);
                const hasReloc = Object.keys(oppInv).some(k => k.includes('relocation') && oppInv[k] > 0);
                const hasExch = Object.keys(oppInv).some(k => (k.includes('change_values') || k.includes('exchange')) && oppInv[k] > 0);

                if (hasBlock && Math.random() < 0.8) { botCommits[id].push(1); anyBotAction = true; } 
                if (hasReloc && Math.random() < 0.8) { botCommits[id].push(2); anyBotAction = true; } 
                if (hasExch && Math.random() < 0.8) { botCommits[id].push(3); anyBotAction = true; }
            });
            
            botActionCommitsRef.current = botCommits;
            
            // Merge bot commits into finalCommits (FLAT structure)
            Object.assign(finalCommits, botCommits);

            // SYNC HUMANS: Reconstruct commitments from server state
            if (game?.gameState?.decisions) {
                Object.entries(game.gameState.decisions).forEach(([pid, d]: [string, any]) => {
                    // Only merge if this is a known human player and they have phase3Steps
                    const isHuman = dynamicPlayers.some(p => (p.id || p.citizenId) === pid && !p.id.startsWith('bot'));
                    if (isHuman && d.phase3Steps) {
                        finalCommits[pid] = d.phase3Steps;
                    }
                });
            }

            const hasAnyAction = Object.values(finalCommits).some(steps => steps.length > 0);
            if (!hasAnyAction) {
                // No actions at all - skipping to Step 4 (Summary)
                setP3Step(4);
                addLog('No players selected Action Cards — Check Summary.');
                setOpponentsReady(true);
                setIsWaitingForPlayers(false);
                return;
            }
        } else {
            // If not Step 0, use existing bot commits
            Object.assign(finalCommits, botActionCommitsRef.current);
        }

        const { isGameOver: gameEnded, winners: finalWinners } = handleNextPhase(
            turn, phase, p3Step, player, dynamicPlayers, placedActors, disabledLocations, 
            addLog, triggerBotPhase3ActionsWrapper, setPhase, setP3Step, setP5Step, 
            setTurn, setPlacedActors, setResolvedConflicts, setDisabledLocations, 
            setOpponentsReady, finalCommits, game?.isTest
        );

        // Calculate max turns based on player count
        const maxTurns = (() => {
            if (game?.isTest) return 5;
            const playerCount = dynamicPlayers.length;
            if (playerCount === 2 || playerCount === 3) return 5;
            if (playerCount === 4) return 6;
            return 5;
        })();

        if (gameEnded) {
            setIsGameOver(true);
            try {
                fetch(`/api/games/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update', updates: { status: 'finished' } })
                });
            } catch (e) { console.error("Failed to sync game over state", e); }
            return;
        }

        // TIE-BREAKER DETECTION: If it was the end of Phase 4 of the last turn, and handleNextPhase didn't end the game
        if (phase === 4 && turn >= maxTurns && finalWinners.length > 1) {
            setTieWinners(finalWinners);
            setIsTieBreakerScreen(true);
            
            // Sync tie-breaker status to server
            if (game && game.id && !game.isTest) {
                const tiedIds = finalWinners.map(w => w.id);
                try {
                    fetch(`/api/games/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'update', 
                            updates: { 
                                gameState: { 
                                    ...game.gameState, 
                                    isTieBreaker: true,
                                    activePlayerIds: tiedIds
                                } 
                            } 
                        })
                    });
                    addLog(`The game continues! Tie-breaker involves: ${finalWinners.map(w => w.name).join(', ')}`);
                } catch (e) { console.error("Failed to sync tie-breaker state", e); }
            }
            return;
        }

        // FINAL SYNC before moving or waiting for next phase
        if (game && game.id && !game.isTest) {
            try {
                await fetch(`/api/games/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'sync-turn',
                        citizenId: localPlayerId,
                        resources: resources // PERSISTENCE FIX: Final resources for this phase
                    })
                });
            } catch (e) {
                console.error("End-of-phase sync error", e);
            }
        }
    };

    const handleContinueTieBreaker = async () => {
        const myId = player.citizenId || player.address || 'p1';
        const isTied = tieWinners.some(w => w.id === myId);
        
        if (isTied) {
            setIsWaitingForTieBreaker(true);
            // Sync readiness via sync-turn (consensus)
            try {
                await fetch(`/api/games/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'sync-turn',
                        citizenId: myId,
                    })
                });
                addLog(`${player.name || '080'} is ready for the tie-breaker!`);
            } catch (e) {
                console.error("Failed to sync tie-breaker readiness", e);
                setIsWaitingForTieBreaker(false);
            }
        } else {
            // Non-tied players go back to lobby
            router.push('/');
        }
    };

    // --- Opponent Emulation ---
    useEffect(() => {
        if (phase === 2 && !opponentsReady && game) {
            triggerOpponentPlacements(
                game,
                [], 
                PLAYERS,
                setOpponentsReady,
                setPlacedActors,
                setOpponentsData,
                addLog,
                opponentsData
            );
        }
    }, [phase, game, opponentsReady]);





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

    const handleEventTieBreakerResolve = (result: ConflictResult) => {
        if (result.restart) return; // Modal handles rerolls internally

        // Safety check: currentEvent should always be set at this point, but guard against null
        if (!currentEvent) {
            console.error("handleEventTieBreakerResolve called without currentEvent set");
            setEventTieBreakerActive(null);
            closeEvent();
            return;
        }

        const isWin = result.winnerId === localPlayerId;
        const rewardKey = currentEvent.reward || 'fame';
        let logMsg = "";

        if (isWin) {
            if (rewardKey === 'action_card') {
                const drawnCard = drawActionCard();
                setActionHand(prev => [...prev, drawnCard]);
                logMsg = `${player.name || '080'} WON the Tie-Breaker Conflict and earned the Action Card: ${drawnCard.title}!`;
                setEventResult({ msg: `You won! Received Action Card: ${drawnCard.title}`, win: true });
            } else {
                updateResource(rewardKey as any, 1);
                logMsg = `${player.name || '080'} WON the Tie-Breaker Conflict and earned 1 ${rewardKey.toUpperCase()}!`;
                setEventResult({ msg: `You won! Received 1 ${rewardKey.toUpperCase()}`, win: true });
            }
        } else if (result.winnerId) {
            const winId = result.winnerId;
            const winnerName = dynamicPlayers.find(p => p.id === winId)?.name || 'Opponent';
            setOpponentsData((prev: any) => {
                const next = { ...prev };
                if (!next[winId]) return prev;
                const oppRes = { ...next[winId].resources };
                const key = rewardKey === 'action_card' ? 'action_card' : rewardKey;
                
                if (key === 'action_card') {
                    // Logic for bots earning cards: increment their cards count
                    const cards = { ...next[winId].cards };
                    const firstCardId = ACTION_CARDS[0].id; // or any random card id
                    cards[firstCardId] = (cards[firstCardId] || 0) + 1;
                    next[winId] = { ...next[winId], cards };
                } else {
                    oppRes[key] = (oppRes[key] || 0) + 1;
                    next[winId] = { ...next[winId], resources: oppRes };
                }
                return next;
            });
            logMsg = `${winnerName} WON the Tie-Breaker Conflict and received ${rewardKey === 'action_card' ? 'an Action Card' : 'Fame'}.`;
            setEventResult({ msg: logMsg, win: false });
        } else if (result.isDraw && result.evictAll) {
            logMsg = `Tie-Breaker ended in a complete DISMISSAL. No one receives the reward.`;
            setEventResult({ msg: logMsg, win: false });
        }

        addLog(logMsg);
        setEventTieBreakerActive(null);
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
    const [relocResults, setRelocResults] = useState<{ actorId: string, fromLocId: string, toLocId: string, pName: string, ownerName: string }[] | null>(null);
    const [exchangeResults, setExchangeResults] = useState<{ pName: string, sourceVal: string, targetName: string, targetVal: string }[] | null>(null);
    const [exchangeDone, setExchangeDone] = useState(false);
    const [p3Step1Ready, setP3Step1Ready] = useState(false);
    const [opponentsP3Step1Ready, setOpponentsP3Step1Ready] = useState<Record<string, boolean>>({});

    const [exchangeStep, setExchangeStep] = useState<0 | 1 | 2>(0); // 1: Choose own, 2: Choose target
    const [exchangeSourceValue, setExchangeSourceValue] = useState<string | null>(null);
    const [currentExchangeIndex, setCurrentExchangeIndex] = useState<number>(0); 
    const [exchangeTargetPlayer, setExchangeTargetPlayer] = useState<string | null>(null);
    const [exchangeTargetValue, setExchangeTargetValue] = useState<string | null>(null);
    const [pendingExchanges, setPendingExchanges] = useState<any[]>([]);

    const [biddingActorId, setBiddingActorId] = useState<string | null>(null);
    const botActionCommitsRef = useRef<Record<string, number[]>>({});
    const [p3Step, setP3Step] = useState<0 | 1 | 2 | 3 | 4>(0); // 0: Select, 1: Stop, 2: Relocate, 3: Exchange, 4: Summary
    const [p5Step, setP5Step] = useState<1 | 2 | 3>(1); // 1: Market Offer, 2: Market Reveal, 3: Buy Cards
    const [playerMarketOffer, setPlayerMarketOffer] = useState<MarketOffer | null>(null);
    const [botMarketOffers, setBotMarketOffers] = useState<{ [id: string]: MarketOffer | null }>({});
    const [marketMatchId, setMarketMatchId] = useState<string | null>(null);
    const [actionHand, setActionHand] = useState<any[]>([]);
    const [activationEffect, setActivationEffect] = useState<string | null>(null);

    const filteredActionHand = useMemo(() => {
        if (p3Step === 0) return actionHand; // Show all to select
        if (p3Step === 1) return actionHand.filter(c => c.type === 'turn off location');
        if (p3Step === 2) return actionHand.filter(c => c.id.includes('relocation') || c.title?.includes('Relocation'));
        if (p3Step === 3) return actionHand.filter(c => c.id.includes('change_values') || c.id.includes('exchange') || c.title?.includes('Change of Values'));
        return [];
    }, [p3Step, actionHand]);

    // Count available relocation cards from queued selection
    const relocationCardsCount = useMemo(() => {
        let count = 0;
        Object.entries(selectedActionCards).forEach(([id, qty]) => {
            const card = actionHand.find(c => c.id === id);
            if (card && (card.id.includes('relocation') || card.title?.includes('Relocation'))) {
                count += qty;
            }
        });
        return count;
    }, [selectedActionCards, actionHand]);

    // Count available exchange cards from queued selection
    const exchangeCardsCount = useMemo(() => {
        let count = 0;
        Object.entries(selectedActionCards).forEach(([id, qty]) => {
            const card = actionHand.find(c => c.id === id);
            if (card && (card.id.includes('change_values') || card.id.includes('exchange') || card.title?.includes('Change of Values'))) {
                count += qty;
            }
        });
        return count;
    }, [selectedActionCards, actionHand]);

    const hasExchangeableValues = useMemo(() => {
        return (resources.power || 0) > 0 || (resources.knowledge || 0) > 0 || (resources.art || 0) > 0;
    }, [resources]);

    const hasOpponentExchangeableValues = useMemo(() => {
        return Object.values(opponentsData).some(opp => {
            const res = opp.resources || {};
            return (res.power || 0) > 0 || (res.knowledge || 0) > 0 || (res.art || 0) > 0;
        });
    }, [opponentsData]);


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
        setStickyConflicts(prev => prev.map(conflict => {
            if (conflict.locId !== activeConflictLocId) return conflict;
            
            // Filter out specific losers from this iteration so they don't appear in the re-roll
            const filteredOpponents = conflict.opponents.filter((o: any) => !result.loserIds.includes(o.actorId));
            const playerLost = result.loserIds.includes(conflict.playerActor?.actorId);
            
            return {
                ...conflict,
                playerActor: playerLost ? null : (involvedActorIds.includes(conflict.playerActor?.actorId)
                    ? { ...conflict.playerActor, bid: undefined }
                    : conflict.playerActor),
                opponents: filteredOpponents.map((o: any) =>
                    involvedActorIds.includes(o.actorId) ? { ...o, bid: undefined } : o
                )
            };
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
                        const bids = result.successfulBids || [];
                        const finalReward = calculateReward(winActorType as any, true, false, bids, result.winnerId || '');

                        updateResource(earnedResource, finalReward);
                        addLog(`${player.name || '080'} WON ${finalReward} ${earnedResource.toUpperCase()} from ${winActorType?.toUpperCase()} conflict at ${locDef?.name}!`);
                    }
                }
            } else if (result.winnerId) {
                // Wait, it's a bot (since it's not localPlayerId)
                // Find which bot won
                const winnerActor = currentConflict?.opponents?.find((o: any) => o.actorId === result.winnerId);
                if (winnerActor) {
                    const winActorType = winnerActor.actorType?.toLowerCase();
                    const earnedResource = getActorRewardType(winActorType, realLocId || '');
                    if (earnedResource) {
                        const bids = result.successfulBids || [];
                        const finalReward = calculateReward(winActorType as any, true, false, bids, result.winnerId || '');
                        const winnerPid = winnerActor.playerId;

                        setOpponentsData((prev: any) => {
                            if (!prev[winnerPid]) return prev;
                            const next = { ...prev };
                            const newResources = { ...next[winnerPid].resources };
                            newResources[earnedResource] = (newResources[earnedResource] || 0) + finalReward;
                            next[winnerPid] = { ...next[winnerPid], resources: newResources };
                            return next;
                        });
                        const winnerName = dynamicPlayers.find(p => p.id === winnerPid)?.name || 'Opponent';
                        addLog(`${winnerName} WON ${finalReward} ${earnedResource.toUpperCase()} from ${winActorType?.toUpperCase()} conflict at ${locDef?.name}!`);
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
                if (isDrawingRef.current) return;
                isDrawingRef.current = true;

                let serverDeck = game.gameState?.eventDeck || [];
                
                if (serverDeck.length === 0) {
                    addLog("All events have occurred.");
                    isDrawingRef.current = false;
                    return;
                }
                
                const randomIndex = Math.floor(Math.random() * serverDeck.length);
                const nextEventId = serverDeck[randomIndex];
                const nextEvent = EVENTS.find(e => e.id === nextEventId);
                
                if (nextEvent) {
                    setCurrentEvent(nextEvent);
                    
                    const updatedDeck = serverDeck.filter((_: string, i: number) => i !== randomIndex);
                    addLog(`EVENT DRAWN: ${nextEvent.title} (${updatedDeck.length} left)`);
                    
                    fetch(`/api/games/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'update',
                            updates: {
                                gameState: {
                                    ...game.gameState,
                                    eventDeck: updatedDeck,
                                    currentEventId: nextEvent.id,
                                    eventDeckTurn: currentTurn
                                }
                            }
                        })
                    })
                    .then(() => { isDrawingRef.current = false; })
                    .catch(err => { 
                        console.error("Failed to sync event deck", err);
                        isDrawingRef.current = false;
                    });
                } else {
                    isDrawingRef.current = false;
                }
            }
        } else {
            // Reset drawing ref when phase changes away from Event Phase
            isDrawingRef.current = false;
        }

        // TURN TRANSITION FIX: Clear local event state if we just entered Phase 1 of a NEW turn
        // This ensures the useEffect above triggers a fresh draw.
        // We use lastResetTurnRef to ensure this only happens ONCE per turn transition.
        const deckTurn = game?.gameState?.eventDeckTurn || 0;
        if (phase === 1 && deckTurn < turn && lastResetTurnRef.current < turn && currentEvent && !isWaitingForPlayers && !eventResult) {
            console.log(`[DEBUG] New turn ${turn} detected (Deck turn was ${deckTurn}). Resetting event state.`);
            lastResetTurnRef.current = turn;
            setCurrentEvent(null);
            setDiscardAmount(0);
            setEventResult(null);
            setDisabledLocations([]); // NEW: Clear construction blocks at turn start
            setResolvedConflicts([]);

            // Sync reset to server
            fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    updates: {
                        gameState: {
                            ...game?.gameState,
                            disabledLocations: [],
                            resolvedConflicts: []
                        }
                    }
                })
            }).catch(e => console.error("Failed to sync turn reset state", e));
        }
    }, [phase, turn, currentEvent, game?.isTest, game?.gameState?.eventDeckTurn]);


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
                    const botRes = (opponentsData[p.id]?.resources as any)?.[currentEvent.targetResource!] || 0;
                    const amount = Math.floor(Math.random() * (botRes + 1));
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
            updateResource(currentEvent.targetResource! as any, -discardAmount);

            // Apply opponent discards graphically (LOGIC REVERTED: NO ACTUAL DEDUCTION)
            setOpponentsData((prev: any) => {
                const next = { ...prev };
                oppDiscards.forEach(opp => {
                    if (!next[opp.id]) next[opp.id] = { resources: { power: 0, art: 0, knowledge: 0, fame: 0 } };
                    // We generate the object but DO NOT subtract resources from bot inventories
                    const oppRes = { ...next[opp.id].resources };
                    // next[opp.id] = { ...next[opp.id], resources: oppRes }; // No change
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
            const rewardKey = currentEvent.reward || 'fame';
            if (rewardKey === "fame") {
                updateResource('fame', 1);
            } else if (rewardKey === 'action_card') {
                const drawn = drawActionCard();
                setActionHand(prev => [...prev, drawn]);
                msg += ` Found action card: ${drawn.title}`;
            } else {
                updateResource(rewardKey as any, 1);
            }
        }

        setEventResult({ msg, win });
        addLog(`Event Result: ${msg}`);

        // Final Server Sync (Added to restore persistence from previous version)
        if (game && id && !game.isTest) {
            const allPlayerResources: Record<string, any> = { [localPlayerId]: resources };
            dynamicPlayers.forEach(p => { if (p.id !== localPlayerId) allPlayerResources[p.id] = opponentsData[p.id]?.resources; });
            fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync-turn', citizenId: localPlayerId, resources, playerResources: allPlayerResources })
            }).catch(e => console.error("Event persistence sync failed:", e));
        }
    };

    // Event Logic Complete

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


    // Handle Phase 3 Step 1 Progression
    useEffect(() => {
        if (phase === 3 && p3Step === 1 && p3Step1Ready) {
            const botIds = dynamicPlayers.filter(p => p.id.startsWith('bot') || p.id !== localPlayerId).map(p => p.id);
            const allReady = botIds.every(id => opponentsP3Step1Ready[id]);

            if (allReady) {
                // Transition logic previously in Step 0
                let hasReloc = relocationCardsCount > 0;
                let hasExchange = exchangeCardsCount > 0;

                const commits = botActionCommitsRef.current || {};
                Object.values(commits).forEach(botSteps => {
                    if (botSteps.includes(2)) hasReloc = true;
                    if (botSteps.includes(3)) hasExchange = true;
                });

                if (hasReloc) {
                    setP3Step(2);
                    addLog('STEP: RELOCATION');
                } else if (hasExchange) {
                    // Check if self has any values to exchange
                    const hasSelfValue = resources.power > 0 || resources.knowledge > 0 || resources.art > 0 || resources.fame > 0;
                    if (!hasSelfValue) {
                        addLog("You have no values to exchange! Change Values card returned.");
                        handleNextPhaseWrapper();
                    } else {
                        setP3Step(3);
                    }
                } else {
                    addLog('No further actions — advancing to Conflicts.');
                    handleNextPhaseWrapper();
                }
                setP3Step1Ready(false);
                setIsWaitingForPlayers(false);
            }
        }
    }, [phase, p3Step, p3Step1Ready, opponentsP3Step1Ready, game?.isTest, opponentsReady, relocationCardsCount, exchangeCardsCount, resources, dynamicPlayers, localPlayerId, handleNextPhaseWrapper, addLog]);

    // --- Phase 3 Step 3: Change Values Initialization ---
    useEffect(() => {
        if (phase === 3 && p3Step === 3 && exchangeStep === 0 && exchangeCardsCount > 0 && !exchangeDone) {
            setExchangeStep(1);
            const ordinal = ["FIRST", "SECOND", "THIRD"];
            const currentOrdinal = ordinal[currentExchangeIndex] || `${currentExchangeIndex + 1}TH`;
            addLog(`STEP: CHANGE VALUES - Initializing the ${currentOrdinal} card.`);
            addLog('Choose one of your values to exchange.');
            console.log(`[DEBUG] exchangeStep initialized for ${currentOrdinal} card`);
        }
    }, [phase, p3Step, exchangeStep, exchangeCardsCount, exchangeDone, currentExchangeIndex, addLog]);

    // --- Phase 3 Step 2: Auto-Consensus for Idle Players ---
    useEffect(() => {
        if (phase === 3 && p3Step === 2 && relocationCardsCount === 0 && opponentsReady) {
            const timer = setTimeout(() => {
                addLog("You have no relocations to perform. Advancing...");
                handleNextPhaseWrapper();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [phase, p3Step, relocationCardsCount, opponentsReady, addLog, handleNextPhaseWrapper]);


    const handleHexClick = async (locId: string) => {
        if (disabledLocations.includes(locId)) return;

        // Phase 3 Step 2: Relocation
        if (phase === 3 && p3Step === 2 && relocationSource) {
            const actor = placedActors.find(p => p.actorId === relocationSource);
            if (!actor) return;

            // Validate Move - Enforce ALLOWED_MOVES for ALL Actors
            const extractedType = (actor.actorType || (actor as any).type || '').toString().toLowerCase();
            console.log("[DEBUG] Relocating actor type:", extractedType, "to", locId);
            
            if (extractedType) {
                const validTargets = (ALLOWED_MOVES as any)[extractedType];
                if (validTargets && !validTargets.includes(locId)) {
                    addLog(`Invalid relocation for ${extractedType}! Must move to ${validTargets.map((t: string) => t.toUpperCase()).join(', ')}`);
                    return;
                }
            }

            if (actor.locId === locId) {
                addLog(`Cannot relocate ${extractedType} to its current location (${locId.toUpperCase()}).`);
                return;
            }

            setSelectedHex(locId);
            addLog(`Direction set: ${extractedType} to ${locId.toUpperCase()}. Click 'Submit Relocation' to confirm.`);
            return;
        }

        if (phase !== 2 || isWaiting) return;
        if (selectedActorId) {
            const actor = MY_ACTORS.find(a => a.id === selectedActorId);
            if (!actor) return;

            // Check Allowed locations (Validation logic)
            const type = (actor.type || '').toLowerCase();
            const allowedLocs = (ALLOWED_MOVES as any)[type] || [];
            if (!allowedLocs.includes(locId)) {
                addLog(`Placement blocked: ${actor.name} cannot go to ${locId.toUpperCase()}`);
                console.log(`Placement blocked: ${type} cannot go to ${locId}`, allowedLocs);
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

    const resolveActionExchanges = async (extraMoves: typeof pendingExchanges = [], updatedHand?: any[], updatedDiscard?: any[]) => {
        addLog("Resolving Exchanges...");
        const currentHand = updatedHand || actionHand;
        const currentDiscard = updatedDiscard || actionDiscardPile;

        const currentQueue = [...pendingExchanges, ...extraMoves];
        if (currentQueue.length === 0) {
            handleNextPhaseWrapper();
            return;
        }

        // Group by target resource/player to find direct conflicts
        const targetGroups: Record<string, any[]> = {};
        currentQueue.forEach(ex => {
            const key = `${ex.targetPlayerId}-${ex.targetValue}`;
            if (!targetGroups[key]) targetGroups[key] = [];
            targetGroups[key].push(ex);
        });

        const winners: any[] = [];
        const summary: typeof exchangeResults = [];

        for (const key of Object.keys(targetGroups)) {
            const competitors = targetGroups[key];
            // Simplification: first committed wins
            winners.push(competitors[0]);
        }

        // Apply winners
        for (const ex of winners) {
            const { playerId, sourceValue, targetPlayerId, targetValue } = ex;
            const pName = dynamicPlayers.find(p => p.id === playerId)?.name || 'Player';
            const tName = dynamicPlayers.find(p => p.id === targetPlayerId)?.name || 'Opponent';
            
            summary.push({ pName, sourceVal: sourceValue, targetName: tName, targetVal: targetValue });

            // Update Opponent (Target)
            setOpponentsData(prev => {
                const next = { ...prev };
                if (next[targetPlayerId]) {
                    const res = { ...next[targetPlayerId].resources };
                    res[targetValue] = Math.max(0, (res[targetValue] || 0) - 1);
                    res[sourceValue] = (res[sourceValue] || 0) + 1;
                    next[targetPlayerId] = { ...next[targetPlayerId], resources: res };
                }
                if (next[playerId]) {
                    const res = { ...next[playerId].resources };
                    res[sourceValue] = Math.max(0, (res[sourceValue] || 0) - 1);
                    res[targetValue] = (res[targetValue] || 0) + 1;
                    next[playerId] = { ...next[playerId], resources: res };
                }
                return next;
            });

            // Local updates
            if (playerId === localPlayerId) {
                updateResource(sourceValue, -1);
                updateResource(targetValue, 1);
            }
            if (targetPlayerId === localPlayerId) {
                updateResource(targetValue, -1);
                updateResource(sourceValue, 1);
            }
            addLog(`Exchange: ${pName} took ${targetValue.toUpperCase()} from ${tName} for ${sourceValue.toUpperCase()}`);
        }

        setExchangeResults(summary);
        
        // DISCARD PERSISTENCE FIX: Final sync and exit
        const mainPlayerId = player.citizenId || player.address || 'p1';
        
        // Return "Change of Values" if conditions met
        let finalHand = [...currentHand];
        const hasSelfValue = (resources.power || 0) > 0 || (resources.knowledge || 0) > 0 || (resources.art || 0) > 0;
        const hasOppValue = Object.values(opponentsData).some(opp => {
            const res = opp.resources || {};
            return (res.power || 0) > 0 || (res.knowledge || 0) > 0 || (res.art || 0) > 0;
        });

        if (!hasSelfValue || !hasOppValue) {
            const exchangeCard = ACTION_CARDS.find(c => c.id.includes('change_values') || c.id.includes('exchange'));
            if (exchangeCard && !finalHand.find(c => c.id === exchangeCard.id)) {
                 addLog("No values were available for exchange. Card returned to hand.");
                 finalHand.push({ ...exchangeCard, instanceId: `returned_${Date.now()}` });
                 setActionHand(finalHand);
            }
        }

        fetch(`/api/games/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                updates: {
                    gameState: {
                        ...game?.gameState,
                        playerInventories: { 
                            ...(game?.gameState?.playerInventories || {}),
                            [mainPlayerId]: finalHand 
                        },
                        discardPile: currentDiscard
                    }
                }
            })
        }).catch(e => console.error("Failed to sync inventory after exchange", e));

        setTimeout(() => {
            setExchangeResults(null);
            setExchangeDone(false);
            setExchangeStep(0); // RESET BUG FIX: Ensure next play starts at Step 1
            setExchangeSourceValue(null);
            setExchangeTargetPlayer(null);
            setExchangeTargetValue(null);
            setPendingExchanges([]);
            handleNextPhaseWrapper();
        }, 3000);
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
            
            // AUTOMATIC BREAK: If it's a local test game and there's a recurring draw, 
            // pick a random winner among tied parties to prevent infinite loops.
            if (context.moves.length > 1 && context.moves.every(m => m.choice === choices[0])) {
                 // In a real game we wait, but to prevent UI lockup in dev/test, we can force a result after logs.
                 // For now, let's just make sure the state is handled correctly.
            }
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
            setTimeout(() => resolveActionRelocations(), 1000);
        } else {
            // Tie-break among winners
            const others = pendingRelocations.filter(r => r.actorId !== context.actorId);
            const tied = winners.map(w => ({
                playerId: w.playerId,
                actorId: context.actorId,
                targetLocId: w.targetLocId
            }));
            setPendingRelocations([...others, ...tied]);
            setPlayerConflictContext(null);
            setTimeout(() => resolveActionRelocations(), 1000);
        }
    };


    const resolveActionRelocations = (extraMoves: typeof pendingRelocations = [], updatedHand?: any[], updatedDiscard?: any[]) => {
        const currentHand = updatedHand || actionHand;
        const currentDiscard = updatedDiscard || actionDiscardPile;

        const currentQueue = [...pendingRelocations, ...extraMoves];
        if (currentQueue.length === 0) {
            handleNextPhaseWrapper(); // Ensure we don't get stuck if called with nothing
            return;
        }

        // Group queued relocations by actorId, ensuring uniqueness by playerId
        const groups: Record<string, typeof pendingRelocations> = {};
        currentQueue.forEach(r => {
            if (!groups[r.actorId]) groups[r.actorId] = [];
            // Robustness: Only add if this player doesn't already have a move for this actor in THIS group
            if (!groups[r.actorId].find(m => m.playerId === r.playerId)) {
                groups[r.actorId].push(r);
            }
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
        const summary: typeof relocResults = [];
        const validMoves: typeof pendingRelocations = [];
        Object.entries(groups).forEach(([actorId, moves]) => {
            validMoves.push(moves[0]);
            const pName = dynamicPlayers.find(p => p.id === moves[0].playerId)?.name || 'Player';
            const actor = placedActors.find(a => a.actorId === actorId);
            const ownerId = actor?.playerId || localPlayerId;
            const ownerName = ownerId === localPlayerId ? 'Your' : (dynamicPlayers.find(p => p.id === ownerId)?.name + "'s" || 'Opponent\'s');
            const actorName = actor?.actorType || 'Actor';
            const fromLoc = actor?.locId || 'Unknown';
            
            summary.push({ actorId, fromLocId: fromLoc, toLocId: moves[0].targetLocId, pName, ownerName });
            addLog(`Relocation complete: ${pName} relocated ${ownerName} ${actorName} to ${moves[0].targetLocId.toUpperCase()}`);
        });

        if (validMoves.length > 0) {
            setRelocResults(summary);
            const nextActors = placedActors.map(a => {
                const move = validMoves.find(m => m.actorId === a.actorId);
                return move ? { ...a, locId: move.targetLocId } : a;
            });

            setPlacedActors(nextActors);

            // DISCARD PERSISTENCE FIX: Calculate next hand locally before sync
            const nextHand = actionHand.filter(c => {
                 // Remove one relocation card used for this batch of moves (simplification: assume 1 used per call if validMoves > 0)
                 // Or more accurately: validMoves might contain multiple moves.
                 // The UI already removes them from actionHand individually during commitTurn (Phase 3 Step 2 block).
                 // So here actionHand should already be correct.
                 return true; 
            });

            // Sync to backend
            const mainPlayerId = player.citizenId || player.address || 'p1';
            const actorsByPlayer = nextActors.reduce((acc: any, actor) => {
                const pid = actor.playerId || mainPlayerId;
                if (!acc[pid]) acc[pid] = [];
                acc[pid].push(actor);
                return acc;
            }, {});

            fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    updates: {
                        gameState: {
                            ...game?.gameState,
                            stagedActors: actorsByPlayer,
                            playerInventories: { 
                                ...(game?.gameState?.playerInventories || {}),
                                [mainPlayerId]: currentHand 
                            },
                            discardPile: currentDiscard
                        }
                    }
                })
            }).catch(e => console.error("Failed to sync actor relocation", e));

            // Show results for 3 seconds then clear and advance
            setTimeout(() => {
                setRelocResults(null);
                setPendingRelocations([]);
                handleNextPhaseWrapper();
            }, 3000);
        } else {
            handleNextPhaseWrapper();
        }
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
        // REMOVED immediate phase advancement to allow multiple purchases
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
                    pendingRelocations={pendingRelocations}
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
                    {/* Step 1: Blocked Locations Board */}
                    {phase === 3 && p3Step === 1 && (
                        <div className="absolute inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
                            <div className="relative w-[500px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-2xl p-8 flex flex-col items-center">
                                <h2 className="text-3xl font-black text-[#d4af37] mb-6 uppercase tracking-widest">Blocked Locations</h2>
                                
                                {disabledLocations.length > 0 ? (
                                    <div className="flex flex-col items-center gap-2 mb-8">
                                        {disabledLocations.map(locId => {
                                            const locName = LOCATIONS.find(l => l.id === locId)?.name || locId;
                                            const disablingCard = actionDiscardPile.find(c => c.disables === locId);
                                            const reason = disablingCard ? `${disablingCard.title}` : `${locName} is Under Construction`;
                                            return (
                                                <p key={locId} className="text-white text-xl font-rajdhani uppercase tracking-wider text-center">
                                                    <span className="text-[#d4af37] font-bold">{locName}</span> will not work this turn, <br/>
                                                    <span className="text-white/40 text-sm">because of the {reason}.</span>
                                                </p>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-white/50 text-xl font-rajdhani mb-8">No locations blocked this turn.</p>
                                )}

                                <button
                                    onClick={commitTurn}
                                    disabled={isWaitingForPlayers || (game?.isTest && !opponentsReady)}
                                    className={`px-12 py-4 font-bold uppercase tracking-widest rounded-lg transition-all transform hover:scale-105 ${
                                        (isWaitingForPlayers || (game?.isTest && !opponentsReady))
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500'
                                            : 'bg-gradient-to-r from-[#d4af37] to-[#f3bd48] text-black hover:from-[#ffe066] hover:to-[#ffd700]'
                                    }`}
                                >
                                    {(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? "WAITING FOR OTHERS..." : "Get It!"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Relocation Waiting/Non-Acting Overlay */}
                    {phase === 3 && p3Step === 2 && (relocationCardsCount === 0 || (isWaitingForPlayers && !playerConflictContext)) && (
                        <div className="absolute inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
                            <div className="relative w-[500px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-2xl p-12 flex flex-col items-center">
                                <h2 className="text-3xl font-black text-[#d4af37] mb-6 uppercase tracking-widest text-center">
                                    {isWaitingForPlayers ? "Conflict Resolution" : "Relocation Stage"}
                                </h2>
                                
                                <p className="text-white text-2xl font-rajdhani text-center mb-10 animate-pulse">
                                    {isWaitingForPlayers ? "Waiting for the Conflict Resolution..." : "Waiting for the Relocation..."}
                                </p>

                                <div className="w-16 h-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mb-10" />

                                {/* Backup Escape Button: Only show if opponents are ready or after 5 seconds of waiting */}
                                {opponentsReady && (
                                    <button 
                                        onClick={() => handleNextPhaseWrapper()}
                                        className="px-8 py-3 bg-[#d4af37] text-black font-black rounded-xl uppercase tracking-widest hover:bg-[#ffe066] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                    >
                                        Get It!
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Step 2: Relocation Results Overlay */}
                    {phase === 3 && p3Step === 2 && relocResults && (
                        <div className="absolute inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto">
                            <div className="relative w-[600px] bg-[#0d0d12] border-2 border-[#d4af37] rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.3)] p-10 flex flex-col items-center">
                                <h2 className="text-4xl font-black text-[#d4af37] mb-8 uppercase tracking-[0.3em] font-rajdhani">Relocation Report</h2>
                                
                                <div className="w-full flex flex-col gap-4 mb-10">
                                    {relocResults.map((res, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-[#d4af37] uppercase font-bold tracking-widest">{res.pName} moved</span>
                                                <span className="text-white font-rajdhani text-xl font-bold">
                                                    {res.ownerName} {placedActors.find(a => a.actorId === res.actorId)?.actorType.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-white/40 text-sm font-bold">{LOCATIONS.find(l => l.id === res.fromLocId)?.name}</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                                                </svg>
                                                <span className="text-[#d4af37] text-xl font-black">{LOCATIONS.find(l => l.id === res.toLocId)?.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-white/40 text-[10px] uppercase font-bold tracking-[0.5em] animate-pulse">
                                    Syncing New State...
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Step 3: Change Values - Waiting Overlay for Idle Players */}
                    {phase === 3 && p3Step === 3 && exchangeCardsCount === 0 && (
                        <div className="absolute inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
                            <div className="relative w-[500px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-2xl p-12 flex flex-col items-center">
                                <h2 className="text-3xl font-black text-[#d4af37] mb-6 uppercase tracking-widest text-center">Change Values</h2>
                                <p className="text-white text-2xl font-rajdhani text-center mb-10 animate-pulse">Waiting for Values Exchange...</p>
                                <div className="w-16 h-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Change Values - Action Selection Board */}
                    {phase === 3 && p3Step === 3 && exchangeCardsCount > 0 && !exchangeDone && (
                        <div className="absolute inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
                            <div className="relative w-[600px] bg-[#0d0d12] border-2 border-[#d4af37] rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.2)] p-10 flex flex-col items-center animate-in zoom-in duration-300">
                                <h2 className="text-3xl font-black text-[#d4af37] mb-2 uppercase tracking-widest font-rajdhani">Change Values</h2>
                                <p className="text-white/60 text-sm mb-8 uppercase tracking-[0.2em]">
                                    {exchangeStep === 0 ? "Select a card to play" : 
                                     exchangeStep === 1 ? "Choose one of your values to give" : 
                                     "Choose an opponent's value to take"}
                                </p>

                                <div className="w-full flex flex-col gap-8">
                                    {/* Modal Step 1: My Values */}
                                    {exchangeStep === 1 && (
                                        <div className="flex justify-center gap-6">
                                            {['power', 'knowledge', 'art'].map(res => {
                                                const val = resources[res as keyof typeof resources] || 0;
                                                const isSelected = exchangeSourceValue === res;
                                                return (
                                                    <button
                                                        key={res}
                                                        disabled={val <= 0}
                                                        onClick={() => setExchangeSourceValue(res as any)}
                                                        className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${
                                                            val <= 0 ? 'opacity-30 grayscale cursor-not-allowed' : 
                                                            isSelected ? 'bg-[#d4af37] border-[#ffe066] scale-110 shadow-[0_0_30px_#d4af37]' : 
                                                            'bg-white/5 border-white/10 hover:border-[#d4af37]/50'
                                                        }`}
                                                    >
                                                        <Image src={res === 'knowledge' ? '/intangibles/resource_wisdom.png' : res === 'art' ? '/intangibles/resource_Art.png' : `/intangibles/resource_${res}.png`} width={48} height={48} alt={res} />
                                                        <span className={`mt-3 font-bold uppercase ${isSelected ? 'text-black' : 'text-white'}`}>{res}</span>
                                                        <span className={`text-xl font-black ${isSelected ? 'text-black' : 'text-[#d4af37]'}`}>{val}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Modal Step 2: Opponent Values */}
                                    {exchangeStep === 2 && (
                                        <div className="flex flex-col gap-6">
                                            {dynamicPlayers.filter(p => p.id !== localPlayerId).map(p => {
                                                const oppRes = opponentsData[p.id]?.resources || {};
                                                return (
                                                    <div key={p.id} className="flex flex-col gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <div className="flex items-center gap-3">
                                                            <Image src={p.avatar} width={32} height={32} className="rounded-full border border-[#d4af37]" alt={p.name} />
                                                            <span className="text-white font-bold uppercase text-xs">{p.name}</span>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            {['power', 'knowledge', 'art'].map(res => {
                                                                const val = oppRes[res as keyof typeof oppRes] || 0;
                                                                const isSelected = exchangeTargetPlayer === p.id && exchangeTargetValue === res;
                                                                return (
                                                                    <button
                                                                        key={res}
                                                                        disabled={val <= 0}
                                                                        onClick={() => {
                                                                            setExchangeTargetPlayer(p.id);
                                                                            setExchangeTargetValue(res as any);
                                                                        }}
                                                                        className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                                                            val <= 0 ? 'opacity-30 grayscale cursor-not-allowed' : 
                                                                            isSelected ? 'bg-[#d4af37] border-[#ffe066] scale-105' : 
                                                                            'bg-black/40 border-white/10 hover:border-[#d4af37]/30'
                                                                        }`}
                                                                    >
                                                                        <Image src={res === 'knowledge' ? '/intangibles/resource_wisdom.png' : res === 'art' ? '/intangibles/resource_Art.png' : `/intangibles/resource_${res}.png`} width={20} height={20} alt={res} />
                                                                        <span className={`text-sm font-bold ${isSelected ? 'text-black' : 'text-white'}`}>{val}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10 flex gap-4">
                                    {!hasExchangeableValues ? (
                                        <div className="flex flex-col items-center gap-6 p-8 bg-red-500/10 border border-red-500/30 rounded-2xl w-full">
                                            <p className="text-white text-xl font-bold text-center">
                                                You have no Values for exchange.<br/>
                                                <span className="text-red-400 text-sm font-normal uppercase tracking-widest font-bold">Change Values cards are returned to your hand.</span>
                                            </p>
                                            <button
                                                onClick={() => {
                                                    addLog("No values to exchange. Change Values cards returned to hand.");
                                                    handleNextPhaseWrapper();
                                                }}
                                                className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                            >
                                                Get It!
                                            </button>
                                        </div>
                                    ) : !hasOpponentExchangeableValues ? (
                                        <div className="flex flex-col items-center gap-6 p-8 bg-red-500/10 border border-red-500/30 rounded-2xl w-full">
                                            <p className="text-white text-xl font-bold text-center">
                                                Opponents have no Values for exchange.<br/>
                                                <span className="text-red-400 text-sm font-normal uppercase tracking-widest font-bold">Change Values card is returned to your hand.</span>
                                            </p>
                                            <button
                                                onClick={() => {
                                                    addLog("Opponents have no values to exchange. Change Values card returned to hand.");
                                                    handleNextPhaseWrapper();
                                                }}
                                                className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                            >
                                                Get It!
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {exchangeStep === 1 && (
                                                <button
                                                    disabled={!exchangeSourceValue}
                                                    onClick={() => setExchangeStep(2)}
                                                    className="px-12 py-4 bg-gradient-to-r from-[#d4af37] to-[#f3bd48] text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 disabled:grayscale disabled:opacity-50 transition-all font-rajdhani"
                                                >
                                                    Choose Value
                                                </button>
                                            )}
                                            {exchangeStep === 2 && (
                                                <>
                                                    <button onClick={() => setExchangeStep(1)} className="px-8 py-4 border border-white/20 text-white font-bold uppercase rounded-xl hover:bg-white/5 font-rajdhani">Back</button>
                                                    <button
                                                        disabled={!exchangeTargetValue || !exchangeTargetPlayer}
                                                        onClick={commitTurn}
                                                        className="px-12 py-4 bg-gradient-to-r from-[#d4af37] to-[#f3bd48] text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 disabled:grayscale disabled:opacity-50 transition-all font-rajdhani"
                                                    >
                                                        Change Values
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Step 3: Change Values - Results Summary Overlay */}
                    {phase === 3 && p3Step === 3 && exchangeResults && (
                        <div className="absolute inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto">
                            <div className="relative w-[600px] bg-[#0d0d12] border-2 border-[#d4af37] rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.3)] p-10 flex flex-col items-center">
                                <h2 className="text-4xl font-black text-[#d4af37] mb-8 uppercase tracking-[0.3em] font-rajdhani">Exchange Report</h2>
                                
                                <div className="w-full flex flex-col gap-4 mb-10">
                                    {exchangeResults.map((res, i) => (
                                        <div key={i} className="flex flex-col p-6 bg-white/5 rounded-2xl border border-white/10 gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[#d4af37] font-bold text-xs uppercase tracking-widest">{res.pName}</span>
                                                    <span className="text-white/40 text-[10px] uppercase">Gives</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white/40 text-[10px] uppercase">Takes</span>
                                                    <span className="text-[#d4af37] font-bold text-xs uppercase tracking-widest">{res.pName}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Image src={res.sourceVal === 'knowledge' ? '/intangibles/resource_wisdom.png' : res.sourceVal === 'art' ? '/intangibles/resource_Art.png' : `/intangibles/resource_${res.sourceVal}.png`} width={32} height={32} alt={res.sourceVal} />
                                                    <span className="text-white font-black text-xl">{res.sourceVal.toUpperCase()}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M7 10l5 5 5-5"/>
                                                        <path d="M17 14l-5-5-5 5"/>
                                                    </svg>
                                                    <span className="text-[8px] text-[#d4af37] font-bold uppercase tracking-tighter">EXCHANGED</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white font-black text-xl">{res.targetVal.toUpperCase()}</span>
                                                    <Image src={res.targetVal === 'knowledge' ? '/intangibles/resource_wisdom.png' : res.targetVal === 'art' ? '/intangibles/resource_Art.png' : `/intangibles/resource_${res.targetVal}.png`} width={32} height={32} alt={res.targetVal} />
                                                </div>
                                            </div>
                                            <div className="text-center text-white/20 text-[10px] uppercase tracking-widest font-bold">
                                                Target: {res.targetName}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-white/40 text-[10px] uppercase font-bold tracking-[0.5em] animate-pulse">
                                    Finalizing Action Phase...
                                </div>
                            </div>
                        </div>
                    )}
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
                                game={game}
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
                                game={game}
                                conflict={eventTieBreakerActive.conflict}
                                onResolve={(result) => handleEventTieBreakerResolve(result)}
                                onClose={() => { setEventTieBreakerActive(null); closeEvent(); }}
                                hasNextConflict={false}
                            />
                        </div>
                    )}


                    {/* Top Center: Resources (Layered ABOVE Header) */}
                    <GameResources 
                        resources={resources} 
                        victoryPoints={victoryPoints} 
                        isStep3={phase === 3 && p3Step === 3}
                        exchangeStep={exchangeStep}
                        onResourceClick={(res) => {
                            if (exchangeStep === 1) {
                                setExchangeSourceValue(res);
                                setExchangeStep(2);
                                addLog(`Selected ${res.toUpperCase()} for exchange. Choose an opponent's value.`);
                            }
                        }}
                    />

                    {/* Top Left: New Players Panel (SVG) */}
                    <NewPlayersPanel
                        players={dynamicPlayers}
                        p3Step={p3Step}
                        availableExchangeCards={exchangeCardsCount}
                        exchangeStep={exchangeStep}
                        opponentsData={opponentsData}
                        onOpponentResourceClick={(id, res) => {
                            if (exchangeStep === 2) {
                                setExchangeTargetPlayer(id);
                                setExchangeTargetValue(res);
                                addLog(`Target set: ${opponentsData[id]?.name}'s ${res.toUpperCase()}. Click 'Submit Exchange' to confirm.`);
                            }
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

                    {/* Game Over / Tie-Breaker Screen - Top Level Overlay */}
                    {(isGameOver || isTieBreakerScreen) && (() => {
                        const playersWithVP = isTieBreakerScreen ? 
                            dynamicPlayers.map(p => ({
                                ...p,
                                finalVP: tieWinners.find(w => w.id === p.id)?.vp || calculateVictoryPoints( (p.id === localPlayerId ? resources : (opponentsData[p.id]?.resources || {})) as any),
                                isMain: p.id === localPlayerId,
                                isTied: tieWinners.some(w => w.id === p.id)
                            })) :
                            dynamicPlayers.map((p) => {
                                const isMain = p.id === localPlayerId;
                                const res = isMain ? resources : (opponentsData[p.id]?.resources || {});
                                const finalVP = calculateVictoryPoints(res as any);
                                return { ...p, finalVP, isMain, isTied: false };
                            });

                        const maxVP = isTieBreakerScreen ? (tieWinners[0]?.vp || 0) : Math.max(...playersWithVP.map(p => p.finalVP));
                        const localPlayerResults = playersWithVP.find(p => p.isMain);
                        const playerWon = localPlayerResults && localPlayerResults.finalVP === maxVP;

                        return (
                            <div className="absolute inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-1000">
                                <div className="flex flex-col items-center gap-10 p-16 border-[3px] border-[#d4af37]/50 bg-gradient-to-b from-[#1a1a24] to-[#0d0d12] rounded-[3rem] shadow-[0_0_150px_rgba(212,175,55,0.2)]">
                                    <div className="text-center relative">
                                        <h1 className={`text-8xl font-black uppercase tracking-[0.2em] animate-in slide-in-from-bottom-5 duration-700 ${playerWon ? 'text-[#d4af37] drop-shadow-[0_0_40px_rgba(212,175,55,0.8)]' : 'text-red-500 drop-shadow-[0_0_40px_rgba(255,0,0,0.8)]'}`}>
                                            {isTieBreakerScreen ? "POTENTIAL WINNER" : (playerWon ? 'VICTORY' : 'DEFEAT')}
                                        </h1>
                                        <p className="text-white/50 text-xl font-rajdhani uppercase tracking-[0.4em] mt-4">
                                            {isTieBreakerScreen ? "TIE DETECTED — SURVIVAL CONTINUES" : "Simulation Concluded"}
                                        </p>
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

                                    <div className="flex gap-6 mt-10">
                                        {!isTieBreakerScreen ? (
                                            <button 
                                                onClick={() => router.push('/')}
                                                className="px-16 py-5 bg-[#d4af37] text-black text-2xl font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-[#ffe066] transition-all transform hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(212,175,55,0.3)]"
                                            >
                                                Good Game
                                            </button>
                                        ) : (
                                            <>
                                                {localPlayerResults?.isTied ? (
                                                    <button 
                                                        disabled={isWaitingForTieBreaker}
                                                        onClick={handleContinueTieBreaker}
                                                        className={`px-24 py-6 text-2xl font-black rounded-2xl uppercase tracking-[0.2em] transition-all transform hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(212,175,55,0.3)] ${
                                                            isWaitingForTieBreaker ? 'bg-white/10 text-white/40 cursor-wait' : 'bg-[#d4af37] text-black hover:bg-[#ffe066]'
                                                        }`}
                                                    >
                                                        {isWaitingForTieBreaker ? 'Waiting for Others...' : 'Continue'}
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => router.push('/')}
                                                        className="px-16 py-5 bg-red-500/20 text-red-500 border-2 border-red-500/50 text-2xl font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                                                    >
                                                        Good Game
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Bottom Right: Next Phase Button */}
                    <div className="absolute bottom-10 right-10 z-[300] pointer-events-auto">
                        {/* Only show Next Phase if not in Phase 2 OR if all actors distributed. And in Phase 4, only if all player conflicts are resolved. HIDE if game is over. */}
                        {!isGameOver && ((phase !== 2 || availableActors.length === 0) && (phase !== 4 || stickyConflicts.filter(c => c.hasPlayer && !resolvedConflicts.includes(c.locId)).length === 0)) && (
                            <button
                                onClick={(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? undefined : commitTurn}
                                disabled={isWaitingForPlayers || (game?.isTest && !opponentsReady)}
                                className={`px-8 py-3 font-bold rounded-lg uppercase tracking-widest text-xs transition-all ${(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500' : 'bg-[#d4af37] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#ffe066] transform hover:scale-105 active:scale-95'}`}
                            >
                                {(isWaitingForPlayers || (game?.isTest && !opponentsReady)) ? "WAITING FOR OTHERS..." :
                                    phase === 3 ? (
                                        p3Step === 0
                                            ? (actionHand.length === 0 ? "Play No Cards" : "Commit Action Cards")
                                            : p3Step === 1
                                                ? (p3Step1Ready ? "Waiting for others..." : "Get It!")
                                                : p3Step === 2
                                                ? (relocationCardsCount > 0 ? "Submit Relocation" : "Done Relocation")
                                                : p3Step === 3
                                                ? (exchangeCardsCount > 0 ? (exchangeStep === 2 && exchangeTargetValue ? "Submit Exchange" : "Exchange Values") : "Done Exchange")
                                                : "Next Phase"
                                    ) : phase === 5 ? "Finish Phase" : "Next Phase"}
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




                    {/* --- Phase 1: Event Modal --- */}
                    {
                        phase === 1 && !currentEvent && (game.gameState?.eventDeck || []).length === 0 && (
                            <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
                                <div className="relative w-[600px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-2xl p-10 flex flex-col items-center">
                                    <h2 className="text-3xl font-black text-[#d4af37] mb-6 uppercase tracking-widest">End of Era</h2>
                                    <p className="text-white text-xl text-center mb-8 font-rajdhani">There is no more Events in this game.</p>
                                    <button
                                        onClick={commitTurn}
                                        className="px-12 py-4 bg-[#d4af37] text-black font-bold uppercase tracking-widest rounded-lg hover:bg-[#ffe066] transition-all"
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            </div>
                        )
                    }
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

                {/* Player Conflict Modal (Relocation) */}
                {playerConflictContext && (
                    <div className="absolute inset-0 z-[400] pointer-events-auto">
                        <div className="bg-[#171B21] border-2 border-[#d4af37] p-8 rounded-3xl flex flex-col items-center max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                            <ConflictResolutionView
                                game={game}
                                conflict={{
                                    locId: playerConflictContext.actorId, // Use actorId as key for reloc conflicts
                                    locationName: "Relocation Conflict",
                                    playerActor: {
                                        id: localPlayerId,
                                        type: playerConflictContext.moves.find(m => m.playerId === localPlayerId)?.choice || 'rock'
                                    },
                                    opponents: playerConflictContext.moves.filter(m => m.playerId !== localPlayerId).map(m => ({
                                        actorId: m.playerId,
                                        name: dynamicPlayers.find(p => p.id === m.playerId)?.name || 'Opponent',
                                        avatar: dynamicPlayers.find(p => p.id === m.playerId)?.avatar || '/avatars/golden_avatar.png',
                                        actorType: 'player',
                                        type: m.choice || 'rock'
                                    })),
                                    resourceType: 'relocation'
                                }}
                                onResolve={(result) => {
                                    if (!playerConflictContext) return;
                                    const winnerId = result.winnerId;
                                    const winner = playerConflictContext.moves.find(m => m.playerId === winnerId);
                                    setPendingRelocations(prev => {
                                        const others = prev.filter(r => r.actorId !== playerConflictContext.actorId);
                                        if (winner) return [...others, { playerId: winner.playerId, actorId: playerConflictContext.actorId, targetLocId: winner.targetLocId }];
                                        return others; 
                                    });
                                    setPlayerConflictContext(null);
                                    setTimeout(() => resolveActionRelocations(), 500);
                                }}
                                onClose={() => setPlayerConflictContext(null)}
                                hasNextConflict={false}
                            />
                        </div>
                    </div>
                )}

                {/* --- Inventory & Stats Trigger --- */}
                <div className="fixed bottom-10 left-10 z-[300] pointer-events-auto">
                    <button
                        onClick={() => setIsInventoryOpen(true)}
                        className="group flex items-center gap-4 px-6 py-3 bg-black/40 border border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                    >
                        <Briefcase size={20} className="text-[#d4af37] group-hover:animate-bounce" />
                        <span className="font-rajdhani font-bold uppercase tracking-[0.2em] text-xs text-white/70 group-hover:text-[#d4af37]">Inventory & Stats</span>
                    </button>
                </div>

                {/* --- Inventory & Stats Modal --- */}
                <InventoryStatsModal
                    isOpen={isInventoryOpen}
                    onClose={() => setIsInventoryOpen(false)}
                    actionHand={actionHand}
                    players={dynamicPlayers}
                    localPlayerId={localPlayerId}
                    resources={resources}
                    victoryPoints={victoryPoints}
                    opponentsData={opponentsData}
                    actionDiscardPile={actionDiscardPile}
                />

                {/* Action Phase Summary Overlay */}
                {phase === 3 && p3Step === 4 && (
                    <div className="absolute inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
                        <div className="relative w-[500px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-2xl p-8 flex flex-col items-center">
                            <h2 className="text-3xl font-black text-[#d4af37] mb-6 uppercase tracking-widest">Action Phase Summary</h2>
                            
                            {(() => {
                                const playerHasAction = Object.values(selectedActionCards).some(c => c > 0);
                                const botsHaveAction = Object.values(botActionCommitsRef.current || {}).some(steps => steps.length > 0);
                                
                                return (!playerHasAction && !botsHaveAction) ? (
                                    <p className="text-white text-xl text-center mb-8 font-rajdhani">No Actions this turn.</p>
                                ) : (
                                    <p className="text-white text-xl text-center mb-8 font-rajdhani">Actions concluded.</p>
                                );
                            })()}

                            <button
                                onClick={() => handleNextPhaseWrapper(true)}
                                className="px-12 py-4 bg-gradient-to-r from-[#d4af37] to-[#f3bd48] text-black font-bold uppercase tracking-widest rounded-lg hover:from-[#ffe066] hover:to-[#ffd700] transition-all transform hover:scale-105"
                            >
                                Get It!
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </TooltipProvider>
    );
}
