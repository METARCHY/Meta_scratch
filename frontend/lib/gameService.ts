import fs from 'fs';
import path from 'path';
import { Game, Player } from './types';

const gamesFilePath = path.join(process.cwd(), 'data', 'games.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(gamesFilePath))) {
    fs.mkdirSync(path.dirname(gamesFilePath), { recursive: true });
}

// Ensure games file exists
if (!fs.existsSync(gamesFilePath)) {
    fs.writeFileSync(gamesFilePath, '[]', 'utf-8');
}

function readGames(): Game[] {
    try {
        const fileData = fs.readFileSync(gamesFilePath, 'utf-8');
        const parsed = JSON.parse(fileData);
        // Filter out invalid entries without an id to prevent ghost games
        return parsed.filter((g: any) => g && g.id);
    } catch (error) {
        console.error("Error reading games file:", error);
        return [];
    }
}

function writeGames(games: Game[]) {
    try {
        fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing games file:", error);
    }
}

export const gameService = {
    getAll: (): Game[] => {
        return readGames();
    },

    getById: (id: string): Game | undefined => {
        const games = readGames();
        return games.find(g => g.id === id);
    },

    create: (game: Game): Game => {
        const games = readGames();
        games.push(game);
        writeGames(games);
        return game;
    },

    update: (id: string, updates: Partial<Game>): Game | null => {
        const games = readGames();
        const index = games.findIndex(g => g.id === id);
        if (index === -1) return null;

        const updatedGame = { ...games[index], ...updates };
        
        // Deep merge gameState if it exists in both
        if (updates.gameState && games[index].gameState) {
            updatedGame.gameState = {
                ...games[index].gameState,
                ...updates.gameState
            };
        }
        
        games[index] = updatedGame;
        writeGames(games);
        return updatedGame;
    },

    addPlayer: (gameId: string, player: Player): Game | null => {
        const games = readGames();
        const index = games.findIndex(g => g.id === gameId);
        if (index === -1) return null;

        const game = games[index];

        // Check if player already exists
        if (game.players.some(p => p.citizenId === player.citizenId)) {
            return game;
        }

        if (game.players.length >= game.maxPlayers) {
            throw new Error("Game is full");
        }

        game.players.push(player);
        games[index] = game;
        writeGames(games);
        return game;
    },

    delete: (id: string): boolean => {
        const games = readGames();
        const index = games.findIndex(g => g.id === id);
        if (index === -1) return false;

        games[index] = { ...games[index], status: 'deleted', deletedAt: Date.now() };
        writeGames(games);
        return true;
    },

    restore: (id: string): boolean => {
        const games = readGames();
        const index = games.findIndex(g => g.id === id);
        if (index === -1) return false;

        const { deletedAt, ...rest } = games[index] as any;
        games[index] = { ...rest, status: 'finished' };
        writeGames(games);
        return true;
    },

    hardDelete: (id: string): boolean => {
        const games = readGames();
        const initialLength = games.length;
        const remaining = games.filter(g => g.id !== id);
        if (remaining.length < initialLength) {
            writeGames(remaining);
            return true;
        }
        return false;
    },

    deleteAllActive: (): void => {
        const games = readGames();
        const now = Date.now();
        const updatedGames = games.map(g =>
            g.status !== 'deleted' ? { ...g, status: 'deleted' as const, deletedAt: now } : g
        );
        writeGames(updatedGames);
    }
};
