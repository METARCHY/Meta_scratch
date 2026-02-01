import React from 'react';
import { cn } from '@/lib/utils';

interface MetarchyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'gold' | 'blue' | 'green' | 'red';
    className?: string;
    width?: string;
    height?: string;
}

export default function MetarchyButton({
    children,
    variant = 'gold',
    className,
    width = 'w-[222px]',
    height = 'h-[44px]',
    ...props
}: MetarchyButtonProps) {

    const variants = {
        gold: {
            gradient: "from-[#8A7F53] via-[#A89365] to-[#6E5F42]",
            border: "border-[#47423A]",
            text: "text-[#d4af37]"
        },
        blue: {
            gradient: "from-[#1e3a8a] via-[#3b82f6] to-[#1e40af]",
            border: "border-[#1e3a8a]",
            text: "text-[#60a5fa]"
        },
        green: {
            gradient: "from-[#14532d] via-[#22c55e] to-[#15803d]",
            border: "border-[#14532d]",
            text: "text-[#4ade80]"
        },
        red: {
            gradient: "from-[#7f1d1d] via-[#ef4444] to-[#991b1b]",
            border: "border-[#7f1d1d]",
            text: "text-[#f87171]"
        }
    };

    const currentVariant = variants[variant];

    return (
        <button
            className={cn(
                "relative group hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center",
                width,
                height,
                className
            )}
            {...props}
        >
            {/* Outer Gradient (Border Effect) */}
            <div className={cn(
                "absolute inset-0 rounded-[20px] bg-gradient-to-b opacity-100 transition-all duration-300",
                currentVariant.gradient,
                "group-hover:opacity-100 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            )} />

            {/* Inner Dark Background */}
            <div className={cn(
                "absolute inset-[1px] rounded-[19px] border bg-[#1a1a1c]/90 backdrop-blur-sm",
                currentVariant.border
            )} />

            {/* Content */}
            <span className={cn(
                "relative z-10 font-bold tracking-widest uppercase text-xs transition-colors duration-300 group-hover:text-white font-rajdhani",
                currentVariant.text
            )}>
                {children}
            </span>
        </button>
    );
}
