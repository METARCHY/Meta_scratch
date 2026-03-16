import { Game, Player } from '../types';

export interface GameService {
    getAll(): Promise<Game[]>;
    getById(id: string): Promise<Game | undefined>;
    create(game: Game): Promise<Game>;
    update(id: string, updates: Partial<Game>): Promise<Game | null>;
    addPlayer(gameId: string, player: Player): Promise<Game | null>;
    delete(id: string): Promise<boolean>;
    hardDelete(id: string): Promise<boolean>;
    restore?(id: string): Promise<boolean>;
    deleteAllActive?(): Promise<void>;
}
