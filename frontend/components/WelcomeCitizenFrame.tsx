import React from 'react';

interface WelcomeCitizenFrameProps {
    children?: React.ReactNode;
    className?: string;
}

export function WelcomeCitizenFrame({
    children,
    className = ""
}: WelcomeCitizenFrameProps) {
    return (
        <div className={`relative w-[480px] h-[240px] flex flex-col items-center justify-center ${className}`}>

            {/* Background Container with Gradient Border */}
            <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-b from-[#8A7F53] via-[#A89365] to-[#6E5F42]">
                <div className="absolute inset-0 bg-[#131417]/95 rounded-xl backdrop-blur-md" />

                {/* Inner Bezel/Details */}
                <div className="absolute inset-[4px] border border-[#d4af37]/20 rounded-lg pointer-events-none" />

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4af37] rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4af37] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4af37] rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4af37] rounded-br-xl" />
            </div>

            {/* Header Title */}
            <div className="absolute top-5 w-full flex justify-center z-10">
                <div className="px-6 py-1 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent border-y border-[#d4af37]/30 backdrop-blur-sm">
                    <span className="text-[#d4af37] font-bold text-xs tracking-[0.2em] uppercase drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">
                        WELCOME NEW CITIZEN
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center pt-8 px-8 gap-4">
                {children}
            </div>
        </div>
    );
}
