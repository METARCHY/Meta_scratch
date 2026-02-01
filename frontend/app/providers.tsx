"use client";

import { GameStateProvider } from "@/context/GameStateContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GameStateProvider>
            {children}
        </GameStateProvider>
    );
}
