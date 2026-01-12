/**
 * Melodies Index
 */

export * from './types';
export * from './noteFrequencies';
export * from './classical';
export * from './traditional';

import { CLASSICAL_MELODIES } from './classical';
import { TRADITIONAL_MELODIES } from './traditional';
import type { Melody } from './types';

export const ALL_MELODIES: Melody[] = [
  ...TRADITIONAL_MELODIES,
  ...CLASSICAL_MELODIES,
];

export const EASY_MELODIES: Melody[] = ALL_MELODIES.filter(m => m.difficulty === 'easy');
export const MEDIUM_MELODIES: Melody[] = ALL_MELODIES.filter(m => m.difficulty === 'medium');
export const HARD_MELODIES: Melody[] = ALL_MELODIES.filter(m => m.difficulty === 'hard');
