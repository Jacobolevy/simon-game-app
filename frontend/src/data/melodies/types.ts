/**
 * Melody System Types
 */

// Notas musicales con octava
export type Note = 
  | 'C3' | 'C#3' | 'D3' | 'D#3' | 'E3' | 'F3' | 'F#3' | 'G3' | 'G#3' | 'A3' | 'A#3' | 'B3'
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  | 'C5' | 'C#5' | 'D5' | 'D#5' | 'E5' | 'F5' | 'F#5' | 'G5' | 'G#5' | 'A5' | 'A#5' | 'B5'
  | 'C6';

export type Color = 'green' | 'red' | 'yellow' | 'blue';

export interface Melody {
  id: string;
  name: string;
  composer?: string;
  /** The notes of the melody */
  notes: Note[];
  /** Base tempo in BPM (for future use with background music) */
  tempo: number;
  /** Difficulty: affects when this melody can appear */
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MelodyState {
  currentMelody: Melody | null;
  currentPosition: number;
  melodiesPlayed: string[];
}
