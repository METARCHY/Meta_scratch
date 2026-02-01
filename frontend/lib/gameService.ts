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
        return JSON.parse(fileData);
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
        const initialLength = games.length;
        const remainingGames = games.filter(g => g.id !== id);

        if (remainingGames.length < initialLength) {
            writeGames(remainingGames);
            return true;
        }
        return false;
    }
};
