/**
 * @deprecated Use conflictDetector from '@/lib/modules/conflict' instead.
 * Kept for backward compatibility.
 */
import type { PlacedActor } from '@/lib/modules/core/types';

export const getConflicts = (actors: PlacedActor[]) => {
    const locations = Array.from(new Set(actors.map(a => a.locId)));
    const conflicts: any[] = [];

    locations.forEach(locId => {
        const atLoc = actors.filter(a => a.locId === locId);
        if (atLoc.length < 2) return;

        const actorsByType: { [key: string]: PlacedActor[] } = {};
        atLoc.forEach(a => {
            const actorType = a.actorType || 'unknown';
            if (!actorsByType[actorType]) actorsByType[actorType] = [];
            actorsByType[actorType].push(a);
        });

        Object.entries(actorsByType).forEach(([actorType, actorsOfType]) => {
            if (actorsOfType.length > 1) {
                conflicts.push({
                    id: `conflict_${locId}_${actorType}`,
                    locId,
                    actorType,
                    actors: actorsOfType,
                    status: 'pending'
                });
            }
        });
    });
    return conflicts;
};
