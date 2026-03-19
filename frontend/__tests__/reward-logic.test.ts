import { describe, it, expect } from 'vitest';
import { calculateReward } from '../lib/modules/resources/resourceManager';

describe('Reward Calculation Logic', () => {
    it('should grant 1 resource to a Poet (Scientist/Politician/Artist) on Win without bids', () => {
        expect(calculateReward('scientist', true, false, [], 'a1')).toBe(1);
    });

    it('should grant 3 resources to a Robot on Win without bids', () => {
        expect(calculateReward('robot', true, false, [], 'a1')).toBe(3);
    });

    it('should grant +1 bonus for successful Product bid on Win', () => {
        const bids = [{ actorId: 'a1', bid: 'product' }];
        expect(calculateReward('robot', true, false, bids, 'a1')).toBe(4);
        expect(calculateReward('scientist', true, false, bids, 'a1')).toBe(2);
    });

    it('should grant 1 resource on Truce (Draw) without bids', () => {
        expect(calculateReward('robot', false, true, [], 'a1')).toBe(1);
        expect(calculateReward('scientist', false, true, [], 'a1')).toBe(1);
    });

    it('should grant +1 bonus for successful Product bid on Truce', () => {
        const bids = [{ actorId: 'a1', bid: 'product' }];
        expect(calculateReward('robot', false, true, bids, 'a1')).toBe(2);
        expect(calculateReward('scientist', false, true, bids, 'a1')).toBe(2);
    });

    it('should NOT grant bonus if the bid belongs to someone else', () => {
        const bids = [{ actorId: 'other', bid: 'product' }];
        expect(calculateReward('robot', true, false, bids, 'a1')).toBe(3);
        expect(calculateReward('robot', false, true, bids, 'a1')).toBe(1);
    });
});
