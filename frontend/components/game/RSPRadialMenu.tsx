"use client";

import React from 'react';
import Image from 'next/image';

interface RSPRadialMenuProps {
    actor: { name: string, avatar: string, headAvatar?: string, type: string } | null;
    usedTokens?: string[];
    onSelect: (token: string) => void;
    onCancel: () => void;
}

const allOptions = [
    { id: 'rock', icon: '/tokens/rsp_rock.png', x: 43, y: 25 },
    { id: 'paper', icon: '/tokens/rsp_paper.png', x: 25, y: 84 },
    { id: 'scissors', icon: '/tokens/rsp_scissors.png', x: 37, y: 146 },
    { id: 'dummy', icon: '/tokens/rsp_dummy.png', x: 87, y: 186 }
];

export default function RSPRadialMenu({ actor, usedTokens = [], onSelect, onCancel }: RSPRadialMenuProps) {
    if (!actor) return null;

    const options = allOptions.filter(opt => !usedTokens.includes(opt.id));

    return (
        <div className="relative w-[204px] h-[211px] select-none scale-90">
            {/* Layer 0: Background Fill */}
            <svg width="204" height="211" viewBox="0 0 204 211" fill="none" className="absolute inset-0 z-0 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <path d="M131.687 159.373C171.278 159.373 203.373 127.278 203.373 87.6867C203.373 48.0952 171.278 16 131.687 16C92.0952 16 60 48.0952 60 87.6867C60 127.278 92.0952 159.373 131.687 159.373Z" fill="#23262D" fillOpacity="0.8" />
            </svg>

            {/* Layer 1: Actor Avatar */}
            <div
                className="absolute z-10 rounded-full overflow-hidden border-2 border-[#d4af37] shadow-inner"
                style={{ left: '75px', top: '31px', width: '113px', height: '113px' }}
            >
                <Image
                    src={actor.headAvatar || actor.avatar}
                    alt={actor.name}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Layer 2: Foreground Strokes */}
            <svg width="204" height="211" viewBox="0 0 204 211" fill="none" className="absolute inset-0 z-20 pointer-events-none">
                <path d="M131.687 146.128C163.964 146.128 190.129 119.963 190.129 87.6865C190.129 55.41 163.964 29.2446 131.687 29.2446C99.4104 29.2446 73.2451 55.41 73.2451 87.6865C73.2451 119.963 99.4104 146.128 131.687 146.128Z" stroke="#A08C5C" strokeWidth="2" strokeMiterlimit="10" />
                <path d="M131.687 150.881C166.588 150.881 194.881 122.588 194.881 87.6867C194.881 52.7853 166.588 24.4922 131.687 24.4922C96.7853 24.4922 68.4922 52.7853 68.4922 87.6867C68.4922 122.588 96.7853 150.881 131.687 150.881Z" stroke="#A08C5C" strokeMiterlimit="10" />
                <path d="M131.687 159.373C171.278 159.373 203.373 127.278 203.373 87.6867C203.373 48.0952 171.278 16 131.687 16C92.0952 16 60 48.0952 60 87.6867C60 127.278 92.0952 159.373 131.687 159.373Z" stroke="#A08C5C" strokeMiterlimit="10" />
            </svg>

            {/* RSP Options (Red Circles) */}
            {options.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => onSelect(opt.id)}
                    className="absolute z-20 w-[49px] h-[49px] -ml-[24.5px] -mt-[24.5px] rounded-full bg-[#1a1a1c]/40 border border-[#d4af37]/50 hover:border-[#d4af37] hover:scale-110 hover:shadow-[0_0_15px_white] transition-all flex items-center justify-center group"
                    style={{ left: `${opt.x}px`, top: `${opt.y}px` }}
                >
                    <div className="w-10 h-10 relative transition-opacity">
                        <Image src={opt.icon} fill className="object-contain" alt={opt.id} />
                    </div>
                </button>
            ))}
        </div>
    );
}
