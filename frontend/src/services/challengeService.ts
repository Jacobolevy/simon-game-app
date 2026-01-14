/**
 * Challenge Service (HTTP)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type ChallengeVisibility = { friend: boolean; community: boolean };

export type ChallengeRules = {
  timeLimitSeconds: number;
  initialSequenceLength: number;
  sequenceIncrement: number;
  penaltyPerStep: number;
  maxPenalty: number;
  scoringVersion: number;
};

export type ChallengeSummary = {
  id: string;
  creatorName: string;
  creatorScore: number;
  createdAt: number;
};

export type ChallengeDetail = {
  id: string;
  seed: string;
  creatorName: string;
  creatorScore: number;
  visibility: ChallengeVisibility;
  rules: ChallengeRules;
  createdAt: number;
  expiresAt: number;
};

export async function createChallenge(input: {
  creatorName: string;
  creatorScore: number;
  visibility: ChallengeVisibility;
  seed?: string;
  rules?: Partial<ChallengeRules>;
}): Promise<ChallengeDetail> {
  const res = await fetch(`${API_BASE_URL}/api/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json())?.error || 'Failed to create challenge');
  return res.json();
}

export async function listCommunityChallenges(): Promise<ChallengeSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/challenges`, { method: 'GET', credentials: 'include' });
  if (!res.ok) throw new Error((await res.json())?.error || 'Failed to list challenges');
  const json = await res.json();
  return json.items || [];
}

export async function getChallenge(id: string): Promise<ChallengeDetail> {
  const res = await fetch(`${API_BASE_URL}/api/challenges/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json())?.error || 'Challenge not found');
  return res.json();
}

export async function submitChallengeAttempt(id: string, input: { playerName: string; score: number }): Promise<{
  didBeatCreator: boolean;
  isNewBestForPlayer: boolean;
  xpAwarded: number;
}> {
  const res = await fetch(`${API_BASE_URL}/api/challenges/${encodeURIComponent(id)}/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json())?.error || 'Failed to submit attempt');
  return res.json();
}

