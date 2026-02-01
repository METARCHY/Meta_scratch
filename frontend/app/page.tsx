"use client";

import Link from "next/link";
import { useState } from "react";
import OnboardingModal from "../components/OnboardingModal";
import MetarchyButton from "../components/MetarchyButton";
import ProfileWidget from "../components/ProfileWidget";
import { useGameState } from "../context/GameStateContext";
import { Shield, Coins, User } from "lucide-react";

export default function Home() {
    const { player } = useGameState();
    const [showOnboarding, setShowOnboarding] = useState(false);

    const isLoggedIn = player.citizenId && player.citizenId !== "0000";

    return (
        <main className="flex min-h-screen flex-col items-center justify-end px-24 pb-32 text-center relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                {isLoggedIn ? (
                    // Lobby Background
                    <>
                        <img src="/backgrounds/verified_bg.jpg" alt="bg" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                    </>
                ) : (
                    // Landing Background - Verified
                    <>
                        <div className="absolute inset-0 bg-red-900 -z-10" />
                        <img
                            src="/backgrounds/verified_bg.jpg"
                            alt="bg"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                                console.error("Background image failed to load:", e.currentTarget.src);
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        {/* Re-enable slight overlay for readability if desired, or keep clear */}
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                    </>
                )}
            </div>

            {/* Profile Bar (Lobby Only) */}
            {isLoggedIn && <ProfileWidget />}

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center">
                <img
                    src="/metarchy_text_logo.png"
                    alt="METARCHY"
                    className="h-6 md:h-10 mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] object-contain"
                />

                {!isLoggedIn ? (
                    // Landing View
                    <>
                        <p className="mb-8 text-sm font-medium text-white max-w-2xl tracking-wide">
                            Win-to-Earn NFT-Game driven by the Gamers Community.
                            <br />
                            Strategize, Bet, and Conquer on the Base Blockchain.
                        </p>

                        <div className="flex gap-6 items-center">
                            <MetarchyButton onClick={() => setShowOnboarding(true)} className="w-60 h-12 text-xl">
                                CONNECT WALLET
                            </MetarchyButton>
                        </div>
                    </>
                ) : (
                    // Lobby View (Play Menu)
                    <div className="flex gap-4 items-center justify-center mt-12 w-full max-w-2xl">
                        <Link href="/game/join">
                            <MetarchyButton variant="blue" className="w-[200px] h-[54px] text-lg tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                JOIN GAME
                            </MetarchyButton>
                        </Link>
                        <Link href="/game/create">
                            <MetarchyButton variant="green" className="w-[200px] h-[54px] text-lg tracking-widest shadow-[0_0_20px_rgba(22,163,74,0.3)]">
                                CREATE
                            </MetarchyButton>
                        </Link>
                    </div>
                )}
            </div>

            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        </main>
    )
}
