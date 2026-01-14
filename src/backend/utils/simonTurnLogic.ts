/**
 * Turn-based Simon multiplayer (Time Trial / Showmatch)
 *
 * - No "rounds" in UX; backend treats each completed sequence as a unit of progress.
 * - Each player gets ONE timed turn (30/60/90s) to score as many points as possible.
 * - Players watch each other's turns (spectator mode).
 * - Each player sees different sequences (same difficulty, different pattern).
 */

import type { Player, Color, SimonTurnGameState } from '@shared/types';
import { COLORS } from '@shared/types';

// =============================================================================
// TUNING CONSTANTS (single source for multiplayer scoring)
// =============================================================================

export const SIMON_TURN_CONSTANTS = {
  TURN_OPTIONS_SECONDS: [30, 60, 90] as const,
  INITIAL_SEQUENCE_LENGTH: 2,
  SEQUENCE_INCREMENT: 1,
  // Scoring:
  SEQUENCE_BASE_POINTS: 100,
  SPEED_FLOOR: 0.3,   // always get at least 30% of base if correct
  SPEED_POWER: 2,     // rewards very fast completions more
  MULTIPLIER_STEP_SEQUENCES: 5, // x2 at 5, x3 at 10, ...
} as const;

// =============================================================================
// DETERMINISTIC RNG (seeded by game + player)
// =============================================================================

function hashStringToSeed(input: string): number {
  // Simple FNV-1a 32-bit
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextUint32(seed: number): number {
  // xorshift32
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function generateDeterministicSequence(
  gameCode: string,
  playerId: string,
  sequenceIndex: number,
  length: number
): Color[] {
  const seed0 = hashStringToSeed(`${gameCode}:${playerId}:${sequenceIndex}`);
  let seed = seed0;
  const out: Color[] = [];

  for (let i = 0; i < length; i++) {
    seed = nextUint32(seed);
    const idx = seed % COLORS.length;
    out.push(COLORS[idx]);
  }

  return out;
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function calculateMultiplier(sequencesCompletedThisTurn: number): number {
  return 1 + Math.floor(sequencesCompletedThisTurn / SIMON_TURN_CONSTANTS.MULTIPLIER_STEP_SEQUENCES);
}

export function calculateSpeedPoints(secondsRemaining: number, turnTotalSeconds: number): number {
  const r = turnTotalSeconds > 0 ? clamp01(secondsRemaining / turnTotalSeconds) : 0;
  const base = SIMON_TURN_CONSTANTS.SEQUENCE_BASE_POINTS;
  const scaled = base * (SIMON_TURN_CONSTANTS.SPEED_FLOOR + (1 - SIMON_TURN_CONSTANTS.SPEED_FLOOR) * Math.pow(r, SIMON_TURN_CONSTANTS.SPEED_POWER));
  return Math.round(scaled);
}

export function validateSequence(expected: Color[], submitted: Color[]): boolean {
  if (submitted.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== submitted[i]) return false;
  }
  return true;
}

// =============================================================================
// STATE
// =============================================================================

export function initializeSimonTurnGame(players: Player[], turnTotalSeconds: number): SimonTurnGameState {
  const turnOrder = players.map((p) => p.id);
  const playersState: SimonTurnGameState['players'] = {};
  players.forEach((p) => {
    playersState[p.id] = {
      playerId: p.id,
      score: 0,
      sequencesCompleted: 0,
      maxMultiplier: 1,
    };
  });

  return {
    gameType: 'simon_turn',
    phase: 'between_turns',
    turnOrder,
    currentTurnIndex: 0,
    currentPlayerId: null,
    turnTotalSeconds,
    turnEndsAt: null,
    sequenceLength: SIMON_TURN_CONSTANTS.INITIAL_SEQUENCE_LENGTH,
    currentSequence: [],
    sequencesCompletedThisTurn: 0,
    multiplier: 1,
    players: playersState,
    winnerId: null,
  };
}

export function startNextTurn(gameCode: string, state: SimonTurnGameState): SimonTurnGameState {
  const currentTurnIndex = state.currentTurnIndex;
  const currentPlayerId = state.turnOrder[currentTurnIndex] ?? null;
  const now = Date.now();
  const turnEndsAt = now + state.turnTotalSeconds * 1000;

  return {
    ...state,
    phase: 'turn_showing',
    currentPlayerId,
    turnEndsAt,
    sequenceLength: SIMON_TURN_CONSTANTS.INITIAL_SEQUENCE_LENGTH,
    currentSequence: generateDeterministicSequence(gameCode, currentPlayerId || 'unknown', 0, SIMON_TURN_CONSTANTS.INITIAL_SEQUENCE_LENGTH),
    sequencesCompletedThisTurn: 0,
    multiplier: 1,
  };
}

export function endCurrentTurn(state: SimonTurnGameState, playerId: string): SimonTurnGameState {
  const player = state.players[playerId];
  if (!player) return state;

  return {
    ...state,
    phase: 'between_turns',
    currentSequence: [],
  };
}

export function advanceTurnIndex(state: SimonTurnGameState): SimonTurnGameState {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnOrder.length) {
    return { ...state, phase: 'finished', currentPlayerId: null, winnerId: determineWinner(state) };
  }
  return { ...state, currentTurnIndex: nextIndex };
}

export function determineWinner(state: SimonTurnGameState): string | null {
  const entries = Object.values(state.players);
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId));
  return sorted[0]?.playerId ?? null;
}

