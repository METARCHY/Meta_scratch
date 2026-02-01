import React from 'react';
import Image from 'next/image';

interface PlayersPanelProps {
    players?: any[]; // Replace with proper Player type later
    currentTurnPlayerId?: string;
}

export default function PlayersPanel({ players = [] }: PlayersPanelProps) {
    // Mock players if empty for UI dev
    const displayPlayers = players.length > 0 ? players : [
        { id: 'p2', name: 'Corporation', avatar: '/avatars/avatar_corp.png', color: '#ff4444' },
        { id: 'p3', name: 'Rebels', avatar: '/avatars/avatar_rebel.png', color: '#44ff44' },
        { id: 'p4', name: 'Union', avatar: '/avatars/avatar_union.png', color: '#4444ff' },
    ];

    return (
        <div className="absolute top-4 left-4 flex flex-col gap-4 z-40">
            {displayPlayers.map((p, i) => (
                <div key={i} className="relative group">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-700 bg-black overflow-hidden hover:border-[#d4af37] transition-all shadow-lg flex items-center justify-center">
                        {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">{p.name?.[0]}</div>
                        )}
                    </div>
                    <div className="absolute left-14 top-2 bg-black/80 px-3 py-1 rounded text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 pointer-events-none">
                        {p.name}
                    </div>
                </div>
            ))}
        </div>
    );
}
