import type { Color } from '../shared/types';
import { COLORS } from '../shared/types';

function hashStringToSeed(input: string): number {
  // FNV-1a 32-bit (must match backend)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextUint32(seed: number): number {
  // xorshift32 (must match backend)
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function generateChallengeSequence(seed: string, sequenceIndex: number, length: number): Color[] {
  const seed0 = hashStringToSeed(`${seed}:${sequenceIndex}`);
  let s = seed0;
  const out: Color[] = [];
  for (let i = 0; i < length; i++) {
    s = nextUint32(s);
    const idx = s % COLORS.length;
    out.push(COLORS[idx]);
  }
  return out;
}

