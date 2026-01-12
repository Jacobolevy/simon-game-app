/**
 * Background Music Service - Simon 2026
 * 
 * Generates procedural synthwave/lo-fi background music using Web Audio API.
 * Features dynamic BPM that increases with game intensity.
 */

// =============================================================================
// TYPES
// =============================================================================

type Intensity = 'calm' | 'medium' | 'high' | 'intense';

// =============================================================================
// MUSIC CONFIGURATION
// =============================================================================

// Chord progressions for synthwave feel (in semitones from root)
const CHORD_PROGRESSIONS = {
  synthwave: [
    [0, 4, 7],      // I  - Major
    [5, 9, 12],     // IV - Major  
    [7, 11, 14],    // V  - Major
    [2, 5, 9],      // ii - Minor
  ],
  lofi: [
    [0, 3, 7],      // i  - Minor
    [5, 8, 12],     // iv - Minor
    [3, 7, 10],     // III - Major
    [7, 10, 14],    // VII - Major
  ],
};

// Base notes for the progression (A minor / A major for synthwave)
const BASE_NOTE = 220; // A3

// Bass patterns (rhythm pattern in 16th notes, 1 = play, 0 = rest)
const BASS_PATTERNS: Record<Intensity, number[]> = {
  calm:    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  medium:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  high:    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  intense: [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
};

// Arpeggio patterns
const ARP_PATTERNS: Record<Intensity, number[]> = {
  calm:    [0, -1, 1, -1, 0, -1, 1, -1], // slow, sparse
  medium:  [0, 1, 2, 1, 0, 1, 2, 1],     // gentle up-down
  high:    [0, 1, 2, 0, 1, 2, 0, 1],     // faster
  intense: [0, 1, 2, 1, 2, 0, 1, 2],     // complex
};

// =============================================================================
// BACKGROUND MUSIC SERVICE CLASS
// =============================================================================

class BackgroundMusicService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private isInitialized: boolean = false;
  
  // Current state
  private currentBPM: number = 80;
  private currentIntensity: Intensity = 'calm';
  private currentChordIndex: number = 0;
  
  // Timing
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  
  // Volume control
  private volume: number = 0.3;
  private isMuted: boolean = false;

  constructor() {
    const savedMute = localStorage.getItem('simon-bgmusic-muted');
    this.isMuted = savedMute === 'true';
    
    const savedVolume = localStorage.getItem('simon-bgmusic-volume');
    if (savedVolume) {
      this.volume = parseFloat(savedVolume);
    }
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.audioContext.destination);

      this.isInitialized = true;
      console.log('🎵 Background music service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize background music:', error);
    }
  }

  // ===========================================================================
  // CONTROLS
  // ===========================================================================

  getMuted(): boolean {
    return this.isMuted;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('simon-bgmusic-muted', String(this.isMuted));
    
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.audioContext.currentTime,
        0.1
      );
    }
    
    return this.isMuted;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('simon-bgmusic-volume', String(this.volume));
    
    if (this.masterGain && !this.isMuted && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  getVolume(): number {
    return this.volume;
  }

  // ===========================================================================
  // INTENSITY CONTROL (Based on game round)
  // ===========================================================================

  /**
   * Set intensity based on current round
   */
  setIntensityForRound(round: number): void {
    let newIntensity: Intensity;
    let newBPM: number;

    if (round <= 5) {
      newIntensity = 'calm';
      newBPM = 80;
    } else if (round <= 10) {
      newIntensity = 'medium';
      newBPM = 95;
    } else if (round <= 20) {
      newIntensity = 'high';
      newBPM = 110;
    } else {
      newIntensity = 'intense';
      newBPM = 125;
    }

    if (newIntensity !== this.currentIntensity || newBPM !== this.currentBPM) {
      this.currentIntensity = newIntensity;
      this.currentBPM = newBPM;
      console.log(`🎵 Intensity: ${newIntensity}, BPM: ${newBPM}`);
    }
  }

  // ===========================================================================
  // PLAYBACK
  // ===========================================================================

  start(): void {
    if (!this.isInitialized || this.isPlaying || !this.audioContext) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    
    // Start the scheduler
    this.scheduler();
    this.schedulerInterval = setInterval(() => this.scheduler(), 25);
    
    console.log('🎵 Background music started');
  }

  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    console.log('🎵 Background music stopped');
  }

  // ===========================================================================
  // SCHEDULER (Heart of the music engine)
  // ===========================================================================

  private scheduler(): void {
    if (!this.audioContext || !this.isPlaying) return;

    // Schedule notes ahead of time
    const scheduleAhead = 0.1; // seconds
    
    while (this.nextNoteTime < this.audioContext.currentTime + scheduleAhead) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  private advanceStep(): void {
    const secondsPerBeat = 60.0 / this.currentBPM;
    const secondsPer16th = secondsPerBeat / 4;
    
    this.nextNoteTime += secondsPer16th;
    this.currentStep = (this.currentStep + 1) % 16;
    
    // Change chord every bar (16 steps)
    if (this.currentStep === 0) {
      this.currentChordIndex = (this.currentChordIndex + 1) % 4;
    }
  }

  private scheduleNote(step: number, time: number): void {
    const bassPattern = BASS_PATTERNS[this.currentIntensity];
    const arpPattern = ARP_PATTERNS[this.currentIntensity];
    
    // Bass on downbeats
    if (bassPattern[step]) {
      this.playBass(time);
    }
    
    // Arpeggios on offbeats (every other step for calm, every step for intense)
    const arpStep = step % arpPattern.length;
    if (this.currentIntensity !== 'calm' || step % 2 === 0) {
      this.playArp(time, arpPattern[arpStep]);
    }
    
    // Pad/drone on every bar start
    if (step === 0) {
      this.playPad(time);
    }
  }

  // ===========================================================================
  // SOUND GENERATORS
  // ===========================================================================

  private playBass(time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const chord = CHORD_PROGRESSIONS.synthwave[this.currentChordIndex];
    const freq = BASE_NOTE * Math.pow(2, chord[0] / 12) / 2; // One octave down

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.35);
  }

  private playArp(time: number, noteIndex: number): void {
    if (!this.audioContext || !this.masterGain || noteIndex < 0) return;

    const chord = CHORD_PROGRESSIONS.synthwave[this.currentChordIndex];
    const semitone = chord[noteIndex % chord.length];
    const freq = BASE_NOTE * Math.pow(2, semitone / 12) * 2; // One octave up

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    
    const arpVolume = this.currentIntensity === 'calm' ? 0.08 : 0.12;
    gain.gain.setValueAtTime(arpVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playPad(time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const chord = CHORD_PROGRESSIONS.lofi[this.currentChordIndex];
    
    // Play a soft chord pad
    chord.forEach((semitone) => {
      const freq = BASE_NOTE * Math.pow(2, semitone / 12);
      
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      // Soft attack, long release
      const padVolume = 0.06;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(padVolume, time + 0.5);
      gain.gain.linearRampToValueAtTime(padVolume * 0.7, time + 1.5);
      gain.gain.linearRampToValueAtTime(0.01, time + 2.0);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(time);
      osc.stop(time + 2.1);
    });
  }

  // ===========================================================================
  // DUCK VOLUME (When showing sequence or playing notes)
  // ===========================================================================

  /**
   * Temporarily lower volume (for when game sounds need attention)
   */
  duck(): void {
    if (!this.masterGain || !this.audioContext || this.isMuted) return;
    
    this.masterGain.gain.setTargetAtTime(
      this.volume * 0.3,
      this.audioContext.currentTime,
      0.1
    );
  }

  /**
   * Restore normal volume
   */
  unduck(): void {
    if (!this.masterGain || !this.audioContext || this.isMuted) return;
    
    this.masterGain.gain.setTargetAtTime(
      this.volume,
      this.audioContext.currentTime,
      0.3
    );
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const backgroundMusicService = new BackgroundMusicService();
export default backgroundMusicService;
