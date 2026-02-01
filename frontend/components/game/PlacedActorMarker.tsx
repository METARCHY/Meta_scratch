"use client";

import React from 'react';
import Image from 'next/image';

interface PlacedActorMarkerProps {
    actor: { type: string, avatar: string, id: string };
    token?: string; // RSP token id
    isP1: boolean;
    isTeleporting?: boolean;
    phase?: number;
    onClick?: (e: React.MouseEvent) => void;
}

const FACE_Offsets: { [key: string]: string } = {
    'politician': '50% 20%',
    'scientist': '50% 15%',
    'artist': '55% 25%',
    'robot': '50% 20%'
};

export default function PlacedActorMarker({ actor, token, isP1, isTeleporting, phase, onClick }: PlacedActorMarkerProps) {
    const objectPosition = FACE_Offsets[actor.type.toLowerCase()] || '50% 20%';
    const baseScale = phase && phase >= 3 ? 'scale-[1.4]' : 'scale-125';

    return (
        <div
            className={`relative w-[145px] h-[188px] cursor-pointer transition-all duration-700 group origin-bottom ${baseScale} ${isTeleporting ? 'scale-[1.5] drop-shadow-[0_0_20px_cyan]' : 'hover:scale-[1.5]'}`}
            onClick={onClick}
        >
            {/* Layer 0: Background Fills */}
            <svg width="145" height="188" viewBox="0 0 145 188" fill="none" className="absolute inset-0 z-0 pointer-events-none">
                <path d="M143.824 72.7557L143.88 72.6618L143.824 72.6055C143.806 53.7577 136.307 35.6876 122.975 22.3655C109.642 9.04334 91.566 1.55882 72.7182 1.55634L72.6618 1.5L72.6055 1.55634C53.7667 1.57127 35.7037 9.06157 22.3826 22.3826C9.06157 35.7037 1.57127 53.7667 1.55634 72.6055L1.5 72.6618L1.55634 72.7557C1.57225 85.9389 5.25334 98.8581 12.1883 110.07C19.1233 121.282 29.0391 130.344 40.8278 136.245L72.6618 187.715L104.505 136.245C116.301 130.349 126.226 121.289 133.169 110.077C140.112 98.8651 143.801 85.9434 143.824 72.7557Z" fill="#23262D" fillOpacity="0.8" />
                <path d="M143.824 72.7557L143.88 72.6618L143.824 72.6055C143.806 53.7577 136.307 35.6876 122.975 22.3655C109.642 9.04334 91.566 1.55882 72.7182 1.55634L72.6618 1.5L72.6055 1.55634C53.7667 1.57127 35.7037 9.06157 22.3826 22.3826C9.06157 35.7037 1.57127 53.7667 1.55634 72.6055L1.5 72.6618L1.55634 72.7557C1.57225 85.9389 5.25334 98.8581 12.1883 110.07C19.1233 121.282 29.0391 130.344 40.8278 136.245L72.6618 187.715L104.505 136.245C116.301 130.349 126.226 121.289 133.169 110.077C140.112 98.8651 143.801 85.9434 143.824 72.7557Z" fill="url(#paint_placed_grad)" />
                <path d="M36.2172 163.417C52.2687 163.417 65.281 150.405 65.281 134.353C65.281 118.302 52.2687 105.29 36.2172 105.29C20.1657 105.29 7.15332 118.302 7.15332 134.353C7.15332 150.405 20.1657 163.417 36.2172 163.417Z" fill="#23262D" fillOpacity="0.8" />

                <defs>
                    <linearGradient id="paint_placed_grad" x1="72.6618" y1="187.715" x2="72.6618" y2="32.0194" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#A08C5C" stopOpacity="0.9" />
                        <stop offset="0.490385" stopColor="#A08C5C" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Layer 1: Avatar Image */}
            <div
                className={`absolute z-10 rounded-full overflow-hidden border-2 ${isP1 ? 'border-[#d4af37]' : 'border-white'} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                style={{
                    left: '16px',
                    top: '16px',
                    width: '112px',
                    height: '112px',
                    backgroundColor: '#1a1a1c'
                }}
            >
                <div className="relative w-full h-full scale-125">
                    <Image
                        src={actor.avatar}
                        fill
                        className="object-cover"
                        style={{ objectPosition }}
                        alt={actor.type}
                    />
                </div>
            </div>

            {/* Layer 1b: RSP Token */}
            {token && (
                <div
                    className="absolute z-30 rounded-full overflow-hidden bg-black/60 border border-[#d4af37]/50 flex items-center justify-center"
                    style={{
                        left: '12px',
                        top: '110px',
                        width: '49px',
                        height: '49px'
                    }}
                >
                    <div className="relative w-9 h-9">
                        <Image
                            src={`/tokens/rsp_${token}.png`}
                            fill
                            className="object-contain"
                            alt={token}
                        />
                    </div>
                </div>
            )}

            {/* Layer 2: Foreground Strokes */}
            <svg width="145" height="188" viewBox="0 0 145 188" fill="none" className="absolute inset-0 z-20 pointer-events-none">
                <path d="M36.2172 163.417C52.2687 163.417 65.281 150.405 65.281 134.353C65.281 118.302 52.2687 105.29 36.2172 105.29C20.1657 105.29 7.15332 118.302 7.15332 134.353C7.15332 150.405 20.1657 163.417 36.2172 163.417Z" stroke="#A08C5C" strokeMiterlimit="10" />
                <path d="M72.187 130.628C104.464 130.628 130.629 104.463 130.629 72.1865C130.629 39.91 104.464 13.7446 72.187 13.7446C39.9104 13.7446 13.7451 39.91 13.7451 72.1865C13.7451 104.463 39.9104 130.628 72.187 130.628Z" stroke="#A08C5C" strokeWidth="2" strokeMiterlimit="10" />
                <path d="M72.1867 135.381C107.088 135.381 135.381 107.088 135.381 72.1867C135.381 37.2853 107.088 8.99219 72.1867 8.99219C37.2853 8.99219 8.99219 37.2853 8.99219 72.1867C8.99219 107.088 37.2853 135.381 72.1867 135.381Z" stroke="#A08C5C" strokeMiterlimit="10" />
                <path d="M72.1867 143.873C111.778 143.873 143.873 111.778 143.873 72.1867C143.873 32.5952 111.778 0.5 72.1867 0.5C32.5952 0.5 0.5 32.5952 0.5 72.1867C0.5 111.778 32.5952 143.873 72.1867 143.873Z" stroke="#A08C5C" strokeMiterlimit="10" />
            </svg>
        </div>
    );
}
