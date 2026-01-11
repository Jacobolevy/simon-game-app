import { describe, it, expect } from 'vitest';
import { getLevelFromXP, getXPForLevel } from '../../src/lib/gameLogic/levelSystem';

describe('levelSystem', () => {
  it('getXPForLevel follows tiered multiplier + linear within-tier increment', () => {
    expect(getXPForLevel(1)).toBe(100);
    expect(getXPForLevel(2)).toBe(110);
    expect(getXPForLevel(10)).toBe(190);

    // Tier doubles every 10 levels
    expect(getXPForLevel(11)).toBe(200);
    expect(getXPForLevel(12)).toBe(210);

    expect(getXPForLevel(21)).toBe(400);
    expect(getXPForLevel(22)).toBe(410);
  });

  it('getLevelFromXP returns correct level at boundaries', () => {
    // Level 1 starts at 0 XP
    expect(getLevelFromXP(0).level).toBe(1);
    expect(getLevelFromXP(0).nextLevelXP).toBe(100);

    // Exactly level-up boundary: 100 XP means you are at level 2
    const at2 = getLevelFromXP(100);
    expect(at2.level).toBe(2);
    expect(at2.currentLevelXP).toBe(0);
    expect(at2.nextLevelXP).toBe(110);
    expect(at2.progressPercent).toBe(0);
  });

  it('getLevelFromXP matches tier boundary at level 11', () => {
    // XP required to reach level 11 is sum(level 1..10)
    // Each is 100 + 10*withinIndex, sum = 10*100 + 10*(0+...+9) = 1000 + 450 = 1450
    const at11 = getLevelFromXP(1450);
    expect(at11.level).toBe(11);
    expect(at11.currentLevelXP).toBe(0);
    expect(at11.nextLevelXP).toBe(200);
    expect(at11.progressPercent).toBe(0);

    const mid11 = getLevelFromXP(1450 + 50);
    expect(mid11.level).toBe(11);
    expect(mid11.currentLevelXP).toBe(50);
    expect(mid11.nextLevelXP).toBe(200);
    expect(mid11.progressPercent).toBeCloseTo(25, 6);
  });

  it('handles negative/invalid XP defensively', () => {
    expect(getLevelFromXP(-100).level).toBe(1);
    expect(getLevelFromXP(Number.NaN).level).toBe(1);
    expect(getLevelFromXP(Number.POSITIVE_INFINITY).level).toBeGreaterThanOrEqual(1);
  });
});

