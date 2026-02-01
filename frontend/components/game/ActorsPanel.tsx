import React from 'react';
import Image from 'next/image';
import ActorOrb from './ActorOrb';

interface Actor {
    id: string;
    avatar: string;
    name: string;
    type: string;
}

interface ActorsPanelProps {
    actors: Actor[];
    selectedActorId: string | null;
    onSelect: (id: string) => void;
    onHover?: (id: string) => void;
    onLeave?: () => void;
}

export default function ActorsPanel({ actors, selectedActorId, onSelect, onHover, onLeave }: ActorsPanelProps) {
    if (actors.length === 0) return null;

    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 bg-black/20 p-2 rounded-2xl border border-white/5 backdrop-blur-sm scale-75 origin-left">
            {actors.map(actor => (
                <ActorOrb
                    key={actor.id}
                    actor={actor}
                    isSelected={selectedActorId === actor.id}
                    onSelect={() => onSelect(actor.id)}
                    onHover={() => onHover?.(actor.id)}
                    onLeave={() => onLeave?.()}
                />
            ))}
            <div className="text-[10px] text-center text-gray-400 font-mono tracking-widest bg-black/40 rounded py-1">{actors.length} READY</div>
        </div>
    );
}
