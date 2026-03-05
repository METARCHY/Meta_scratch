/**
 * @module conflict
 * Barrel export for the conflict module.
 */

export { detectConflicts } from './conflictDetector';
export { resolveConflictLogic } from './conflictResolver';
export type { ConflictResult, Conflict } from '@/lib/modules/core/types';
