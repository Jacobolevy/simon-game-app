export interface DashboardUserSummary {
  name: string;
  avatarUrl?: string | null;
  level: number;
  /** XP accumulated within current level */
  currentXP: number;
  /** XP required to reach next level */
  nextLevelXP: number;
  levelName: string;
  bestScore: number;
}

