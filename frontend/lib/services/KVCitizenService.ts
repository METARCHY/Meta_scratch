import { kv } from '@vercel/kv';
import { CitizenService } from './CitizenService';

export class KVCitizenService implements CitizenService {
    private readonly CITIZEN_PREFIX = 'citizen:';
    private readonly ALL_CITIZENS_KEY = 'citizens:all';

    async getAll(): Promise<any[]> {
        const ids = await kv.smembers(this.ALL_CITIZENS_KEY);
        if (ids.length === 0) return [];

        const pipeline = kv.pipeline();
        ids.forEach(id => pipeline.get(`${this.CITIZEN_PREFIX}${id}`));
        const citizens = await pipeline.exec();

        return (citizens as any[]).filter(c => c && c.citizenId);
    }

    async getById(id: string): Promise<any | undefined> {
        const citizen = await kv.get<any>(`${this.CITIZEN_PREFIX}${id}`);
        return citizen || undefined;
    }

    async update(id: string, updates: any): Promise<any | null> {
        const citizen = await this.getById(id);
        const current = citizen || { citizenId: id }; // Create if doesn't exist? (Based on old logic)
        
        const updatedCitizen = { ...current, ...updates };

        await Promise.all([
            kv.set(`${this.CITIZEN_PREFIX}${id}`, updatedCitizen),
            kv.sadd(this.ALL_CITIZENS_KEY, id)
        ]);
        
        return updatedCitizen;
    }

    async delete(id: string): Promise<boolean> {
        const exists = await kv.exists(`${this.CITIZEN_PREFIX}${id}`);
        if (!exists) return false;

        await Promise.all([
            kv.del(`${this.CITIZEN_PREFIX}${id}`),
            kv.srem(this.ALL_CITIZENS_KEY, id)
        ]);
        return true;
    }
}
