import { TopBar } from "@/components/TopBar";
import Link from "next/link";

export default function Dashboard() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-black text-white">
            {/* Background Image Layer - User should replace the src */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1518544806314-5360b7696b97?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            <TopBar />

            <div className="relative z-10 flex flex-col items-center justify-center h-full pb-20">

                {/* Logo Text */}
                <h1 className="text-4xl md:text-6xl font-thin tracking-[1em] mb-12 text-white/90 uppercase font-[family-name:var(--font-inter)]">
                    Metarchy
                </h1>

                {/* Central Emblem Placeholder */}
                <div className="w-64 h-64 md:w-96 md:h-96 relative mb-16 animate-pulse-slow">
                    {/* In a real app, use <Image> here with the user's asset */}
                    <div className="w-full h-full bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-64 border-2 border-purple-400/30 transform rotate-45 bg-black/50 backdrop-blur-md flex items-center justify-center">
                            <span className="text-6xl font-thin text-purple-200 -rotate-45">M</span>
                        </div>
                    </div>
                </div>

                {/* Action Menu */}
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <div className="flex flex-col w-full gap-1 glass rounded-lg overflow-hidden p-1">
                        <button className="py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors uppercase tracking-widest text-xs">
                            Join Game
                        </button>
                        <button className="py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors uppercase tracking-widest text-xs">
                            Create Game
                        </button>
                    </div>

                    <Link href="/game/lobby" className="w-full">
                        <button className="w-full py-4 bg-[#4a4a4a]/50 text-[#d4af37] border border-[#d4af37] font-bold text-xl tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-300 clip-path-polygon">
                            PLAY
                        </button>
                    </Link>
                </div>

            </div>

            {/* Neon Pillar Effects (CSS only representation of the 3D pillars) */}
            <div className="absolute left-[10%] top-0 h-full w-[2px] bg-purple-500 blur-[4px] opacity-70" />
            <div className="absolute left-[12%] top-[20%] h-full w-[4px] bg-purple-400 blur-[8px] opacity-50" />

            <div className="absolute right-[10%] top-0 h-full w-[2px] bg-purple-500 blur-[4px] opacity-70" />
            <div className="absolute right-[12%] top-[20%] h-full w-[4px] bg-purple-400 blur-[8px] opacity-50" />

        </main>
    );
}
