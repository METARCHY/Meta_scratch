import { LocalGameService } from './LocalGameService';
import { KVGameService } from './KVGameService';
import { GameService } from './GameService';
import { LocalCitizenService } from './LocalCitizenService';
import { KVCitizenService } from './KVCitizenService';
import { CitizenService } from './CitizenService';

export const gameService: GameService = process.env.KV_REST_API_URL
    ? new KVGameService()
    : new LocalGameService();

export const citizenService: CitizenService = process.env.KV_REST_API_URL
    ? new KVCitizenService()
    : new LocalCitizenService();
