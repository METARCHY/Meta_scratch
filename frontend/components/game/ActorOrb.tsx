"use client";

import React from 'react';
import Image from 'next/image';
import { useTooltip } from '@/context/TooltipContext';

interface ActorOrbProps {
    actor: { id: string; avatar: string; headAvatar?: string; name: string; type: string };
    isSelected: boolean;
    onSelect: () => void;
    onHover?: () => void;
    onLeave?: () => void;
}

export default function ActorOrb({ actor, isSelected, onSelect, onHover, onLeave }: ActorOrbProps) {
    const { showTooltip, hideTooltip } = useTooltip();

    const handleEnter = () => {
        showTooltip(actor.type);
        onHover?.();
    };

    const handleLeave = () => {
        hideTooltip();
        onLeave?.();
    };

    return (
        <div
            className={`relative w-[145px] h-[145px] cursor-pointer transition-transform duration-300 group ${isSelected ? 'scale-110 drop-shadow-[0_0_15px_#d4af37]' : 'hover:scale-105'}`}
            onClick={onSelect}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            {/* Layer 0: Background Fill Check */}
            <svg width="145" height="145" viewBox="0 0 145 145" fill="none" className="absolute inset-0 z-0 pointer-events-none">
                <path d="M72.1867 143.873C111.778 143.873 143.873 111.778 143.873 72.1867C143.873 32.5952 111.778 0.5 72.1867 0.5C32.5952 0.5 0.5 32.5952 0.5 72.1867C0.5 111.778 32.5952 143.873 72.1867 143.873Z" fill="#23262D" fillOpacity="0.8" />
            </svg>

            {/* Layer 1: Avatar Image (Masked) */}
            <div
                className="absolute z-10 rounded-full overflow-hidden"
                style={{
                    left: '16px',
                    top: '16px',
                    width: '112px',
                    height: '112px',
                    backgroundColor: '#1a1a1c'
                }}
            >
                <Image
                    src={actor.headAvatar || actor.avatar}
                    fill
                    className="object-cover"
                    alt={actor.name}
                />
            </div>

            {/* Layer 2: Foreground Rings/Borders */}
            <svg width="145" height="145" viewBox="0 0 145 145" fill="none" className="absolute inset-0 z-20 pointer-events-none">
                <path d="M72.187 130.628C104.464 130.628 130.629 104.463 130.629 72.1865C130.629 39.91 104.464 13.7446 72.187 13.7446C39.9104 13.7446 13.7451 39.91 13.7451 72.1865C13.7451 104.463 39.9104 130.628 72.187 130.628Z" stroke="#A08C5C" strokeWidth="2" strokeMiterlimit="10" />
                <path d="M72.1867 135.381C107.088 135.381 135.381 107.088 135.381 72.1867C135.381 37.2853 107.088 8.99219 72.1867 8.99219C37.2853 8.99219 8.99219 37.2853 8.99219 72.1867C8.99219 107.088 37.2853 135.381 72.1867 135.381Z" stroke="#A08C5C" strokeMiterlimit="10" />
                <path d="M72.1867 143.873C111.778 143.873 143.873 111.778 143.873 72.1867C143.873 32.5952 111.778 0.5 72.1867 0.5C32.5952 0.5 0.5 32.5952 0.5 72.1867C0.5 111.778 32.5952 143.873 72.1867 143.873Z" stroke="#A08C5C" strokeMiterlimit="10" />
            </svg>
        </div>
    );
}
