/**
 * Haptic Service - Simon 2026
 * 
 * Provides tactile feedback through device vibration.
 * Each color has a unique vibration pattern for rhythm recognition.
 */

import type { Color } from '../data/melodies/types';

// =============================================================================
// VIBRATION PATTERNS
// =============================================================================

/**
 * Unique vibration patterns for each color.
 * Numbers are milliseconds: vibrate, pause, vibrate, pause...
 * 
 * Designed so players can "feel" the difference between colors:
 * - Green: Quick double tap (like a heartbeat)
 * - Red: Single strong pulse (assertive)
 * - Yellow: Triple light flutter (playful)
 * - Blue: Long smooth wave (calm)
 */
const COLOR_PATTERNS: Record<Color, number | number[]> = {
  green:  [25, 40, 25],           // Quick double tap
  red:    [60],                    // Strong single pulse
  yellow: [15, 20, 15, 20, 15],   // Triple flutter
  blue:   [40, 15, 50],           // Wave pattern
};

/**
 * Feedback patterns for game events
 */
const EVENT_PATTERNS = {
  success:     [30, 50, 30, 50, 60],     // Ascending celebration
  error:       [100, 30, 100, 30, 150],  // Harsh warning
  roundUp:     [20, 30, 20, 30, 20, 30, 40], // Level up fanfare
  gameOver:    [200, 100, 200, 100, 300], // Dramatic ending
  lifeGained:  [40, 60, 40, 60, 80],     // Happy pulse
  lifeLost:    [80, 40, 120],            // Sad drop
  timeout:     [50, 25, 50, 25, 50, 25, 100], // Urgent alarm
  toggle:      [20],                      // Quick feedback for UI
  newHighScore: [30, 40, 30, 40, 30, 40, 60, 80, 100], // Victory celebration
};

// =============================================================================
// HAPTIC SERVICE CLASS
// =============================================================================

class HapticService {
  private isEnabled: boolean = true;
  private isSupported: boolean = false;

  constructor() {
    // Check if vibration API is supported
    this.isSupported = 'vibrate' in navigator;
    
    // Load preference from localStorage
    const saved = localStorage.getItem('simon-haptic-enabled');
    this.isEnabled = saved !== 'false'; // Default to enabled
  }

  /**
   * Check if haptics are available on this device
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Check if haptics are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled && this.isSupported;
  }

  /**
   * Toggle haptic feedback on/off
   */
  toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem('simon-haptic-enabled', String(this.isEnabled));
    
    // Provide feedback for the toggle itself
    if (this.isEnabled) {
      this.vibrate([20, 30, 20]);
    }
    
    return this.isEnabled;
  }

  /**
   * Set haptic enabled state explicitly
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('simon-haptic-enabled', String(enabled));
  }

  /**
   * Core vibration function
   */
  private vibrate(pattern: number | number[]): void {
    if (!this.isEnabled || !this.isSupported) return;
    
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail - some browsers may throw on certain conditions
      console.debug('Vibration not available');
    }
  }

  /**
   * Stop any ongoing vibration
   */
  stop(): void {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }

  // =========================================================================
  // COLOR-SPECIFIC VIBRATIONS
  // =========================================================================

  /**
   * Vibrate for a specific color
   */
  vibrateColor(color: Color): void {
    this.vibrate(COLOR_PATTERNS[color]);
  }

  /**
   * Vibrate for green button
   */
  vibrateGreen(): void {
    this.vibrate(COLOR_PATTERNS.green);
  }

  /**
   * Vibrate for red button
   */
  vibrateRed(): void {
    this.vibrate(COLOR_PATTERNS.red);
  }

  /**
   * Vibrate for yellow button
   */
  vibrateYellow(): void {
    this.vibrate(COLOR_PATTERNS.yellow);
  }

  /**
   * Vibrate for blue button
   */
  vibrateBlue(): void {
    this.vibrate(COLOR_PATTERNS.blue);
  }

  // =========================================================================
  // EVENT VIBRATIONS
  // =========================================================================

  /**
   * Vibrate for correct answer (within sequence)
   */
  vibrateSuccess(): void {
    this.vibrate(EVENT_PATTERNS.success);
  }

  /**
   * Vibrate for wrong answer
   */
  vibrateError(): void {
    this.vibrate(EVENT_PATTERNS.error);
  }

  /**
   * Vibrate for completing a round
   */
  vibrateRoundComplete(): void {
    this.vibrate(EVENT_PATTERNS.roundUp);
  }

  /**
   * Vibrate for game over
   */
  vibrateGameOver(): void {
    this.vibrate(EVENT_PATTERNS.gameOver);
  }

  /**
   * Vibrate for gaining a life
   */
  vibrateLifeGained(): void {
    this.vibrate(EVENT_PATTERNS.lifeGained);
  }

  /**
   * Vibrate for losing a life
   */
  vibrateLifeLost(): void {
    this.vibrate(EVENT_PATTERNS.lifeLost);
  }

  /**
   * Vibrate for timeout
   */
  vibrateTimeout(): void {
    this.vibrate(EVENT_PATTERNS.timeout);
  }

  /**
   * Quick vibrate for UI toggles
   */
  vibrateToggle(): void {
    this.vibrate(EVENT_PATTERNS.toggle);
  }

  /**
   * Vibrate for new high score
   */
  vibrateNewHighScore(): void {
    this.vibrate(EVENT_PATTERNS.newHighScore);
  }

  // =========================================================================
  // SEQUENCE VIBRATIONS (for watching the pattern)
  // =========================================================================

  /**
   * Play a sequence of color vibrations with timing
   * Used during the "watch" phase to let users feel the pattern
   */
  async vibrateSequence(
    colors: Color[], 
    noteDuration: number = 500, 
    gapDuration: number = 200
  ): Promise<void> {
    for (let i = 0; i < colors.length; i++) {
      this.vibrateColor(colors[i]);
      await this.delay(noteDuration + gapDuration);
    }
  }

  /**
   * Helper: delay for async sequences
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const hapticService = new HapticService();
export default hapticService;
