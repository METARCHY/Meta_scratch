import fs from 'fs';
import path from 'path';
import { CitizenService } from './CitizenService';

const citizensFilePath = path.join(process.cwd(), 'data', 'citizens.json');

export class LocalCitizenService implements CitizenService {
    constructor() {
        if (!fs.existsSync(path.dirname(citizensFilePath))) {
            fs.mkdirSync(path.dirname(citizensFilePath), { recursive: true });
        }
        if (!fs.existsSync(citizensFilePath)) {
            fs.writeFileSync(citizensFilePath, '[]', 'utf-8');
        }
    }

    private readCitizens(): any[] {
        try {
            const fileData = fs.readFileSync(citizensFilePath, 'utf-8');
            return JSON.parse(fileData);
        } catch (error) {
            console.error("Error reading citizens file:", error);
            return [];
        }
    }

    private writeCitizens(citizens: any[]) {
        try {
            fs.writeFileSync(citizensFilePath, JSON.stringify(citizens, null, 2), 'utf-8');
        } catch (error) {
            console.error("Error writing citizens file:", error);
        }
    }

    async getAll(): Promise<any[]> {
        return this.readCitizens();
    }

    async getById(id: string): Promise<any | undefined> {
        const citizens = this.readCitizens();
        return citizens.find(c => c.citizenId === id);
    }

    async update(id: string, updates: any): Promise<any | null> {
        const citizens = this.readCitizens();
        const index = citizens.findIndex(c => c.citizenId === id);
        if (index === -1) return null;

        const updatedCitizen = { ...citizens[index], ...updates };
        citizens[index] = updatedCitizen;
        this.writeCitizens(citizens);
        return updatedCitizen;
    }

    async delete(id: string): Promise<boolean> {
        const citizens = this.readCitizens();
        const initialLength = citizens.length;
        const remainingCitizens = citizens.filter(c => c.citizenId !== id);

        if (remainingCitizens.length < initialLength) {
            this.writeCitizens(remainingCitizens);
            return true;
        }
        return false;
    }
}
