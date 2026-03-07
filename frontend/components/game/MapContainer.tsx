"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Box, Zap, Recycle } from 'lucide-react';
import { LOCATIONS, ALLOWED_MOVES } from '@/data/gameConstants';
import PlacedActorMarker from './PlacedActorMarker';
import OtherPlayerActorMarker from './OtherPlayerActorMarker';
import { useTooltip } from '@/context/TooltipContext';
import citizensData from '@/data/citizens.json';
const CITIZENS = citizensData as any[]; // Type assertion for simple usage

interface MapContainerProps {
    phase: number;
    p3Step?: number;
    placedActors: any[];
    selectedActorId: string | null;
    hoveredActorId: string | null;
    disabledLocations: string[];
    relocationSource: string | null;
    selectedHex: string | null;
    playerActorsV2: any[];
    players: any[];
    availableRelocationCards?: number;
    availableExchangeCards?: number;
    localPlayerId: string;
    onHexClick: (locId: string) => void;
    onPlayerClick: (actor: any, event: React.MouseEvent) => void;
}

const ACTOR_AVATARS: { [key: string]: string } = {
    "politician": "/actors/actor_scientist.png",
    "robot": "/actors/actor_politician.png",
    "scientist": "/actors/actor_robot.png",
    "artist": "/actors/actor_artist.png"
};



