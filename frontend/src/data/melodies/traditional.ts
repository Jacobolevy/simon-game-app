/**
 * Traditional Melodies (Public Domain)
 */

import type { Melody } from './types';

export const TWINKLE_TWINKLE: Melody = {
  id: 'twinkle-twinkle',
  name: 'Twinkle Twinkle Little Star',
  tempo: 80,
  difficulty: 'easy',
  notes: [
    // Verse 1: "Twinkle twinkle little star"
    'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',
    // "How I wonder what you are"
    'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4',
    // "Up above the world so high"
    'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
    // "Like a diamond in the sky"
    'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
    // Repeat first part
    'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',
    'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4',
  ],
};

export const MARY_HAD_A_LITTLE_LAMB: Melody = {
  id: 'mary-little-lamb',
  name: 'Mary Had a Little Lamb',
  tempo: 100,
  difficulty: 'easy',
  notes: [
    // "Mary had a little lamb"
    'E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4',
    // "Little lamb, little lamb"
    'D4', 'D4', 'D4', 'E4', 'G4', 'G4',
    // "Mary had a little lamb"
    'E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4',
    // "Its fleece was white as snow"
    'E4', 'D4', 'D4', 'E4', 'D4', 'C4',
  ],
};

export const FRERE_JACQUES: Melody = {
  id: 'frere-jacques',
  name: 'Frère Jacques',
  tempo: 90,
  difficulty: 'easy',
  notes: [
    // "Frère Jacques, Frère Jacques"
    'C4', 'D4', 'E4', 'C4', 'C4', 'D4', 'E4', 'C4',
    // "Dormez-vous? Dormez-vous?"
    'E4', 'F4', 'G4', 'E4', 'F4', 'G4',
    // "Sonnez les matines" x2
    'G4', 'A4', 'G4', 'F4', 'E4', 'C4',
    'G4', 'A4', 'G4', 'F4', 'E4', 'C4',
    // "Ding dang dong" x2
    'C4', 'G3', 'C4', 'C4', 'G3', 'C4',
  ],
};

export const HAPPY_BIRTHDAY: Melody = {
  id: 'happy-birthday',
  name: 'Happy Birthday',
  tempo: 100,
  difficulty: 'easy',
  notes: [
    // "Happy birthday to you"
    'G4', 'G4', 'A4', 'G4', 'C5', 'B4',
    // "Happy birthday to you"
    'G4', 'G4', 'A4', 'G4', 'D5', 'C5',
    // "Happy birthday dear..."
    'G4', 'G4', 'G5', 'E5', 'C5', 'B4', 'A4',
    // "Happy birthday to you"
    'F5', 'F5', 'E5', 'C5', 'D5', 'C5',
  ],
};

export const JINGLE_BELLS: Melody = {
  id: 'jingle-bells',
  name: 'Jingle Bells',
  tempo: 110,
  difficulty: 'easy',
  notes: [
    // "Jingle bells, jingle bells"
    'E4', 'E4', 'E4', 'E4', 'E4', 'E4',
    // "Jingle all the way"
    'E4', 'G4', 'C4', 'D4', 'E4',
    // "Oh what fun..."
    'F4', 'F4', 'F4', 'F4', 'F4', 'E4', 'E4',
    // "...it is to ride"
    'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'G4',
  ],
};

export const AMAZING_GRACE: Melody = {
  id: 'amazing-grace',
  name: 'Amazing Grace',
  tempo: 70,
  difficulty: 'medium',
  notes: [
    // "Amazing grace, how sweet the sound"
    'G4', 'C5', 'E5', 'C5', 'E5', 'D5', 'C5', 'A4', 'G4',
    // "That saved a wretch like me"
    'G4', 'C5', 'E5', 'C5', 'E5', 'D5', 'G5',
    // "I once was lost, but now am found"
    'E5', 'G5', 'E5', 'C5', 'D5', 'E5', 'D5', 'C5', 'A4',
    // "Was blind, but now I see"
    'G4', 'C5', 'E5', 'C5', 'D5', 'C5',
  ],
};

export const TRADITIONAL_MELODIES: Melody[] = [
  TWINKLE_TWINKLE,
  MARY_HAD_A_LITTLE_LAMB,
  FRERE_JACQUES,
  HAPPY_BIRTHDAY,
  JINGLE_BELLS,
  AMAZING_GRACE,
];
