import React from 'react';

interface TurnControlsProps {
    turn: number;
    phase: number;
    phaseName: string;
    onNextPhase?: () => void;
}

export default function TurnControls({ turn, phase, phaseName, onNextPhase }: TurnControlsProps) {
    return (
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-50">
            <div className="bg-black/80 backdrop-blur border border-[#d4af37]/30 p-4 rounded-xl shadow-2xl flex flex-col items-end min-w-[200px]">
                <div className="text-[#d4af37] text-xs font-mono uppercase tracking-[0.2em] mb-1">Turn {turn}</div>
                <div className="text-2xl font-bold text-white font-serif tracking-widest mb-1">{phaseName}</div>
                <div className="text-gray-500 text-[10px] uppercase tracking-wide">Phase {phase} / 5</div>
            </div>

            <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                {/* Debug Controls */}
                {[1, 2, 3, 4, 5].map(p => (
                    <div key={p} className={`w-2 h-2 rounded-full ${phase === p ? 'bg-[#d4af37]' : 'bg-gray-700'}`} />
                ))}
            </div>
        </div>
    );
}
