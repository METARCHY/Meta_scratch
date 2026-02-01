"use client";

import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';

interface ExchangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (resource: 'authority' | 'influence' | 'media') => void;
    targetName: string;
}

const RESOURCES = [
    { id: 'authority', label: 'Authority', color: '#B33951', icon: '🏛️' },
    { id: 'influence', label: 'Influence', color: '#EAC435', icon: '🤝' },
    { id: 'media', label: 'Media', color: '#5B7553', icon: '📡' }
] as const;

export default function ExchangeModal({ isOpen, onClose, onConfirm, targetName }: ExchangeModalProps) {
    const [selected, setSelected] = useState<'authority' | 'influence' | 'media' | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                            <ArrowRightLeft className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <h3 className="font-rajdhani font-bold text-xl text-white tracking-wide">RESOURCE EXCHANGE</h3>
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
                        Select an intangible resource to swap with <span className="text-white font-bold">{targetName}</span>.
                        <br />
                        <span className="text-xs text-gray-500 italic">This will consume 1 Exchange card.</span>
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {RESOURCES.map((res) => (
                            <button
                                key={res.id}
                                onClick={() => setSelected(res.id)}
                                className={`
                                    relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all
                                    ${selected === res.id
                                        ? 'bg-white/10 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)] scale-105'
                                        : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                                    }
                                `}
                            >
                                <div className="text-3xl">{res.icon}</div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${selected === res.id ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                                    {res.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/10 transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            disabled={!selected}
                            onClick={() => selected && onConfirm(selected)}
                            className={`
                                flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all
                                ${selected
                                    ? 'bg-[#d4af37] text-black hover:brightness-110 shadow-lg cursor-pointer'
                                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                }
                            `}
                        >
                            CONFIRM SWAP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
