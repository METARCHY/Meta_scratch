"use client";

import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import Image from 'next/image';

interface ExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (give: 'power' | 'art' | 'wisdom', take: 'power' | 'art' | 'wisdom') => void;
    targetName: string;
    targetAvatar: string;
    playerName: string;
    playerAvatar: string;
    playerResources: Record<string, number>;
    opponentResources: Record<string, number>;
}

const RESOURCES = [
    { id: 'power', label: 'Power', icon: '/intangibles/resource_power.png' },
    { id: 'art', label: 'Art', icon: '/intangibles/resource_Art.png' },
    { id: 'wisdom', label: 'Wisdom', icon: '/intangibles/resource_wisdom.png' }
] as const;

type ResourceId = 'power' | 'art' | 'wisdom';

export default function ExchangeModal({
    isOpen,
    onClose,
    onConfirm,
    targetName,
    targetAvatar,
    playerName,
    playerAvatar,
    playerResources,
    opponentResources
}: ExchangeModalProps) {
    const [give, setGive] = useState<ResourceId | null>(null);
    const [take, setTake] = useState<ResourceId | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                            <ArrowRightLeft className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <h3 className="font-rajdhani font-bold text-xl text-white tracking-wide uppercase">Resource Exchange</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-400 text-sm mb-6 text-center">
                        Select a resource to <span className="text-red-400 font-bold uppercase">give</span> and a resource to <span className="text-green-400 font-bold uppercase">take</span>.
                    </p>

                    <div className="flex items-stretch justify-between gap-6 mb-8">
                        {/* MY RESOURCES COLUMN (GIVE) */}
                        <div className="flex-1 flex flex-col items-center bg-[#1a1c23]/50 rounded-xl p-4 border border-white/5">
                            {/* Player Header */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#d4af37] mb-2 shadow-lg">
                                    <Image src={playerAvatar} fill className="object-cover" alt={playerName} />
                                </div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest">{playerName}</h4>
                                <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold mt-1">Gives</span>
                            </div>

                            {/* Resources Grid */}
                            <div className="flex flex-col gap-3 w-full">
                                {RESOURCES.map((res) => {
                                    const resourceKey = res.id === 'wisdom' ? 'knowledge' : res.id;
                                    const count = Number(playerResources[resourceKey]) || 0;
                                    const isDisabled = count <= 0;

                                    return (
                                        <button
                                            key={`give-${res.id}`}
                                            disabled={isDisabled}
                                            onClick={() => setGive(res.id)}
                                            className={`
                                                relative flex items-center gap-3 p-3 rounded-xl border transition-all w-full
                                                ${give === res.id
                                                    ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                                    : isDisabled
                                                        ? 'bg-black/20 border-white/5 opacity-30 grayscale cursor-not-allowed'
                                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                                }
                                            `}
                                        >
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                <Image src={res.icon} fill className="object-contain" alt={res.label} />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${give === res.id ? 'text-red-400' : 'text-gray-400'}`}>
                                                    {res.label}
                                                </span>
                                                <span className="text-[10px] font-mono text-white/40">{count} available</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CENTER ARROW */}
                        <div className="flex flex-col items-center justify-center pt-8">
                            <div className="bg-[#1a1c23] p-3 rounded-full border border-[#d4af37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                                <ArrowRightLeft className="w-6 h-6 text-[#d4af37]" />
                            </div>
                        </div>

                        {/* OPPONENT RESOURCES COLUMN (TAKE) */}
                        <div className="flex-1 flex flex-col items-center bg-[#1a1c23]/50 rounded-xl p-4 border border-white/5">
                            {/* Opponent Header */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400/50 mb-2 shadow-lg">
                                    <Image src={targetAvatar} fill className="object-cover" alt={targetName} />
                                </div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest">{targetName}</h4>
                                <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold mt-1">Gives</span>
                            </div>

                            {/* Resources Grid */}
                            <div className="flex flex-col gap-3 w-full">
                                {RESOURCES.map((res) => {
                                    const resourceKey = res.id === 'wisdom' ? 'knowledge' : res.id;
                                    const count = Number(opponentResources[resourceKey]) || 0;
                                    const isDisabled = count <= 0;

                                    return (
                                        <button
                                            key={`take-${res.id}`}
                                            disabled={isDisabled}
                                            onClick={() => setTake(res.id)}
                                            className={`
                                                relative flex items-center gap-3 p-3 rounded-xl border transition-all w-full
                                                ${take === res.id
                                                    ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                                                    : isDisabled
                                                        ? 'bg-black/20 border-white/5 opacity-30 grayscale cursor-not-allowed'
                                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                                }
                                            `}
                                        >
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                <Image src={res.icon} fill className="object-contain" alt={res.label} />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${take === res.id ? 'text-green-400' : 'text-gray-400'}`}>
                                                    {res.label}
                                                </span>
                                                <span className="text-[10px] font-mono text-white/40">{count} available</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-gray-400 font-bold text-xs hover:bg-white/10 transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!(give && take)}
                            onClick={() => give && take && onConfirm(give, take)}
                            className={`
                                flex-1 py-3 px-4 rounded-lg font-bold text-xs transition-all uppercase tracking-widest
                                ${give && take
                                    ? 'bg-[#d4af37] text-black hover:brightness-110 shadow-lg cursor-pointer'
                                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                }
                            `}
                        >
                            Confirm Swap
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
