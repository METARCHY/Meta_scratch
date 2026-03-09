"use client";

import React from 'react';
import Image from 'next/image';
import { BID_ICONS } from '@/data/assetManifest';

interface BidRadialMenuProps {
    actor: { name: string, avatar: string, headAvatar?: string, type: string } | null;
    resources: { product: number, electricity: number, recycling: number };
    onSelect: (token: 'product' | 'electricity' | 'recycling' | null) => void;
    onCancel: () => void;
}

const bidOptions = [
    { id: 'product', icon: BID_ICONS['product'], lbl: 'WIN', x: 43, y: 25 },
    { id: 'electricity', icon: BID_ICONS['electricity'], lbl: 'LOSE', x: 25, y: 84 },
    { id: 'recycling', icon: BID_ICONS['recycling'], lbl: 'DRAW', x: 37, y: 146 }
] as const;

export default function BidRadialMenu({ actor, resources, onSelect, onCancel }: BidRadialMenuProps) {
    if (!actor) return null;

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
            </svg>

            {/* Title */}
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-4 py-1 rounded border border-[#d4af37] text-[#d4af37] font-bold tracking-widest text-sm z-30">
                PLACE BET
            </div>

            {/* No Bet Option (Top Middle) */}
            <button
                onClick={() => onSelect(null)}
                className="absolute z-20 w-[40px] h-[40px] -ml-[20px] -mt-[20px] rounded-full bg-red-900 border border-red-500 hover:scale-110 flex items-center justify-center font-bold text-xs"
                style={{ left: '131px', top: '0px' }}
            >
                SKIP
            </button>

            {/* Bet Options (Product, Energy, Recycle) */}
            {bidOptions.map((opt) => {
                const resCount = resources[opt.id];
                const disabled = resCount <= 0;

                return (
                    <button
                        key={opt.id}
                        onClick={() => !disabled && onSelect(opt.id)}
                        disabled={disabled}
                        className={`absolute z-20 w-[49px] h-[49px] -ml-[24.5px] -mt-[24.5px] rounded-full flex flex-col items-center justify-center transition-all ${disabled ? 'bg-gray-800 border border-gray-600 opacity-50 cursor-not-allowed grayscale' : 'bg-[#1a1a1c] border border-[#d4af37]/50 hover:border-[#d4af37] hover:scale-110 hover:shadow-[0_0_15px_white]'}`}
                        style={{ left: `${opt.x}px`, top: `${opt.y}px` }}
                    >
                        <div className="w-8 h-8 relative">
                            <Image src={opt.icon} fill className="object-contain" alt={opt.id} />
                        </div>
                        <span className="text-[9px] font-bold mt-1 text-white absolute -bottom-4 bg-black/50 px-1 rounded">{opt.lbl}</span>
                    </button>
                );
            })}
        </div>
    );
}
