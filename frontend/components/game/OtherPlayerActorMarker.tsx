"use client";

import React from 'react';
import Image from 'next/image';

interface OtherPlayerActorMarkerProps {
    actor: { type: string, avatar: string, id: string }; // The actor (Magenta ring)
    playerAvatar?: string; // The player's citizen avatar (Blue ring)
    phase?: number;
    onClick?: (e: React.MouseEvent) => void;
}

// Manual face-crop offsets
const FACE_Offsets: { [key: string]: string } = {
    'politician': '50% 20%',
    'scientist': '50% 15%',
    'artist': '55% 25%',
    'robot': '50% 20%'
};

export default function OtherPlayerActorMarker({ actor, playerAvatar, phase, onClick }: OtherPlayerActorMarkerProps) {
    const objectPosition = FACE_Offsets[actor.type.toLowerCase()] || '50% 20%';
    const baseScale = phase && phase >= 3 ? 'scale-[1.2]' : 'scale-100';

    return (
        <div
            className={`relative w-[129px] h-[127px] cursor-pointer transition-all duration-700 hover:scale-110 group ${baseScale}`}
            onClick={onClick}
        >
            {/* Layer 0: Background Fills */}
            <svg width="129" height="127" viewBox="0 0 129 127" fill="none" className="absolute inset-0 z-0 pointer-events-none">
                <path d="M78.77 99.04C105.981 99.04 128.04 76.9811 128.04 49.77C128.04 22.5589 105.981 0.5 78.77 0.5C51.5589 0.5 29.5 22.5589 29.5 49.77C29.5 76.9811 51.5589 99.04 78.77 99.04Z" fill="#380B0B" fillOpacity="0.8" />
                <path d="M31.5 126.5C48.6208 126.5 62.5 112.621 62.5 95.5C62.5 78.3792 48.6208 64.5 31.5 64.5C14.3792 64.5 0.5 78.3792 0.5 95.5C0.5 112.621 14.3792 126.5 31.5 126.5Z" fill="#23262D" />
            </svg>

            {/* Layer 1: Actor Avatar (Magenta Ring Area) */}
            {/* Center approx 78, 50. Radius approx 39 */}
            <div
                className="absolute z-10 rounded-full overflow-hidden border border-transparent"
                style={{
                    left: '39px',
                    top: '11px',
                    width: '79px',
                    height: '79px',
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

            {/* Layer 1b: Player Avatar (Blue Ring Area) */}
            {/* Center approx 31.5, 95.5. Radius approx 25? Path shows D=... */}
            {/* Center is 31.5, 95.5.  
                Small inner circle stroke is d="... 57.5 " which is roughly radius 26 (31.5+26 = 57.5)
                Let's use w-52px h-52px centered at 31.5, 95.5
                Top-Left = 31.5 - 26 = 5.5, 95.5 - 26 = 69.5
             */}
            {playerAvatar && (
                <div
                    className="absolute z-20 rounded-full overflow-hidden bg-black/60 border border-blue-500/30"
                    style={{
                        left: '5.5px',
                        top: '69.5px',
                        width: '52px',
                        height: '52px'
                    }}
                >
                    <div className="relative w-full h-full">
                        <Image
                            src={playerAvatar}
                            fill
                            className="object-cover"
                            alt="player"
                        />
                    </div>
                </div>
            )}

            {/* Layer 2: Foreground Strokes */}
            <svg width="129" height="127" viewBox="0 0 129 127" fill="none" className="absolute inset-0 z-20 pointer-events-none">
                <path d="M78.7704 89.9299C100.95 89.9299 118.93 71.9496 118.93 49.7699C118.93 27.5901 100.95 9.60986 78.7704 9.60986C56.5906 9.60986 38.6104 27.5901 38.6104 49.7699C38.6104 71.9496 56.5906 89.9299 78.7704 89.9299Z" stroke="#A08C5C" strokeWidth="2" strokeMiterlimit="10" />
                <path d="M78.7701 93.2101C102.761 93.2101 122.21 73.7613 122.21 49.7701C122.21 25.7788 102.761 6.33008 78.7701 6.33008C54.7788 6.33008 35.3301 25.7788 35.3301 49.7701C35.3301 73.7613 54.7788 93.2101 78.7701 93.2101Z" stroke="#C1272D" strokeMiterlimit="10" />
                <path d="M78.77 99.04C105.981 99.04 128.04 76.9811 128.04 49.77C128.04 22.5589 105.981 0.5 78.77 0.5C51.5589 0.5 29.5 22.5589 29.5 49.77C29.5 76.9811 51.5589 99.04 78.77 99.04Z" stroke="#C1272D" strokeMiterlimit="10" />
                {/* Magenta Ring */}
                <path d="M78.5 89.5C100.039 89.5 117.5 71.8152 117.5 50C117.5 28.1848 100.039 10.5 78.5 10.5C56.9609 10.5 39.5 28.1848 39.5 50C39.5 71.8152 56.9609 89.5 78.5 89.5Z" stroke="#FF00D0" strokeMiterlimit="10" />
                <path d="M31.5 122.5C46.4117 122.5 58.5 110.412 58.5 95.5C58.5 80.5883 46.4117 68.5 31.5 68.5C16.5883 68.5 4.5 80.5883 4.5 95.5C4.5 110.412 16.5883 122.5 31.5 122.5Z" stroke="#A08C5C" strokeMiterlimit="10" />
                <path d="M31.5 126.5C48.6208 126.5 62.5 112.621 62.5 95.5C62.5 78.3792 48.6208 64.5 31.5 64.5C14.3792 64.5 0.5 78.3792 0.5 95.5C0.5 112.621 14.3792 126.5 31.5 126.5Z" stroke="#A08C5C" strokeMiterlimit="10" />
                {/* Blue Ring */}
                <path d="M31.5 121.5C45.8594 121.5 57.5 109.859 57.5 95.5C57.5 81.1406 45.8594 69.5 31.5 69.5C17.1406 69.5 5.5 81.1406 5.5 95.5C5.5 109.859 17.1406 121.5 31.5 121.5Z" stroke="#00D9FF" strokeMiterlimit="10" />
            </svg>
        </div>
    );
}