export default function MapContainer({
    phase,
    p3Step,
    placedActors,
    selectedActorId,
    hoveredActorId,
    disabledLocations,
    relocationSource,
    selectedHex,
    playerActorsV2,
    players,
    availableRelocationCards,
    availableExchangeCards,
    localPlayerId,
    onHexClick,
    onPlayerClick
}: MapContainerProps) {
    const [scale, setScale] = useState(0.7);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredLocId, setHoveredLocId] = useState<string | null>(null);
    const { showTooltip, hideTooltip } = useTooltip();

    // Zoom Compensation logic: keep HUD size constant as seen in Phase 2
    const BASE_ZOOM = 0.7;
    const currentZoomFactor = phase >= 3 ? 1.6 : 0.7;
    const hudScale = BASE_ZOOM / currentZoomFactor;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const updateScale = () => {
                const baseScale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                setScale(baseScale * currentZoomFactor);
            };
            updateScale();
            window.addEventListener('resize', updateScale);
            return () => window.removeEventListener('resize', updateScale);
        }
    }, [phase, currentZoomFactor]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const activeActorId = relocationSource || hoveredActorId || selectedActorId;
    const activeActor = activeActorId ? playerActorsV2.find(a => a.id === activeActorId) : null;
    const validLocs = activeActor ? ALLOWED_MOVES[activeActor.type] || [] : [];

    return (
        <div
            className={`absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Background Map Layer */}
            <div className={`absolute inset-0 bg-[#0a0a10] bg-[url('/map/game_map_v2.jpg')] bg-cover bg-center transition-all duration-1000 ${phase >= 4 ? 'blur-sm brightness-50' : ''}`} />
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            {/* Virtual Canvas for Fixed 1080p Positioning */}
            <div
                className={`absolute top-1/2 left-1/2 w-[1920px] h-[1080px] origin-center ${isDragging ? '' : 'transition-transform duration-1000 ease-in-out'}`}
                style={{
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`
                }}
            >
                {LOCATIONS.map(loc => {
                    const actorsHere = placedActors.filter(p => p.locId === loc.id);
                    const isHintVisible = validLocs.includes(loc.id);

                    return (
                        <div
                            key={loc.id}
                            className="absolute pointer-events-none transition-all group/loc"
                            style={{
                                left: `${loc.x}px`,
                                top: `${loc.y}px`,
                                width: `${loc.width}px`,
                                height: `${loc.height}px`,
                            }}
                        >
                            {/* Location Image */}
                            <Image
                                src={loc.image}
                                fill
                                style={{ objectFit: 'contain' }}
                                priority
                                className={`transition-all ${disabledLocations.includes(loc.id) ? "grayscale brightness-50" : ""} ${selectedHex === loc.id ? 'brightness-125 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]' : ''}`}
                                alt={loc.name}
                            />

                            {/* Circular Hover Zone (Radius 138px -> 276px diameter) */}
                            {/* Centered in the 718x598 container */}
                            <div
                                className={`absolute z-10 rounded-full transition-all pointer-events-auto ${isHintVisible ? 'cursor-pointer' : 'cursor-default'}`}
                                style={{
                                    left: '221px', // (718-276)/2
                                    top: '161px',  // (598-276)/2
                                    width: '276px',
                                    height: '276px',
                                }}
                                onMouseEnter={() => {
                                    if (isHintVisible) setHoveredLocId(loc.id);
                                    showTooltip(loc.name);
                                }}
                                onMouseLeave={() => {
                                    setHoveredLocId(null);
                                    hideTooltip();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isHintVisible) {
                                        onHexClick(loc.id);
                                    }
                                }}
                            />

                            {/* Hint Overlay (Controlled by Actor Interaction) */}
                            {loc.hint && (
                                <Image
                                    src={loc.hint}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className={`transition-opacity duration-500 pointer-events-none ${isHintVisible ? 'opacity-100' : 'opacity-0'}`}
                                    alt="hint"
                                />
                            )}

                            {/* Active Hint Layer (Visible on hover/click if valid) */}
                            {loc.activeHint && (
                                <Image
                                    src={loc.activeHint}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className={`transition-opacity duration-500 pointer-events-none ${(hoveredLocId === loc.id || selectedHex === loc.id) && isHintVisible ? 'opacity-100' : 'opacity-0'}`}
                                    alt="active hint"
                                />
                            )}

                        </div>
                    );
                })}

                {/* Actors Layer - Rendered AFTER locations to ensure z-index priority */}
                {LOCATIONS.map(loc => {
                    const actorsHere = placedActors.filter(p => p.locId === loc.id);
                    if (actorsHere.length === 0) return null;

                    return (
                        <div
                            key={`${loc.id}-actors`}
                            className="absolute pointer-events-none"
                            style={{
                                left: `${loc.x}px`,
                                top: `${loc.y}px`,
                                width: `${loc.width}px`,
                                height: `${loc.height}px`,
                                zIndex: 100 // Force on top
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                {actorsHere.map((a, i) => {
                                    const isVisible = a.playerId === localPlayerId || phase >= 3;
                                    if (!isVisible) return null;

                                    // Resolve full actor details
                                    const actorDetails = playerActorsV2.find(origin => origin.id === a.actorId) || { ...a, type: a.actorType || a.type };
                                    const token = a.type !== actorDetails.type ? a.type : undefined;

                                    // Centered Spread Logic
                                    const spread = 100;
                                    const startX = -((actorsHere.length - 1) * spread) / 2;
                                    const currentX = startX + (i * spread);
                                    const baseSlotY = phase >= 3 ? -4 : -34;
                                    const opponentYOffset = a.playerId !== 'p1' ? -80 : 0;
                                    const finalY = baseSlotY + opponentYOffset;

                                    // Opponent Marker 
                                    if (a.playerId !== localPlayerId) {
                                        const opponent = players.find(p => p.id === a.playerId);
                                        const playerAvatar = opponent?.avatar || "";

                                        return (
                                            <div
                                                key={i}
                                                className="absolute pointer-events-auto transition-all duration-700"
                                                style={{
                                                    transform: `translateX(${currentX}px) translateY(${finalY}px)`,
                                                }}
                                            >
                                                <OtherPlayerActorMarker
                                                    actor={{ ...actorDetails, type: actorDetails.type }}
                                                    playerAvatar={playerAvatar}
                                                    bid={phase >= 4 ? a.bid : undefined}
                                                    hasSecretBid={(phase === 2 || phase === 3) && !!a.bid}
                                                    isDisabled={disabledLocations.includes(loc.id)}
                                                    phase={phase}
                                                    p3Step={p3Step}
                                                    availableExchangeCards={availableExchangeCards}
                                                    hudScale={hudScale}
                                                    onClick={(e) => { e.stopPropagation(); onPlayerClick(a, e) }}
                                                />
                                            </div>
                                        );
                                    }

                                    // My Marker
                                    return (
                                        <div
                                            key={i}
                                            className="absolute pointer-events-auto transition-all duration-700"
                                            style={{
                                                transform: `translateX(${currentX}px) translateY(${finalY}px)`,
                                            }}
                                        >

                                            <PlacedActorMarker
                                                actor={{ ...actorDetails, type: actorDetails.type }}
                                                token={token}
                                                bid={a.bid}
                                                isP1={true}
                                                isRelocating={relocationSource === a.actorId}
                                                isDisabled={disabledLocations.includes(loc.id)}
                                                phase={phase}
                                                p3Step={p3Step}
                                                availableRelocationCards={availableRelocationCards}
                                                hudScale={hudScale}
                                                onClick={(e) => { e.stopPropagation(); onPlayerClick(a, e) }}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
