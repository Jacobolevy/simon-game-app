/**
 * Challenge Mode tuning constants (source of truth for client gameplay)
 */

export const CHALLENGE_CONSTANTS = {
  TIME_LIMIT_SECONDS: 60,
  INITIAL_SEQUENCE_LENGTH: 2,
  SEQUENCE_INCREMENT: 1,

  // Scoring per completed sequence
  SEQUENCE_BASE_POINTS: 100,
  SPEED_FLOOR: 0.3,
  SPEED_POWER: 2,

  // Multiplier (streak) based on sequences completed
  MULTIPLIER_STEP_SEQUENCES: 5,

  // Fail penalty (proportional to length)
  PENALTY_PER_STEP: 10, // penalty = min(MAX_PENALTY, PENALTY_PER_STEP * sequenceLength)
  MAX_PENALTY: 150,

  SCORING_VERSION: 1,
} as const;

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function calculateMultiplier(sequencesCompleted: number): number {
  return 1 + Math.floor(sequencesCompleted / CHALLENGE_CONSTANTS.MULTIPLIER_STEP_SEQUENCES);
}

export function calculatePenalty(sequenceLength: number): number {
  return Math.min(CHALLENGE_CONSTANTS.MAX_PENALTY, CHALLENGE_CONSTANTS.PENALTY_PER_STEP * Math.max(1, sequenceLength));
}

export function calculateSpeedPoints(sequenceDurationMs: number, sequenceLength: number): number {
  // Target time grows gently with length (tunable)
  const targetMs = Math.max(700, Math.round(sequenceLength * 850));
  const r = clamp01(1 - sequenceDurationMs / targetMs);
  const base = CHALLENGE_CONSTANTS.SEQUENCE_BASE_POINTS;
  const scaled =
    base *
    (CHALLENGE_CONSTANTS.SPEED_FLOOR +
      (1 - CHALLENGE_CONSTANTS.SPEED_FLOOR) * Math.pow(r, CHALLENGE_CONSTANTS.SPEED_POWER));
  return Math.round(scaled);
}

