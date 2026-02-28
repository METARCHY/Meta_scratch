"use client";

import React, { useEffect, useState } from 'react';
import { useTooltip } from '@/context/TooltipContext';

export default function CursorTooltip() {
    const { content } = useTooltip();
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setCoords({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if (content) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [content]);

    if (!content || !isVisible) return null;

    return (
        <div
            className="fixed pointer-events-none z-[9999] transition-opacity duration-150"
            style={{
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                transform: 'translate(16px, 16px)' // Offset so cursor doesn't cover it
            }}
        >
            <div className="bg-black/90 text-[#d4af37] border border-[#d4af37]/50 px-3 py-1.5 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md">
                <div className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                    {content}
                </div>
            </div>
        </div>
    );
}
