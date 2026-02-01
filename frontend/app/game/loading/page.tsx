"use client";

import { TopBar } from "@/components/TopBar";

export default function LoadingPage() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1518544806314-5360b7696b97?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
            </div>

            <TopBar />

            <div className="relative z-10 flex flex-col items-center justify-center h-full">

                {/* Glowing Logo Container */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">

                    {/* Pulsing Outer Glow ring */}
                    <div className="absolute inset-0 rounded-full border-[6px] border-[#ff4d00] shadow-[0_0_50px_#ff4d00] animate-pulse" />

                    {/* Inner White Glow */}
                    <div className="absolute inset-2 rounded-full border-[2px] border-white/50 shadow-[inset_0_0_20px_#ff4d00]" />

                    {/* Logo Mark */}
                    <div className="w-40 h-40 relative z-20 transform scale-110">
                        {/* Recreating the 'M' logo with CSS borders/shapes for scalability */}
                        <div className="w-full h-full flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                                {/* Outer Angles */}
                                <path d="M20 30 L20 80" stroke="white" strokeWidth="3" fill="none" />
                                <path d="M80 30 L80 80" stroke="white" strokeWidth="3" fill="none" />

                                {/* Inner M Shape */}
                                <path d="M25 80 L25 35 L50 60 L75 35 L75 80" stroke="white" strokeWidth="3" fill="none" />

                                {/* Diamond Top */}
                                <path d="M50 20 L65 35 L50 50 L35 35 Z" stroke="white" strokeWidth="3" fill="none" />
                            </svg>
                        </div>
                    </div>

                    {/* Ambient Background Glow behind logo */}
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                </div>

                {/* Loading Text */}
                <div className="space-y-2 text-center">
                    <h2 className="text-xl font-bold tracking-[0.3em] text-white drop-shadow-md animate-pulse">
                        LOADING...
                    </h2>
                </div>

            </div>

            {/* Neon Pillar Effects (Persistent across screens) */}
            <div className="absolute left-[15%] top-0 h-full w-[4px] bg-purple-500 blur-[6px] opacity-80" />
            <div className="absolute right-[15%] top-0 h-full w-[4px] bg-purple-500 blur-[6px] opacity-80" />

        </main>
    );
}
