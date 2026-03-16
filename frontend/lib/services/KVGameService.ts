import { kv } from '@vercel/kv';
import { Game, Player } from '../types';
import { GameService } from './GameService';

export class KVGameService implements GameService {
    private readonly GAME_PREFIX = 'game:';
    private readonly ALL_GAMES_KEY = 'games:all';

    async getAll(): Promise<Game[]> {
        const ids = await kv.smembers(this.ALL_GAMES_KEY);
        if (ids.length === 0) return [];
        
        const pipeline = kv.pipeline();
        ids.forEach(id => pipeline.get(`${this.GAME_PREFIX}${id}`));
        const games = await pipeline.exec();
        
        return (games as Game[]).filter(g => g && g.id);
    }

    async getById(id: string): Promise<Game | undefined> {
        const game = await kv.get<Game>(`${this.GAME_PREFIX}${id}`);
        return game || undefined;
    }

    async create(game: Game): Promise<Game> {
        await Promise.all([
            kv.set(`${this.GAME_PREFIX}${game.id}`, game),
            kv.sadd(this.ALL_GAMES_KEY, game.id)
        ]);
        return game;
    }

    async update(id: string, updates: Partial<Game>): Promise<Game | null> {
        const game = await this.getById(id);
        if (!game) return null;

        const updatedGame = { ...game, ...updates };

        if (updates.gameState && game.gameState) {
            updatedGame.gameState = {
                ...game.gameState,
                ...updates.gameState,
                playerInventories: {
                    ...(game.gameState.playerInventories || {}),
                    ...(updates.gameState.playerInventories || {})
                }
            };
        }

        await kv.set(`${this.GAME_PREFIX}${id}`, updatedGame);
        return updatedGame;
    }

    async addPlayer(gameId: string, player: Player): Promise<Game | null> {
        const game = await this.getById(gameId);
        if (!game) return null;

        if (game.players.some(p => p.citizenId === player.citizenId)) {
            return game;
        }

        if (game.players.length >= game.maxPlayers) {
            throw new Error("Game is full");
        }

        game.players.push(player);
        await kv.set(`${this.GAME_PREFIX}${gameId}`, game);
        return game;
    }

    async delete(id: string): Promise<boolean> {
        const game = await this.getById(id);
        if (!game) return false;

        const updatedGame = { ...game, status: 'deleted' as const, deletedAt: Date.now() };
        await kv.set(`${this.GAME_PREFIX}${id}`, updatedGame);
        return true;
    }

    async restore(id: string): Promise<boolean> {
        const game = await this.getById(id);
        if (!game) return false;

        const { deletedAt, ...rest } = game as any;
        const updatedGame = { ...rest, status: 'finished' as const };
        await kv.set(`${this.GAME_PREFIX}${id}`, updatedGame);
        return true;
    }

    async hardDelete(id: string): Promise<boolean> {
        const exists = await kv.exists(`${this.GAME_PREFIX}${id}`);
        if (!exists) return false;

        await Promise.all([
            kv.del(`${this.GAME_PREFIX}${id}`),
            kv.srem(this.ALL_GAMES_KEY, id)
        ]);
        return true;
    }

    async deleteAllActive(): Promise<void> {
        const games = await this.getAll();
        const now = Date.now();
        const pipeline = kv.pipeline();
        
        games.forEach(g => {
            if (g.status !== 'deleted') {
                const updated = { ...g, status: 'deleted' as const, deletedAt: now };
                pipeline.set(`${this.GAME_PREFIX}${g.id}`, updated);
            }
        });
        
        await pipeline.exec();
    }
}
