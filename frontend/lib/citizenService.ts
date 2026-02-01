import fs from 'fs';
import path from 'path';

const citizensFilePath = path.join(process.cwd(), 'data', 'citizens.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(citizensFilePath))) {
    fs.mkdirSync(path.dirname(citizensFilePath), { recursive: true });
}

// Ensure citizens file exists
if (!fs.existsSync(citizensFilePath)) {
    fs.writeFileSync(citizensFilePath, '[]', 'utf-8');
}

function readCitizens(): any[] {
    try {
        const fileData = fs.readFileSync(citizensFilePath, 'utf-8');
        return JSON.parse(fileData);
    } catch (error) {
        console.error("Error reading citizens file:", error);
        return [];
    }
}

function writeCitizens(citizens: any[]) {
    try {
        fs.writeFileSync(citizensFilePath, JSON.stringify(citizens, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing citizens file:", error);
    }
}

export const citizenService = {
    getAll: (): any[] => {
        return readCitizens();
    },

    getById: (id: string): any | undefined => {
        const citizens = readCitizens();
        return citizens.find(c => c.citizenId === id);
    },

    update: (id: string, updates: any): any | null => {
        const citizens = readCitizens();
        const index = citizens.findIndex(c => c.citizenId === id);
        if (index === -1) return null;

        const updatedCitizen = { ...citizens[index], ...updates };
        citizens[index] = updatedCitizen;
        writeCitizens(citizens);
        return updatedCitizen;
    },

    delete: (id: string): boolean => {
        const citizens = readCitizens();
        const initialLength = citizens.length;
        const remainingCitizens = citizens.filter(c => c.citizenId !== id);

        if (remainingCitizens.length < initialLength) {
            writeCitizens(remainingCitizens);
            return true;
        }
        return false;
    }
};
