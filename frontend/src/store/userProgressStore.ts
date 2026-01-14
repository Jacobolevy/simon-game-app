import { create } from 'zustand';
import type { DashboardUserSummary } from '../components/dashboard/types';

type PendingAward = {
  xpDelta: number;
  reason: 'challenge_beat' | 'challenge_try' | 'other';
  createdAt: number;
};

type UserProgressState = {
  user: DashboardUserSummary;
  pendingAward: PendingAward | null;
  setPendingAward: (award: PendingAward) => void;
  consumePendingAward: () => PendingAward | null;
  applyAwardInstant: (award: PendingAward) => void;
  setUserName: (name: string) => void;
};

const STORAGE_KEY = 'simon:userProgress:v1';

function getDefaultUser(): DashboardUserSummary {
  return {
    name: 'Guest Player',
    avatarUrl: null,
    level: 1,
    currentXP: 120,
    nextLevelXP: 300,
    levelName: 'Rookie',
    bestScore: 1250,
  };
}

function load(): { user: DashboardUserSummary; pendingAward: PendingAward | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: getDefaultUser(), pendingAward: null };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user || getDefaultUser(),
      pendingAward: parsed.pendingAward || null,
    };
  } catch {
    return { user: getDefaultUser(), pendingAward: null };
  }
}

function save(state: { user: DashboardUserSummary; pendingAward: PendingAward | null }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function computeNextLevelXP(level: number): number {
  // Simple mobile-arcade curve (tunable)
  return Math.round(250 * Math.pow(1.35, level - 1));
}

function levelName(level: number): string {
  if (level < 3) return 'Rookie';
  if (level < 6) return 'Cadet';
  if (level < 10) return 'Pro';
  if (level < 15) return 'Elite';
  return 'Legend';
}

export const useUserProgressStore = create<UserProgressState>((set, get) => {
  const initial = load();
  return {
    user: initial.user,
    pendingAward: initial.pendingAward,

    setPendingAward: (award) => {
      set({ pendingAward: award });
      save({ user: get().user, pendingAward: award });
    },

    consumePendingAward: () => {
      const award = get().pendingAward;
      set({ pendingAward: null });
      save({ user: get().user, pendingAward: null });
      return award;
    },

    applyAwardInstant: (award) => {
      const state = get();
      let { level, currentXP } = state.user;
      const xpToAdd = Math.max(0, Math.floor(award.xpDelta));
      let nextXP = state.user.nextLevelXP || computeNextLevelXP(level);

      let remaining = xpToAdd;
      while (remaining > 0) {
        const space = nextXP - currentXP;
        if (remaining < space) {
          currentXP += remaining;
          remaining = 0;
        } else {
          remaining -= space;
          level += 1;
          currentXP = 0;
          nextXP = computeNextLevelXP(level);
        }
      }

      const updated: DashboardUserSummary = {
        ...state.user,
        level,
        currentXP,
        nextLevelXP: nextXP,
        levelName: levelName(level),
      };

      set({ user: updated });
      save({ user: updated, pendingAward: state.pendingAward });
    },

    setUserName: (name) => {
      const trimmed = name.trim();
      const updated: DashboardUserSummary = { ...get().user, name: trimmed };
      set({ user: updated });
      save({ user: updated, pendingAward: get().pendingAward });
    },
  };
});

