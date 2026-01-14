import { v4 as uuidv4 } from 'uuid';

export type ChallengeVisibility = {
  friend: boolean;
  community: boolean;
};

export type ChallengeRules = {
  timeLimitSeconds: number; // fixed 60 for now
  initialSequenceLength: number; // 2
  sequenceIncrement: number; // +1 per success
  penaltyPerStep: number; // points per sequence length on fail (e.g. 10)
  maxPenalty: number; // cap to avoid feeling hopeless
  scoringVersion: number; // for future-proofing
};

export type ChallengeAttempt = {
  attemptId: string;
  playerName: string;
  score: number;
  createdAt: number;
};

export type Challenge = {
  id: string;
  seed: string;
  creatorName: string;
  creatorScore: number;
  visibility: ChallengeVisibility;
  rules: ChallengeRules;
  createdAt: number;
  expiresAt: number;
  attempts: ChallengeAttempt[];
};

export const CHALLENGE_CONSTANTS = {
  // Free mode: in-memory store + TTL
  TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  CLEANUP_INTERVAL_MS: 10 * 60 * 1000, // 10 minutes
  MAX_LIST_ITEMS: 100,
  MAX_ATTEMPTS_STORED: 250,
  // Default rules (client uses the same)
  DEFAULT_RULES: {
    timeLimitSeconds: 60,
    initialSequenceLength: 2,
    sequenceIncrement: 1,
    penaltyPerStep: 10, // penalty = min(maxPenalty, penaltyPerStep * sequenceLength)
    maxPenalty: 150,
    scoringVersion: 1,
  } satisfies ChallengeRules,
} as const;

export class ChallengeService {
  private challenges: Map<string, Challenge> = new Map();

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    // Fire-and-forget cleanup timer (in-memory store for "free" mode).
    setInterval(() => this.cleanupExpired(), CHALLENGE_CONSTANTS.CLEANUP_INTERVAL_MS);
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [id, ch] of this.challenges.entries()) {
      if (ch.expiresAt <= now) this.challenges.delete(id);
    }
  }

  createChallenge(input: {
    creatorName: string;
    creatorScore: number;
    visibility: ChallengeVisibility;
    seed?: string;
    rules?: Partial<ChallengeRules>;
  }): Challenge {
    const id = uuidv4();
    const now = Date.now();
    const rules: ChallengeRules = { ...CHALLENGE_CONSTANTS.DEFAULT_RULES, ...(input.rules || {}) };

    const challenge: Challenge = {
      id,
      seed: input.seed || id, // deterministic and stable by default
      creatorName: input.creatorName,
      creatorScore: input.creatorScore,
      visibility: input.visibility,
      rules,
      createdAt: now,
      expiresAt: now + CHALLENGE_CONSTANTS.TTL_MS,
      attempts: [],
    };

    this.challenges.set(id, challenge);
    return challenge;
  }

  getChallenge(id: string): Challenge | null {
    const ch = this.challenges.get(id);
    if (!ch) return null;
    if (ch.expiresAt <= Date.now()) {
      this.challenges.delete(id);
      return null;
    }
    return ch;
  }

  listCommunityChallenges(): Array<Pick<Challenge, 'id' | 'creatorName' | 'creatorScore' | 'createdAt'>> {
    const now = Date.now();
    const items = Array.from(this.challenges.values())
      .filter((c) => c.visibility.community && c.expiresAt > now)
      .sort((a, b) => b.creatorScore - a.creatorScore || b.createdAt - a.createdAt)
      .slice(0, CHALLENGE_CONSTANTS.MAX_LIST_ITEMS)
      .map((c) => ({
        id: c.id,
        creatorName: c.creatorName,
        creatorScore: c.creatorScore,
        createdAt: c.createdAt,
      }));
    return items;
  }

  submitAttempt(id: string, attempt: { playerName: string; score: number }): {
    challenge: Challenge;
    didBeatCreator: boolean;
    isNewBestForPlayer: boolean;
  } {
    const ch = this.getChallenge(id);
    if (!ch) throw new Error('Challenge not found');

    const now = Date.now();
    const attemptId = uuidv4();

    const prevBestForPlayer = Math.max(
      0,
      ...ch.attempts.filter((a) => a.playerName === attempt.playerName).map((a) => a.score)
    );

    const entry: ChallengeAttempt = {
      attemptId,
      playerName: attempt.playerName,
      score: attempt.score,
      createdAt: now,
    };

    ch.attempts.push(entry);
    if (ch.attempts.length > CHALLENGE_CONSTANTS.MAX_ATTEMPTS_STORED) {
      ch.attempts.splice(0, ch.attempts.length - CHALLENGE_CONSTANTS.MAX_ATTEMPTS_STORED);
    }

    const didBeatCreator = attempt.score > ch.creatorScore;
    const isNewBestForPlayer = attempt.score > prevBestForPlayer;

    return { challenge: ch, didBeatCreator, isNewBestForPlayer };
  }
}

export const challengeService = new ChallengeService();

