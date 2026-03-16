export interface CitizenService {
    getAll(): Promise<any[]>;
    getById(id: string): Promise<any | undefined>;
    update(id: string, updates: any): Promise<any | null>;
    delete(id: string): Promise<boolean>;
}
