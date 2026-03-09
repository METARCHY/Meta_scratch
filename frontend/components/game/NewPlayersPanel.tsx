import React from 'react';
import Image from 'next/image';

interface NewPlayersPanelProps {
    players?: any[];
    p3Step?: number;
    availableExchangeCards?: number;
    onExchangeClick?: (playerId: string, playerName: string) => void;
}

export default function NewPlayersPanel({ players = [], p3Step, availableExchangeCards, onExchangeClick }: NewPlayersPanelProps) {
    // Data unpacking: p1 is Index 0 (User), p2/p3 are Index 1/2 (Opponents)
    const userPlayer = players[0] || { name: 'Citizen', avatar: '/avatars/golden_avatar.png' };
    const p2 = players.length > 1 ? players[1] : null;
    const p3 = players.length > 2 ? players[2] : null;

    const showExchange = p3Step === 3 && availableExchangeCards && availableExchangeCards > 0;

    // Helper for circular avatar
    const AvatarCircle = ({ x, y, r, img, alt, player, hasOuterRing }: { x: number, y: number, r: number, img: string, alt: string, player?: any, hasOuterRing?: boolean }) => {
        const size = r * 2;
        const isOpponent = !hasOuterRing && player;

        return (
            <>
                {hasOuterRing && (
                    <>
                        <div
                            className="absolute rounded-full border border-[#d4af37] opacity-60 pointer-events-none"
                            style={{
                                left: `${x - r - 6}px`, // 6px padding
                                top: `${y - r - 6}px`,
                                width: `${size + 12}px`,
                                height: `${size + 12}px`
                            }}
                        />
                        <div
                            className="absolute rounded-full border border-[#d4af37] opacity-40 pointer-events-none"
                            style={{
                                left: `${x - r - 12}px`, // 12px padding
                                top: `${y - r - 12}px`,
                                width: `${size + 24}px`,
                                height: `${size + 24}px`
                            }}
                        />
                    </>
                )}
                <div
                    className={`absolute rounded-full overflow-hidden border-2 bg-black shadow-lg transition-all
                        ${isOpponent && showExchange ? 'cursor-pointer hover:border-[#00f0ff] hover:scale-110 z-50 pointer-events-auto' : 'border-[#A08C5C]'}
                    `}
                    style={{
                        left: `${x - r}px`,
                        top: `${y - r}px`,
                        width: `${size}px`,
                        height: `${size}px`
                    }}
                    onClick={() => {
                        console.log("AVATAR CLICKED", { isOpponent, showExchange, onExchangeClick: !!onExchangeClick });
                        if (isOpponent && showExchange && onExchangeClick) {
                            onExchangeClick(player.id, player.name);
                        }
                    }}
                >
                    <Image src={img} layout="fill" objectFit="cover" alt={alt} />
                </div>
                {/* NEW: Explicit Exchange Trigger Button Below Avatar */}
                {isOpponent && showExchange && (
                    <div
                        className="absolute z-50 pointer-events-auto flex items-center justify-center animate-in zoom-in duration-300"
                        style={{
                            left: `${x - 14}px`, // Center the 28px button
                            top: `${y + r + 2}px`, // Place right below the avatar
                        }}
                    >
                        <button
                            className="group/exchange w-7 h-7 rounded-full bg-[#1a1c23] border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.3)] flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.6)] hover:scale-110 transition-all cursor-pointer"
                            onPointerDown={(e) => {
                                console.log("EXCHANGE BUTTON TRIGGERED", { playerId: player.id });
                                e.preventDefault();
                                e.stopPropagation();
                                if (onExchangeClick) {
                                    onExchangeClick(player.id, player.name);
                                }
                            }}
                            title="Exchange Resources"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_5px_rgba(0,240,255,0.8)] group-hover/exchange:drop-shadow-[0_0_8px_rgba(0,240,255,1)] transition-all">
                                <path d="m16 3 4 4-4 4" />
                                <path d="M20 7H4" />
                                <path d="m8 21-4-4 4-4" />
                                <path d="M4 17h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="absolute top-[28px] left-0 z-50 pointer-events-none">
            <div className="relative w-[756px] h-[107px]">
                {/* SVG Background Layer */}
                <svg width="756" height="107" viewBox="0 0 756 107" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full">
                    <path d="M52.9004 0C57.1228 3.03916e-05 61.2295 0.496023 65.166 1.43066H561.4L473.5 73.3799H101.689C93.6853 92.4256 74.8549 105.8 52.9004 105.8C25.1711 105.8 2.42555 84.4649 0.182617 57.3145C0.122441 57.0748 0.0601665 56.8272 0 56.5703V1.43066H40.6338C44.5705 0.495965 48.6778 0 52.9004 0Z" fill="url(#paint0_linear_82_266)" />
                    <path d="M706.13 35.7102H0V1.43018H755.73L706.13 35.7102Z" fill="url(#paint1_linear_82_266)" />
                    <path d="M96.0596 35.7102H683.53" stroke="url(#paint2_linear_82_266)" strokeMiterlimit="10" />

                    {/* Gold Separator Line */}
                    <path d="M99 37 H634" stroke="#d4af37" strokeWidth="1" strokeOpacity="1" />

                    {/* Outline / Decor paths */}
                    <path d="M151 105.844C168.121 105.844 182 92.1076 182 75.1624C182 58.2171 168.121 44.4802 151 44.4802C133.879 44.4802 120 58.2171 120 75.1624C120 92.1076 133.879 105.844 151 105.844Z" fill="#23262D" />
                    <path d="M151 100.071C164.899 100.071 176.167 88.919 176.167 75.1622C176.167 61.4055 164.899 50.2534 151 50.2534C137.101 50.2534 125.833 61.4055 125.833 75.1622C125.833 88.919 137.101 100.071 151 100.071Z" stroke="#A08C5C" strokeMiterlimit="10" />
                    <path d="M232.21 104.42C248.823 104.42 262.29 90.541 262.29 73.4202C262.29 56.2993 248.823 42.4202 232.21 42.4202C215.597 42.4202 202.13 56.2993 202.13 73.4202C202.13 90.541 215.597 104.42 232.21 104.42Z" fill="#23262D" />
                    <path d="M232.21 98.5869C245.697 98.5869 256.63 87.3193 256.63 73.4201C256.63 59.5208 245.697 48.2532 232.21 48.2532C218.723 48.2532 207.79 59.5208 207.79 73.4201C207.79 87.3193 218.723 98.5869 232.21 98.5869Z" stroke="#A08C5C" strokeMiterlimit="10" />

                    <defs>
                        <linearGradient id="paint0_linear_82_266" x1="-2.07" y1="48.1702" x2="791.91" y2="116.53" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#23262D" />
                            <stop offset="1" stopColor="#23262D" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="paint1_linear_82_266" x1="2.21" y1="-13.7698" x2="714.13" y2="47.5302" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#23262D" />
                            <stop offset="0.29" stopColor="#23262D" stopOpacity="0.9" />
                            <stop offset="0.61" stopColor="#23262D" stopOpacity="0.6" />
                            <stop offset="0.94" stopColor="#23262D" stopOpacity="0.1" />
                            <stop offset="1" stopColor="#23262D" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="paint2_linear_82_266" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
                            <stop offset="0.72" stopColor="#A08C5C" />
                            <stop offset="1" stopColor="#A08C5C" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* --- Dynamic Content Layer --- */}

                {/* 1. Main Avatar (User) */}
                <AvatarCircle x={52.9} y={52.9} r={35} img={userPlayer.avatar} alt="Me" hasOuterRing={true} />

                {/* 2. Badge Placeholder */}
                <div className="absolute border border-red-500/0" style={{ left: '113.5px', top: '8.37px', width: '19px', height: '19px' }}>
                    {/* Assuming we can put a small rank icon here, likely coming from player data later */}
                    <div className="w-full h-full bg-[#A08C5C] rounded-sm"></div>
                </div>

                {/* 3. Account Name */}
                <div className="absolute flex items-center" style={{ left: '147.5px', top: '8.37px', width: '344px', height: '19px' }}>
                    <span className="text-[#A08C5C] font-bold text-sm uppercase tracking-widest">{userPlayer.name}</span>
                </div>

                {/* 4. Player 2 */}
                {p2 && (
                    <div className="pointer-events-auto">
                        <AvatarCircle x={151} y={75.16} r={21.7} img={p2.avatar} alt={p2.name} player={p2} />
                    </div>
                )}

                {/* 5. Player 3 */}
                {p3 && (
                    <div className="pointer-events-auto">
                        <AvatarCircle x={232.2} y={73.4} r={22} img={p3.avatar} alt={p3.name} player={p3} />
                    </div>
                )}

            </div>
        </div>
    );
}
