"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the game state
interface Player {
    name: string;
    address: string;
    citizenId?: string;
    avatar?: string;
}

interface Lobby {
    id?: string;
    roomName: string;
    maxPlayers: number;
    players: Player[];
    status: 'idle' | 'waiting' | 'ready';
}

interface GameState {
    resources: {
        gato: number;
        product: number; energy: number; recycle: number;
        power: number; art: number; knowledge: number; glory: number;
    };
    player: Player;
    lobby: Lobby;
    games: any[];
    updateResource: (resource: string, amount: number) => void;
    setPlayerName: (name: string) => void;
    setPlayerAddress: (address: string) => void;
    setCitizenId: (id: string) => void;
    setPlayerAvatar: (avatar: string) => void;
    setPlayer: (player: Player) => void;
    createRoom: (name: string, maxPlayers: number, isPrivate: boolean, id?: string, isTest?: boolean) => Promise<any>;
    joinRoom: (gameId: string, player: Player) => Promise<void>;
    leaveRoom: () => void;
}

const initialState: GameState = {
    resources: {
        gato: 1000,
        product: 1, energy: 1, recycle: 1,
        power: 0, art: 0, knowledge: 0, glory: 0
    },
    player: {
        name: "",
        address: "",
        citizenId: "0000",
        avatar: "",
    },
    lobby: {
        id: "",
        roomName: "",
        maxPlayers: 4,
        players: [],
        status: 'idle'
    },
    games: [],
    updateResource: () => { },
    setPlayerName: () => { },
    setPlayerAddress: () => { },
    setCitizenId: () => { },
    setPlayerAvatar: () => { },
    setPlayer: () => { },
    createRoom: async () => { },
    joinRoom: async () => { },
    leaveRoom: () => { },
};

const GameStateContext = createContext<GameState>(initialState);

export function GameStateProvider({ children }: { children: ReactNode }) {
    const [resources, setResources] = useState(initialState.resources);
    const [player, setPlayer] = useState(initialState.player);
    const [lobby, setLobby] = useState(initialState.lobby);

    const updateResource = (resource: string, amount: number) => {
        setResources(prev => ({ ...prev, [resource]: amount }));
    };

    const setPlayerName = (name: string) => {
        setPlayer(prev => ({ ...prev, name }));
    };

    const setPlayerAddress = (address: string) => {
        setPlayer(prev => ({ ...prev, address }));
    };

    const setCitizenId = (id: string) => {
        setPlayer(prev => ({ ...prev, citizenId: id }));
    };

    const setPlayerAvatar = (avatar: string) => {
        setPlayer(prev => ({ ...prev, avatar }));
    };

    const setPlayerUpdate = (newPlayer: Player) => {
        setPlayer(newPlayer);
    };

    const [games, setGames] = useState<any[]>([]);

    // Poll for games list
    React.useEffect(() => {
        const fetchGames = async () => {
            try {
                const res = await fetch('/api/games');
                if (res.ok) {
                    const data = await res.json();
                    setGames(data);
                }
            } catch (error) {
                console.error("Failed to fetch games", error);
            }
        };

        fetchGames();
        const interval = setInterval(fetchGames, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, []);

    const createRoom = async (name: string, maxPlayers: number, isPrivate: boolean, id?: string, isTest?: boolean) => {
        try {
            const res = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, roomName: name, maxPlayers, hostPlayer: player, isPrivate, isTest })
            });

            if (res.ok) {
                const game = await res.json();
                setLobby({
                    id: game.id,
                    roomName: game.roomId,
                    maxPlayers: game.maxPlayers,
                    players: game.players,
                    status: 'waiting'
                });
                return game.id;
            }
        } catch (error) {
            console.error("Failed to create room", error);
        }
    };

    const joinRoom = async (gameId: string, joinPlayer: Player) => {
        try {
            const res = await fetch(`/api/games/${gameId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'join', player: joinPlayer })
            });

            if (res.ok) {
                const game = await res.json();
                setLobby({
                    id: game.id,
                    roomName: game.roomId,
                    maxPlayers: game.maxPlayers,
                    players: game.players,
                    status: game.players.length >= game.maxPlayers ? 'ready' : 'waiting'
                });
            }
        } catch (error) {
            console.error("Failed to join room", error);
        }
    };

    const leaveRoom = () => {
        setLobby(initialState.lobby);
    };

    return (
        <GameStateContext.Provider value={{
            resources, player, lobby, games,
            updateResource, setPlayerName, setPlayerAddress, setCitizenId, setPlayerAvatar, setPlayer: setPlayerUpdate,
            createRoom, joinRoom, leaveRoom
        }}>
            {children}
        </GameStateContext.Provider>
    );
}

export function useGameState() {
    const context = useContext(GameStateContext);
    if (!context) {
        throw new Error("useGameState must be used within a GameStateProvider");
    }
    return context;
}
