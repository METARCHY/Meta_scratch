"use client";

import { TopBar } from "@/components/TopBar";
import { Smile, User } from "lucide-react";

export default function WaitingRoomPage() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1518544806314-5360b7696b97?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 blur-sm"
                />
                <div className="absolute inset-0 bg-black/60" />
            </div>

            <TopBar />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 pt-16">

                {/* Main Card */}
                <div className="glassBorder w-full max-w-5xl h-[600px] p-8 bg-black/40 backdrop-blur-xl border border-[#d4af37]/30 rounded-xl relative flex flex-col shadow-2xl">
                    {/* Decorative Grid Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 rounded-xl pointer-events-none" />

                    {/* Room Title */}
                    <div className="flex items-center gap-4 mb-8 pl-2">
                        <h2 className="text-xl font-bold uppercase track-widest text-white">COSMOS_EGGS</h2>
                        <div className="h-[1px] bg-[#d4af37]/50 flex-1 ml-4" />
                    </div>

                    <div className="flex flex-1 gap-8 overflow-hidden relative z-10">

                        {/* Left Column: Chat */}
                        <div className="w-1/3 flex flex-col border border-white/10 rounded-lg bg-black/20 p-4">
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {/* Message 1 */}
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 border border-white/20 overflow-hidden relative">
                                        <User size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-purple-400 font-bold mb-0.5">MoMo364</div>
                                        <div className="text-xs text-gray-300 leading-relaxed">
                                            Hey guys! Can u wait me for 5 min pls. I need to make a coffee
                                        </div>
                                    </div>
                                </div>

                                {/* Message 2 */}
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-black border border-[#d4af37] overflow-hidden relative flex items-center justify-center">
                                        <div className="w-4 h-4 bg-blue-500 rounded-full blur-sm" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold mb-0.5">Sticky_Garry</div>
                                        <div className="text-xs text-gray-300 leading-relaxed">
                                            Sure
                                        </div>
                                    </div>
                                </div>

                                {/* Message 3 */}
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-black border border-green-500/50 overflow-hidden relative flex items-center justify-center">
                                        <div className="text-[8px] text-green-500 font-mono leading-none">10<br />01</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-green-600 font-bold mb-0.5">Matrix</div>
                                        <div className="text-xs text-gray-300 leading-relaxed">
                                            Yep
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                <div className="text-xs text-gray-500 italic">Type a message...</div>
                                <Smile size={16} className="text-gray-500 hover:text-[#d4af37] cursor-pointer" />
                            </div>
                        </div>

                        {/* Right Column: Room Details & Players */}
                        <div className="flex-1 flex flex-col pl-8">

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-y-4 gap-x-12 mb-12 max-w-lg">
                                <div className="text-sm text-gray-400">Number of Players</div>
                                <div className="text-sm font-bold text-white bg-black/40 px-3 py-1 rounded inline-block w-fit">3</div>

                                <div className="text-sm text-gray-400">Copy invite link</div>
                                <div className="text-sm text-gray-500 cursor-pointer hover:text-[#d4af37]">Press to generate</div>

                                <div className="text-sm text-gray-400">Player's turn timeout</div>
                                <div className="text-sm font-bold text-white">Off</div>

                                <div className="text-sm text-gray-400">Private</div>
                                <div className="text-sm font-bold text-white">Yes</div>
                            </div>

                            {/* Player List */}
                            <div className="border border-[#d4af37]/30 rounded-lg p-6 bg-black/20 flex-1">
                                <div className="space-y-4">

                                    {/* Player 1 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 border border-white/20 relative">
                                                <User size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                                            </div>
                                            <span className="text-sm font-bold text-white">MoMo364</span>
                                        </div>
                                        <div className="px-4 py-1.5 border border-red-500/50 text-red-500 text-[10px] font-bold tracking-widest rounded uppercase">
                                            Not Ready
                                        </div>
                                    </div>

                                    {/* Player 2 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-black border border-[#d4af37] overflow-hidden relative flex items-center justify-center">
                                                <div className="w-6 h-6 bg-blue-500 rounded-full blur-md" />
                                            </div>
                                            <span className="text-sm font-bold text-white">Sticky_Garry</span>
                                        </div>
                                        <div className="px-4 py-1.5 border border-green-500/50 text-green-500 text-[10px] font-bold tracking-widest rounded uppercase shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                            Im Ready
                                        </div>
                                    </div>

                                    {/* Player 3 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-black border border-green-500/50 overflow-hidden relative flex items-center justify-center">
                                                <div className="text-[10px] text-green-500 font-mono leading-none">10<br />01</div>
                                            </div>
                                            <span className="text-sm font-bold text-white">Matrix</span>
                                        </div>
                                        <div className="px-4 py-1.5 border border-green-500/50 text-green-500 text-[10px] font-bold tracking-widest rounded uppercase shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                            Im Ready
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Countdown and Ready Button */}
                            <div className="mt-6 flex flex-col items-center justify-center">
                                <div className="text-5xl font-bold text-white/10 mb-2">10</div>
                                <button className="w-48 py-3 bg-[#4a4a4a]/50 text-[#d4af37] border border-[#d4af37] font-bold text-sm tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] clip-path-polygon">
                                    READY
                                </button>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Footer Pill */}
                <div className="mt-8 px-10 py-2 border border-[#d4af37]/50 bg-black/80 rounded-full text-[#d4af37] text-xs font-bold tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                    WAITING
                </div>

            </div>
        </main>
    );
}
