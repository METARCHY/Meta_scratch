import React from 'react';
import Image from 'next/image';

interface GameHeaderProps {
    turn: number;
    phase: number;
    phaseName: string;
    eventDeckCount?: number;
    actionDeckCount?: number;
}

export default function GameHeader({ turn, phase, phaseName, eventDeckCount = 0, actionDeckCount = 0 }: GameHeaderProps) {
    return (
        <div className="absolute top-0 left-0 w-full z-50 pointer-events-none">
            <div className="relative w-full h-[37px] flex items-center justify-center overflow-visible">
                {/* 
                    Wrapper div matching SVG width (1928px). 
                    This ensures overlays are positioned in the same coordinate space as the SVG geometry.
                */}
                <div className="relative w-[1928px] h-[37px] shrink-0">
                    <svg width="1928" height="37" viewBox="0 0 1928 37" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full">
                        <g filter="url(#filter0_d_0_1)">
                            <path d="M1924 0H4V28.56H1924V0Z" fill="url(#paint0_linear_0_1)" />
                            <path d="M1876.26 0.000244141H1777.51V28.5602H1876.26V0.000244141Z" fill="url(#paint1_linear_0_1)" />
                            <path d="M1876.86 0.000244141H1875.65V28.4002H1876.86V0.000244141Z" fill="#514D44" />
                            <path d="M1777.51 0.000244141H1691.86V28.5602H1777.51V0.000244141Z" fill="url(#paint2_linear_0_1)" />
                            <path d="M1778.11 0.000244141H1776.9V28.4002H1778.11V0.000244141Z" fill="#514D44" />
                            <path d="M1900.67 24.89C1906.56 24.89 1911.34 20.1129 1911.34 14.22C1911.34 8.32717 1906.56 3.55005 1900.67 3.55005C1894.78 3.55005 1890 8.32717 1890 14.22C1890 20.1129 1894.78 24.89 1900.67 24.89Z" fill="#23262D" />
                            <path d="M1900.67 24.89C1906.56 24.89 1911.34 20.1129 1911.34 14.22C1911.34 8.32717 1906.56 3.55005 1900.67 3.55005C1894.78 3.55005 1890 8.32717 1890 14.22C1890 20.1129 1894.78 24.89 1900.67 24.89Z" stroke="#A08C5C" strokeMiterlimit="10" />
                            <path d="M1904.5 10.47H1896.84C1896.53 10.47 1896.28 10.7185 1896.28 11.025C1896.28 11.3315 1896.53 11.58 1896.84 11.58H1904.5C1904.81 11.58 1905.06 11.3315 1905.06 11.025C1905.06 10.7185 1904.81 10.47 1904.5 10.47Z" fill="#A08C5C" />
                            <path d="M1904.5 13.6702H1896.84C1896.53 13.6702 1896.28 13.9186 1896.28 14.2252C1896.28 14.5317 1896.53 14.7802 1896.84 14.7802H1904.5C1904.81 14.7802 1905.06 14.5317 1905.06 14.2252C1905.06 13.9186 1904.81 13.6702 1904.5 13.6702Z" fill="#A08C5C" />
                            <path d="M1904.5 16.8701H1896.84C1896.53 16.8701 1896.28 17.1186 1896.28 17.4251C1896.28 17.7316 1896.53 17.9801 1896.84 17.9801H1904.5C1904.81 17.9801 1905.06 17.7316 1905.06 17.4251C1905.06 17.1186 1904.81 16.8701 1904.5 16.8701Z" fill="#A08C5C" />
                        </g>
                        <defs>
                            <filter id="filter0_d_0_1" x="0" y="0" width="1928" height="36.5603" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                <feOffset dy="4" />
                                <feGaussianBlur stdDeviation="2" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape" />
                            </filter>
                            <linearGradient id="paint0_linear_0_1" x1="964" y1="2.07" x2="964" y2="26.54" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#171B21" />
                                <stop offset="0.59" stopColor="#1C1F26" />
                                <stop offset="1" stopColor="#23262D" />
                            </linearGradient>
                            <linearGradient id="paint1_linear_0_1" x1="1777.51" y1="14.2802" x2="1876.26" y2="14.2802" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#12161E" />
                                <stop offset="0.36" stopColor="#171A22" />
                                <stop offset="0.77" stopColor="#24272E" />
                                <stop offset="1" stopColor="#2F3238" />
                            </linearGradient>
                            <linearGradient id="paint2_linear_0_1" x1="1691.86" y1="14.2802" x2="1777.51" y2="14.2802" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#12161E" />
                                <stop offset="0.36" stopColor="#171A22" />
                                <stop offset="0.77" stopColor="#24272E" />
                                <stop offset="1" stopColor="#2F3238" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Overlaid Dynamic Data - Aligned to 1928px Container */}
                    {/* Shifted left for 1440px screens (Center 964 +/- 720 -> right edge at 244px from wrapper edge) */}

                    {/* EVENT DECK COUNT */}
                    <div className="absolute top-[14px] flex items-center gap-2 z-20 pointer-events-none -translate-y-1/2" style={{ right: '700px' }}>
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            {/* Refined Clipping for Blue Event Card: polygon(22.0% 12.0%, 75.0% 18.0%, 53.0% 92.0%, 0.0% 64.0%) */}
                            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: 'polygon(22.0% 12.0%, 75.0% 18.0%, 53.0% 92.0%, 0.0% 64.0%)' }}>
                                <Image src="/decks/event_deck_src.jpg" fill className="object-cover scale-125" alt="Event Deck" priority />
                            </div>
                        </div>
                        <span className="text-[#a08c5c] font-bold text-sm font-mono drop-shadow-[0_0_8px_rgba(160,140,92,0.4)]">{eventDeckCount}</span>
                    </div>

                    {/* ACTION DECK COUNT */}
                    <div className="absolute top-[14px] flex items-center gap-2 z-20 pointer-events-none -translate-y-1/2" style={{ right: '630px' }}>
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            {/* Refined Clipping for Purple Action Card: polygon(23.0% 16.0%, 76.0% 23.0%, 53.0% 93.0%, 0.0% 66.0%) */}
                            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: 'polygon(23.0% 16.0%, 76.0% 23.0%, 53.0% 93.0%, 0.0% 66.0%)' }}>
                                <Image src="/decks/action_deck_src.jpg" fill className="object-cover scale-125" alt="Action Deck" priority />
                            </div>
                        </div>
                        <span className="text-[#a08c5c] font-bold text-sm font-mono drop-shadow-[0_0_8px_rgba(160,140,92,0.4)]">{actionDeckCount}</span>
                    </div>

                    {/* TURN INFO */}
                    <div className="absolute top-[14px] z-20 pointer-events-none -translate-y-1/2 flex items-baseline gap-1.5" style={{ right: '500px' }}>
                        <span className="text-gray-400/80 font-bold text-[10px] tracking-wider">TURN</span>
                        <span className="text-white font-bold text-sm font-sans">{turn}</span>
                    </div>

                    {/* PHASE INFO - "Phase 1: Event" format */}
                    <div className="absolute top-[14px] z-20 pointer-events-none -translate-y-1/2 flex items-baseline gap-1" style={{ right: '250px' }}>
                        <span className="text-gray-400 font-bold text-[10px] tracking-wider">PHASE {phase}:</span>
                        <span className="text-white font-mono text-[11px] uppercase tracking-[0.1em] whitespace-nowrap">{phaseName}</span>
                    </div>

                    {/* Menu Button Hitbox */}
                    <div
                        className="absolute right-10 top-0 w-[50px] h-full z-50 cursor-pointer"
                        onClick={() => console.log('Menu Clicked')}
                    />
                </div>
            </div>
        </div>
    );
}
