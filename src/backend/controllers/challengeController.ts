/**
 * Challenge Controller
 *
 * Challenge mode = 60s time trial run, shareable as:
 * - friend challenge (deep link)
 * - community pool (public list)
 *
 * Storage: in-memory + TTL (free for now).
 */

import { Router, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { challengeService } from '../services/challengeService';

export const challengeRouter = Router();

const createChallengeSchema = z.object({
  creatorName: z.string().min(1).max(32),
  creatorScore: z.number().int().nonnegative(),
  visibility: z.object({
    friend: z.boolean(),
    community: z.boolean(),
  }),
  seed: z.string().min(1).max(128).optional(),
  rules: z
    .object({
      timeLimitSeconds: z.number().int().positive().optional(),
      initialSequenceLength: z.number().int().positive().optional(),
      sequenceIncrement: z.number().int().positive().optional(),
      penaltyPerStep: z.number().int().nonnegative().optional(),
      maxPenalty: z.number().int().nonnegative().optional(),
      scoringVersion: z.number().int().positive().optional(),
    })
    .optional(),
});

const submitAttemptSchema = z.object({
  playerName: z.string().min(1).max(32),
  score: z.number().int().nonnegative(),
});

// POST /api/challenges
challengeRouter.post('/', (req: Request, res: Response) => {
  try {
    const input = createChallengeSchema.parse(req.body);
    const challenge = challengeService.createChallenge(input);
    res.status(201).json({
      id: challenge.id,
      seed: challenge.seed,
      creatorName: challenge.creatorName,
      creatorScore: challenge.creatorScore,
      visibility: challenge.visibility,
      rules: challenge.rules,
      createdAt: challenge.createdAt,
      expiresAt: challenge.expiresAt,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /api/challenges (community list)
challengeRouter.get('/', (_req: Request, res: Response) => {
  try {
    const items = challengeService.listCommunityChallenges();
    res.json({ items });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /api/challenges/:id
challengeRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const ch = challengeService.getChallenge(id);
    if (!ch) return res.status(404).json({ error: 'Challenge not found' });
    res.json({
      id: ch.id,
      seed: ch.seed,
      creatorName: ch.creatorName,
      creatorScore: ch.creatorScore,
      visibility: ch.visibility,
      rules: ch.rules,
      createdAt: ch.createdAt,
      expiresAt: ch.expiresAt,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/challenges/:id/attempt
challengeRouter.post('/:id/attempt', (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const input = submitAttemptSchema.parse(req.body);

    const result = challengeService.submitAttempt(id, input);

    // XP award (client-side progress is fine for now; still return for UI)
    const xpAwarded = result.didBeatCreator ? 50 : 10;

    res.json({
      didBeatCreator: result.didBeatCreator,
      isNewBestForPlayer: result.isNewBestForPlayer,
      xpAwarded,
    });
  } catch (err) {
    handleError(err, res);
  }
});

function handleError(err: unknown, res: Response) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  if (err instanceof Error) {
    if (err.message === 'Challenge not found') return res.status(404).json({ error: err.message });
    console.error('❌ Challenge controller error:', err);
    return res.status(500).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Internal server error' });
}

