"use client";

import ProfileWidget from "@/components/ProfileWidget";
import MetarchyButton from "@/components/MetarchyButton";
import Link from "next/link";
import { useGameState } from "@/context/GameStateContext";
import { useRouter } from "next/navigation";

export default function JoinGamePage() {
    const { lobby, games, joinRoom, player } = useGameState();
    const router = useRouter();

    const handleJoin = async (gameId: string) => {
        await joinRoom(gameId, player);
        router.push(`/game/lobby/${gameId}`);
    };

    return (
        <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
            <div className="absolute inset-0 z-0">
                <img src="/backgrounds/verified_bg.jpg" alt="Background" className="w-full h-full object-cover" />
                <img src="/backgrounds/overlay_bg.png" alt="Overlay" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen" />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <ProfileWidget />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 pt-20">
                <div className="w-full max-w-5xl">
                    <div className="flex justify-center gap-4 mb-8">
                        <MetarchyButton variant="blue" className="w-48 pointer-events-none opacity-100 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            JOIN GAME
                        </MetarchyButton>
                        <Link href="/game/create">
                            <MetarchyButton variant="green" className="w-48 opacity-70 hover:opacity-100">
                                CREATE GAME
                            </MetarchyButton>
                        </Link>
                    </div>

                    <div className="w-full max-w-4xl mx-auto min-h-[500px] p-8 bg-[#1a1a1c]/80 backdrop-blur-xl border border-[#d4af37]/30 rounded-xl relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

                        <div className="relative z-10 w-full">
                            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-white/10 text-[#d4af37] text-xs uppercase tracking-[0.2em] font-bold mb-4 font-rajdhani">
                                <div className="col-span-3">Room Name</div>
                                <div className="col-span-3 text-center">Players</div>
                                <div className="col-span-3 text-center">Timeout</div>
                                <div className="col-span-3 text-right">Occupancy</div>
                            </div>

                            {games.filter(g => g.status === 'waiting' && !g.isPrivate && g.players.length < g.maxPlayers).map((game, idx) => (
                                <div key={idx} onClick={() => handleJoin(game.id)} className={`grid grid-cols-12 gap-4 py-4 px-4 border items-center transition-colors cursor-pointer mb-2 rounded ${game.roomId === lobby.roomName ? "border-[#d4af37] bg-[#d4af37]/10" : "border-white/5 hover:bg-white/5"}`}>
                                    <div className="col-span-3 font-bold text-white tracking-wide font-rajdhani text-lg">{game.roomId}</div>
                                    <div className="col-span-3 text-center text-white font-mono">{game.players.length} / {game.maxPlayers}</div>
                                    <div className="col-span-3 text-center text-gray-400 text-xs uppercase">{game.status}</div>
                                    <div className="col-span-3 flex justify-end gap-2">
                                        {game.players.map((member: any, i: number) => (
                                            <div key={i} className="w-9 h-9 rounded-full border border-[#d4af37]/50 bg-black overflow-hidden relative group" title={member.name}>
                                                <img src={member.avatar || "/avatars/default.png"} alt={member.name} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                        {Array.from({ length: Math.max(0, game.maxPlayers - game.players.length) }).map((_, i) => (
                                            <div key={`empty-${i}`} className="w-9 h-9 rounded-full border border-dashed border-gray-700 bg-black/50 flex items-center justify-center animate-pulse">
                                                <span className="text-gray-600 text-lg font-thin">+</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
