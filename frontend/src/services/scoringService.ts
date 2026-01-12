/**
 * Scoring Service - Simon 2026
 * 
 * Hybrid scoring system that rewards consistency AND speed.
 * 
 * Formula: Total = (Points per Tap) + (Round Bonus) + (Speed Bonus)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const POINTS_PER_TAP = 10;
const ROUND_MULTIPLIER = 10;
const SPEED_MULTIPLIER = 10;

// =============================================================================
// TYPES
// =============================================================================

export interface RoundScore {
  tapsScore: number;      // Points from correct taps
  roundBonus: number;     // Bonus for completing the round
  speedBonus: number;     // Bonus from remaining time
  total: number;          // Sum of all
}

export interface GameScore {
  totalScore: number;
  roundsCompleted: number;
  perfectRounds: number;  // Rounds completed without any mistakes
  fastestRound: number;   // Seconds remaining on best round
  totalTaps: number;
  breakdown: RoundScore[];
}

// =============================================================================
// SCORING SERVICE CLASS
// =============================================================================

class ScoringService {
  private currentGame: GameScore = this.createEmptyGame();

  /**
   * Reset for a new game
   */
  reset(): void {
    this.currentGame = this.createEmptyGame();
  }

  private createEmptyGame(): GameScore {
    return {
      totalScore: 0,
      roundsCompleted: 0,
      perfectRounds: 0,
      fastestRound: 0,
      totalTaps: 0,
      breakdown: [],
    };
  }

  /**
   * Called when player taps a correct color
   * Returns the points earned for this tap
   */
  scoreTap(): number {
    this.currentGame.totalTaps++;
    this.currentGame.totalScore += POINTS_PER_TAP;
    return POINTS_PER_TAP;
  }

  /**
   * Called when player completes a round
   * Returns the breakdown of points earned
   */
  scoreRoundComplete(
    roundNumber: number,
    sequenceLength: number,
    secondsRemaining: number,
    hadMistakes: boolean
  ): RoundScore {
    // Calculate bonuses
    const roundBonus = roundNumber * ROUND_MULTIPLIER;
    const speedBonus = Math.floor(secondsRemaining) * SPEED_MULTIPLIER;
    const tapsScore = sequenceLength * POINTS_PER_TAP;

    const roundScore: RoundScore = {
      tapsScore,
      roundBonus,
      speedBonus,
      total: roundBonus + speedBonus, // tapsScore already added via scoreTap()
    };

    // Update game state
    this.currentGame.totalScore += roundBonus + speedBonus;
    this.currentGame.roundsCompleted++;
    this.currentGame.breakdown.push(roundScore);

    if (!hadMistakes) {
      this.currentGame.perfectRounds++;
    }

    if (secondsRemaining > this.currentGame.fastestRound) {
      this.currentGame.fastestRound = secondsRemaining;
    }

    return roundScore;
  }

  /**
   * Get current total score
   */
  getScore(): number {
    return this.currentGame.totalScore;
  }

  /**
   * Get full game stats
   */
  getGameStats(): GameScore {
    return { ...this.currentGame };
  }

  /**
   * Calculate what the score would be for display during gameplay
   */
  calculateLiveScore(
    currentTaps: number,
    completedRounds: RoundScore[]
  ): number {
    const tapsScore = currentTaps * POINTS_PER_TAP;
    const roundsTotal = completedRounds.reduce((sum, r) => sum + r.total, 0);
    return tapsScore + roundsTotal;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const scoringService = new ScoringService();
export default scoringService;
