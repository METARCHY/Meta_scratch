import { describe, it, expect } from 'vitest';
import { rpsOutcome } from '@/lib/modules/core/constants';

describe('RPS Logic', () => {
  it('should correctly determine Rock vs Scissors', () => {
    expect(rpsOutcome('rock', 'scissors')).toBe('win');
  });

  it('should correctly determine Paper vs Rock', () => {
    expect(rpsOutcome('paper', 'rock')).toBe('win');
  });

  it('should correctly determine Scissors vs Paper', () => {
    expect(rpsOutcome('scissors', 'paper')).toBe('win');
  });

  it('should correctly handle Draws', () => {
    expect(rpsOutcome('rock', 'rock')).toBe('draw');
  });

  it('should handle Dummy loses to everything', () => {
    expect(rpsOutcome('dummy', 'rock')).toBe('lose');
    expect(rpsOutcome('dummy', 'paper')).toBe('lose');
    expect(rpsOutcome('dummy', 'scissors')).toBe('lose');
  });
});
