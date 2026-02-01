"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TooltipContextType {
    showTooltip: (content: ReactNode) => void;
    hideTooltip: () => void;
    content: ReactNode | null;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export function TooltipProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<ReactNode | null>(null);

    const showTooltip = (node: ReactNode) => setContent(node);
    const hideTooltip = () => setContent(null);

    return (
        <TooltipContext.Provider value={{ showTooltip, hideTooltip, content }}>
            {children}
        </TooltipContext.Provider>
    );
}

export function useTooltip() {
    const context = useContext(TooltipContext);
    if (!context) {
        throw new Error("useTooltip must be used within a TooltipProvider");
    }
    return context;
}
