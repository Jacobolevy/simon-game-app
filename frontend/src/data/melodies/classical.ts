/**
 * Classical Melodies (Public Domain)
 */

import type { Melody } from './types';

export const ODE_TO_JOY: Melody = {
  id: 'ode-to-joy',
  name: 'Ode to Joy',
  composer: 'Beethoven',
  tempo: 100,
  difficulty: 'easy',
  notes: [
    // Line 1: E E F G | G F E D | C C D E | E D D
    'E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4',
    'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4',
    // Line 2: E E F G | G F E D | C C D E | D C C
    'E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4',
    'C4', 'C4', 'D4', 'E4', 'D4', 'C4', 'C4',
  ],
};

export const FUR_ELISE: Melody = {
  id: 'fur-elise',
  name: 'Für Elise',
  composer: 'Beethoven',
  tempo: 70,
  difficulty: 'medium',
  notes: [
    // Iconic opening motif
    'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
    'C4', 'E4', 'A4', 'B4',
    'E4', 'G#4', 'B4', 'C5',
    'E4', 'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
  ],
};

export const CANON_IN_D: Melody = {
  id: 'canon-in-d',
  name: 'Canon in D',
  composer: 'Pachelbel',
  tempo: 60,
  difficulty: 'medium',
  notes: [
    // Main theme (simplified)
    'F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5',
    'D5', 'C#5', 'B4', 'A4', 'G4', 'F#4', 'G4', 'E4',
    'D4', 'F#4', 'A4', 'G4', 'F#4', 'D4', 'F#4', 'E4',
  ],
};

export const MINUET_IN_G: Melody = {
  id: 'minuet-in-g',
  name: 'Minuet in G',
  composer: 'Bach',
  tempo: 90,
  difficulty: 'hard',
  notes: [
    // Main theme
    'D5', 'G4', 'A4', 'B4', 'C5', 'D5', 'G4', 'G4',
    'E5', 'C5', 'D5', 'E5', 'F#5', 'G5', 'G4', 'G4',
    'C5', 'D5', 'C5', 'B4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4',
  ],
};

export const CLASSICAL_MELODIES: Melody[] = [
  ODE_TO_JOY,
  FUR_ELISE,
  CANON_IN_D,
  MINUET_IN_G,
];
