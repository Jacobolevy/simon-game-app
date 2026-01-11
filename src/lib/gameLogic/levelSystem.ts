/**
 * Level System - Tiered Multiplier XP Curve
 *
 * Rules:
 * - Base XP per level: 100
 * - Every 10 levels (a "tier"), difficulty doubles
 * - Within a tier, a small linear increment is applied (+10 XP per level within that tier)
 *
 * Level 1 means "you are at level 1".
 * `getXPForLevel(level)` returns the XP needed to progress from `level` -> `level + 1`.
 */

const BASE_XP = 100;
const TIER_SIZE = 10;
const WITHIN_TIER_INCREMENT = 10;

// Precompute level thresholds for fast UI queries (levels 1–100).
const MAX_PRECOMPUTED_LEVEL = 100;

// XP required to go from level -> level+1 (index 1..MAX_PRECOMPUTED_LEVEL)
const XP_FOR_LEVEL_TABLE: number[] = (() => {
  const arr = new Array<number>(MAX_PRECOMPUTED_LEVEL + 1).fill(0);
  for (let level = 1; level <= MAX_PRECOMPUTED_LEVEL; level++) {
    arr[level] = xpForLevelFormula(level);
  }
  return arr;
})();

// Cumulative XP required to *reach* a given level (index 1..MAX_PRECOMPUTED_LEVEL+1)
// Example: XP_TO_REACH_LEVEL[1] = 0, XP_TO_REACH_LEVEL[2] = XP_FOR_LEVEL(1), ...
const XP_TO_REACH_LEVEL_TABLE: number[] = (() => {
  const arr = new Array<number>(MAX_PRECOMPUTED_LEVEL + 2).fill(0);
  arr[1] = 0;
  for (let level = 2; level <= MAX_PRECOMPUTED_LEVEL + 1; level++) {
    arr[level] = arr[level - 1] + XP_FOR_LEVEL_TABLE[level - 1];
  }
  return arr;
})();

function assertPositiveInt(name: string, value: number) {
  if (!Number.isFinite(value) || value < 1 || Math.floor(value) !== value) {
    throw new Error(`${name} must be a positive integer >= 1`);
  }
}

function clamp01(x: number) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function getTier(level: number) {
  // Tier 0: levels 1-10, Tier 1: 11-20, etc.
  return Math.floor((level - 1) / TIER_SIZE);
}

function getWithinTierIndex(level: number) {
  // 0..9 within the tier
  return (level - 1) % TIER_SIZE;
}

function xpForLevelFormula(level: number): number {
  const tier = getTier(level);
  const withinTier = getWithinTierIndex(level);
  const tierMultiplier = Math.pow(2, tier);
  return BASE_XP * tierMultiplier + WITHIN_TIER_INCREMENT * withinTier;
}

function sumConsecutiveInts(a: number, b: number): number {
  // Sum of integers from a..b inclusive, where a<=b
  return ((a + b) * (b - a + 1)) / 2;
}

function sumXPWithinTier(baseForTier: number, startWithin: number, count: number): number {
  // XP(level) = baseForTier + WITHIN_TIER_INCREMENT * withinIndex
  // Sum for within indices: startWithin .. startWithin + count - 1
  if (count <= 0) return 0;
  const endWithin = startWithin + count - 1;
  const linearSum = sumConsecutiveInts(startWithin, endWithin);
  return count * baseForTier + WITHIN_TIER_INCREMENT * linearSum;
}

function binarySearchLevelFromXP(totalXP: number): number {
  // Finds the greatest level L such that XP_TO_REACH_LEVEL_TABLE[L] <= totalXP,
  // within the precomputed range [1..MAX_PRECOMPUTED_LEVEL+1).
  let lo = 1;
  let hi = MAX_PRECOMPUTED_LEVEL + 1; // inclusive upper bound for reach array

  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (XP_TO_REACH_LEVEL_TABLE[mid] <= totalXP) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  // Clamp to max actual "level" we can return from lookup (1..MAX_PRECOMPUTED_LEVEL+1)
  // If totalXP equals XP_TO_REACH_LEVEL_TABLE[MAX+1], lo becomes MAX+1 (level 101).
  return lo;
}

/**
 * Returns XP needed to go from `level` to `level + 1`.
 */
export function getXPForLevel(level: number): number {
  assertPositiveInt('level', level);

  if (level <= MAX_PRECOMPUTED_LEVEL) {
    return XP_FOR_LEVEL_TABLE[level];
  }

  return xpForLevelFormula(level);
}

/**
 * Given total lifetime XP, returns:
 * - level: current level
 * - currentLevelXP: XP accumulated within the current level
 * - nextLevelXP: XP required to level up (current -> next)
 * - progressPercent: 0..100 percent progress toward next level
 */
export function getLevelFromXP(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  const safeXP = Number.isFinite(totalXP) ? Math.max(0, totalXP) : 0;

  // Fast path: within precomputed table range.
  const maxReachXP = XP_TO_REACH_LEVEL_TABLE[MAX_PRECOMPUTED_LEVEL + 1];
  if (safeXP < maxReachXP) {
    const level = binarySearchLevelFromXP(safeXP);
    const currentLevelXP = safeXP - XP_TO_REACH_LEVEL_TABLE[level];
    const nextLevelXP = getXPForLevel(level);
    const progressPercent = clamp01(currentLevelXP / nextLevelXP) * 100;
    return { level, currentLevelXP, nextLevelXP, progressPercent };
  }

  // Extended path: beyond precomputed range.
  // Start at the first level after the precomputed range.
  let level = MAX_PRECOMPUTED_LEVEL + 1; // e.g. 101
  let remaining = safeXP - XP_TO_REACH_LEVEL_TABLE[level];

  // We only loop by tiers, and at most 10 steps to find the exact level within the tier.
  // This keeps performance stable without per-level looping across huge ranges.
  // Safety guard to prevent infinite loops on extreme inputs.
  for (let guard = 0; guard < 10_000; guard++) {
    const tier = getTier(level);
    const within = getWithinTierIndex(level);
    const baseForTier = BASE_XP * Math.pow(2, tier);

    const remainingInTierCount = TIER_SIZE - within;
    const tierRemainderSum = sumXPWithinTier(baseForTier, within, remainingInTierCount);

    if (remaining >= tierRemainderSum) {
      remaining -= tierRemainderSum;
      level += remainingInTierCount; // jump to next tier start
      continue;
    }

    // Find exact level within this tier (max 10 iterations).
    for (let i = 0; i < remainingInTierCount; i++) {
      const candidateLevel = level + i;
      const xpNeed = getXPForLevel(candidateLevel);
      if (remaining < xpNeed) {
        const currentLevelXP = remaining;
        const nextLevelXP = xpNeed;
        const progressPercent = clamp01(currentLevelXP / nextLevelXP) * 100;
        return { level: candidateLevel, currentLevelXP, nextLevelXP, progressPercent };
      }
      remaining -= xpNeed;
    }

    // If remaining exactly matched the last level in tier, loop continues at next tier.
    level += remainingInTierCount;
  }

  // Fallback: should never hit, but keeps function total (no infinite loop).
  const nextLevelXP = getXPForLevel(level);
  const progressPercent = clamp01(remaining / nextLevelXP) * 100;
  return { level, currentLevelXP: remaining, nextLevelXP, progressPercent };
}

