import fs from 'fs';
import path from 'path';
import { Game, Player } from '../types';
import { GameService } from './GameService';

const gamesFilePath = path.join(process.cwd(), 'data', 'games.json');

export class LocalGameService implements GameService {
    constructor() {
        // Ensure data directory exists
        if (!fs.existsSync(path.dirname(gamesFilePath))) {
            fs.mkdirSync(path.dirname(gamesFilePath), { recursive: true });
        }

        // Ensure games file exists
        if (!fs.existsSync(gamesFilePath)) {
            fs.writeFileSync(gamesFilePath, '[]', 'utf-8');
        }
    }

    private readGames(): Game[] {
        try {
            const fileData = fs.readFileSync(gamesFilePath, 'utf-8');
            const parsed = JSON.parse(fileData);
            return parsed.filter((g: any) => g && g.id);
        } catch (error) {
            console.error("Error reading games file:", error);
            return [];
        }
    }

    private writeGames(games: Game[]) {
        try {
            fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2), 'utf-8');
        } catch (error) {
            console.error("Error writing games file:", error);
        }
    }

    async getAll(): Promise<Game[]> {
        return this.readGames();
    }

    async getById(id: string): Promise<Game | undefined> {
        const games = this.readGames();
        return games.find(g => g.id === id);
    }

    async create(game: Game): Promise<Game> {
        const games = this.readGames();
        games.push(game);
        this.writeGames(games);
        return game;
    }

    async update(id: string, updates: Partial<Game>): Promise<Game | null> {
        const games = this.readGames();
        const index = games.findIndex(g => g.id === id);
        if (index === -1) return null;

        const updatedGame = { ...games[index], ...updates };
        
        if (updates.gameState && games[index].gameState) {
            updatedGame.gameState = {
                ...games[index].gameState,
                ...updates.gameState,
                playerInventories: {
                    ...(games[index].gameState.playerInventories || {}),
                    ...(updates.gameState.playerInventories || {})
                }
            };
        }
        
        games[index] = updatedGame;
        this.writeGames(games);
        return updatedGame;
    }

    async addPlayer(gameId: string, player: Player): Promise<Game | null> {
        const games = this.readGames();
        const index = games.findIndex(g => g.id === gameId);
        if (index === -1) return null;

        const game = games[index];

        if (game.players.some(p => p.citizenId === player.citizenId)) {
            return game;
        }

        if (game.players.length >= game.maxPlayers) {
            throw new Error("Game is full");
        }

        game.players.push(player);
        games[index] = game;
        this.writeGames(games);
        return game;
    }

    async delete(id: string): Promise<boolean> {
        const games = this.readGames();
        const index = games.findIndex(g => g.id === id);
        if (index === -1) return false;

        games[index] = { ...games[index], status: 'deleted', deletedAt: Date.now() };
        this.writeGames(games);
        return true;
    }

    async restore(id: string): Promise<boolean> {
        const games = this.readGames();
        const index = games.findIndex(g => g.id === id);
        if (index === -1) return false;

        const { deletedAt, ...rest } = games[index] as any;
        games[index] = { ...rest, status: 'finished' };
        this.writeGames(games);
        return true;
    }

    async hardDelete(id: string): Promise<boolean> {
        const games = this.readGames();
        const initialLength = games.length;
        const remaining = games.filter(g => g.id !== id);
        if (remaining.length < initialLength) {
            this.writeGames(remaining);
            return true;
        }
        return false;
    }

    async deleteAllActive(): Promise<void> {
        const games = this.readGames();
        const now = Date.now();
        const updatedGames = games.map(g =>
            g.status !== 'deleted' ? { ...g, status: 'deleted' as const, deletedAt: now } : g
        );
        this.writeGames(updatedGames);
    }
}
