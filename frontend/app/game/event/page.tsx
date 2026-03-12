"use client";

import { TopBar } from "@/components/TopBar";
import { GameHUD } from "@/components/GameHUD";
import { ChevronUp, ChevronDown, Check, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function EventPhasePage() {
    const [discardAmount, setDiscardAmount] = useState(2);

    return (
        <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans select-none">

            {/* --- BACKGROUND (Standard Game Board State) --- */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('/map/map_full_day.jpg')] bg-cover bg-center blur-[2px]" />
                <div className="absolute inset-0 bg-black/40" />
            </div>



            <GameHUD turn={3} phase="1" phaseName="EVENT" />

            {/* --- CENTRAL EVENT MODAL --- */}
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-500">

                {/* Card Frame */}
                <div className="relative w-[900px] h-[500px] bg-[#0d0d12] border border-[#d4af37]/30 rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.9)] flex overflow-hidden">

                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 right-0 h-[100px] border-b border-[#d4af37]/20 flex flex-col items-center justify-center">
                        <div className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-2">Event Card</div>
                        <h1 className="text-3xl font-bold text-white tracking-widest font-serif">ENERGY CRISIS</h1>
                        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mt-2" />
                    </div>

                    {/* Content Area */}
                    <div className="flex w-full pt-[100px]">

                        {/* Left: Card Art */}
                        <div className="w-1/2 p-8 flex items-center justify-center border-r border-white/5 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0d0d12]/50 z-10" />
                            <div className="w-[300px] h-[340px] relative rounded-lg overflow-hidden border border-white/10 shadow-2xl skew-x-1 hover:skew-x-0 transition-transform duration-500 group">
                                <Image src="/events/event_discovery.png" layout="fill" objectFit="cover" alt="Event Art" className="group-hover:scale-110 transition-transform duration-700" />
                                {/* Overlay Vignette */}
                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                            </div>
                        </div>

                        {/* Right: Description & Interaction */}
                        <div className="w-1/2 p-10 flex flex-col justify-center relative">

                            {/* Flavor Text */}
                            <div className="mb-8 relative">
                                <span className="text-4xl absolute -top-4 -left-2 text-[#d4af37]/20 font-serif">“</span>
                                <p className="text-sm font-serif italic text-gray-400 leading-relaxed pl-6 border-l-2 border-[#d4af37]/30">
                                    The professor found it rather strange that even with all our technological progress, there are still vestiges such as saving energy.
                                </p>
                            </div>

                            {/* Mechanics Instructions */}
                            <div className="mb-8">
                                <p className="text-md text-white font-medium">
                                    Discard any amount of the <span className="text-yellow-400 font-bold">Energy</span> resource.
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    The player with the most discards wins <span className="text-purple-400 font-bold">Fame</span>.
                                </p>
                            </div>

                            {/* Interaction Controls */}
                            <div className="flex items-center gap-6 mt-auto">

                                {/* Hexagon Stepper */}
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    {/* Hexagon SVG Background */}
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                        <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="#1a1a20" stroke="#d4af37" strokeWidth="2" strokeOpacity="0.5" />
                                    </svg>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <button onClick={() => setDiscardAmount(d => d + 1)} className="text-gray-500 hover:text-[#d4af37] transition-colors"><ChevronUp size={20} /></button>
                                        <span className="text-3xl font-bold text-white font-mono my-1">{discardAmount}</span>
                                        <button onClick={() => setDiscardAmount(d => Math.max(0, d - 1))} className="text-gray-500 hover:text-[#d4af37] transition-colors"><ChevronDown size={20} /></button>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => console.log('Cancel')}
                                        className="w-14 h-14 rounded-full bg-red-900/40 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/40">
                                        <X size={24} />
                                    </button>
                                    <button
                                        onClick={() => console.log('Confirm Discard', discardAmount)}
                                        className="w-20 h-14 rounded-lg bg-green-900/40 border border-green-500/50 flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white transition-all shadow-lg hover:shadow-green-500/40 transform hover:-translate-y-1">
                                        <Check size={28} strokeWidth={3} />
                                    </button>
                                </div>

                            </div>

                        </div>
                    </div>

                </div>

            </div>

        </main >
    );
}
