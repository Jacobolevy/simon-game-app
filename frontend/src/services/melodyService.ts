/**
 * Melody Service - Simon 2026
 * 
 * Generates game sequences from real melodies instead of random colors.
 * Each color represents musical notes, so players are unknowingly playing songs!
 */

import type { Note, Color, Melody, MelodyState } from '../data/melodies/types';
import { NOTE_FREQUENCIES, ALL_MELODIES, EASY_MELODIES, MEDIUM_MELODIES } from '../data/melodies';

// =============================================================================
// NOTE TO COLOR MAPPING
// =============================================================================

/**
 * Maps musical notes to Simon colors.
 * Balanced distribution across the 4 colors.
 */
const NOTE_TO_COLOR: Record<string, Color> = {
  'C': 'green',
  'D': 'red',
  'E': 'yellow',
  'F': 'blue',
  'G': 'green',
  'A': 'red',
  'B': 'yellow',
};

function getNoteBase(note: Note): string {
  // "C#4" → "C", "D5" → "D"
  return note.charAt(0);
}

function noteToColor(note: Note): Color {
  const base = getNoteBase(note);
  return NOTE_TO_COLOR[base] || 'green';
}

// =============================================================================
// MELODY SERVICE CLASS
// =============================================================================

class MelodyService {
  private state: MelodyState = {
    currentMelody: null,
    currentPosition: 0,
    melodiesPlayed: [],
  };

  private lastPlayedNote: Note | null = null;

  /**
   * Reset the service state (e.g., when starting a new game)
   */
  reset(): void {
    this.state = {
      currentMelody: null,
      currentPosition: 0,
      melodiesPlayed: [],
    };
    this.lastPlayedNote = null;
  }

  /**
   * Get the current melody info (for display)
   */
  getCurrentMelodyInfo(): { name: string; composer?: string } | null {
    if (!this.state.currentMelody) return null;
    return {
      name: this.state.currentMelody.name,
      composer: this.state.currentMelody.composer,
    };
  }

  /**
   * Get how far we are into the current melody (as percentage)
   */
  getMelodyProgress(): number {
    if (!this.state.currentMelody) return 0;
    return (this.state.currentPosition / this.state.currentMelody.notes.length) * 100;
  }

  /**
   * Select an appropriate melody based on round number
   */
  private selectMelody(round: number): Melody {
    let pool: Melody[];
    
    // Early rounds: easy melodies
    // Middle rounds: add medium
    // Later rounds: add hard
    if (round <= 5) {
      pool = EASY_MELODIES;
    } else if (round <= 15) {
      pool = [...EASY_MELODIES, ...MEDIUM_MELODIES];
    } else {
      pool = ALL_MELODIES;
    }

    // Avoid recently played melodies if possible
    const unplayed = pool.filter(m => !this.state.melodiesPlayed.includes(m.id));
    const candidates = unplayed.length > 0 ? unplayed : pool;

    // Random selection
    const melody = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Track played melodies (keep last 3)
    this.state.melodiesPlayed.push(melody.id);
    if (this.state.melodiesPlayed.length > 3) {
      this.state.melodiesPlayed.shift();
    }

    return melody;
  }

  /**
   * Check if we need a new melody
   */
  private needsNewMelody(): boolean {
    return !this.state.currentMelody || 
           this.state.currentPosition >= this.state.currentMelody.notes.length;
  }

  /**
   * Get the next color in the sequence
   */
  getNextColor(round: number): Color {
    // Check if we need a new melody
    if (this.needsNewMelody()) {
      this.state.currentMelody = this.selectMelody(round);
      this.state.currentPosition = 0;
    }

    // Get current note and advance position
    const note = this.state.currentMelody!.notes[this.state.currentPosition];
    this.lastPlayedNote = note;
    this.state.currentPosition++;

    return noteToColor(note);
  }

  /**
   * Get the frequency of the last played note (for sound generation)
   */
  getLastNoteFrequency(): number {
    if (!this.lastPlayedNote) return 440; // Default A4
    return NOTE_FREQUENCIES[this.lastPlayedNote];
  }

  /**
   * Get frequency for a specific color based on current melody context
   * This makes each color sound like the actual note it represents
   */
  getColorFrequency(color: Color, position: number): number {
    if (!this.state.currentMelody) return this.getDefaultColorFrequency(color);
    
    // Find the note at this position in the sequence
    const sequencePosition = position % this.state.currentMelody.notes.length;
    const note = this.state.currentMelody.notes[sequencePosition];
    
    return NOTE_FREQUENCIES[note];
  }

  /**
   * Fallback frequencies (original Simon tones)
   */
  private getDefaultColorFrequency(color: Color): number {
    const defaults: Record<Color, number> = {
      green: 659.25,  // E5
      red: 329.63,    // E4
      yellow: 440.00, // A4
      blue: 277.18,   // C#4
    };
    return defaults[color];
  }

  /**
   * Build a complete sequence for a round
   * Returns the full sequence of colors for the current round
   */
  buildSequence(length: number, round: number): Color[] {
    const colors: Color[] = [];
    for (let i = 0; i < length; i++) {
      colors.push(this.getNextColor(round));
    }
    return colors;
  }

  /**
   * Get the notes for a sequence (for playing the melody)
   */
  getSequenceNotes(startPosition: number, length: number): Note[] {
    if (!this.state.currentMelody) return [];
    
    const notes: Note[] = [];
    for (let i = 0; i < length; i++) {
      const pos = (startPosition + i) % this.state.currentMelody.notes.length;
      notes.push(this.state.currentMelody.notes[pos]);
    }
    return notes;
  }

  /**
   * Check if a melody just completed
   */
  didMelodyJustComplete(): boolean {
    return this.state.currentPosition >= (this.state.currentMelody?.notes.length || 0);
  }

  /**
   * Get count of melodies completed in this session
   */
  getMelodiesCompleted(): number {
    return this.state.melodiesPlayed.length - 1; // -1 because current is not complete
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const melodyService = new MelodyService();
export default melodyService;
