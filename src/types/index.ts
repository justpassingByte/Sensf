export type SupportedGame = 
  | 'cs2'
  | 'valorant'
  | 'apex'
  | 'overwatch2'
  | 'rainbow6'
  | 'cod'
  | 'pubg'
  | 'fortnite';

export interface GameConfig {
  id: SupportedGame;
  name: string;
  yaw: number; // Degrees per mouse count (m_yaw)
  defaultFOV: number;
  sensDecimals: number;
  proRange: {
    min: number;
    max: number;
    median: number;
  };
  samplePros: {
    name: string;
    team: string;
    dpi: number;
    sens: number;
    edpi: number;
  }[];
}

export interface MouseProfile {
  id: string;
  name: string;
  game: SupportedGame;
  dpi: number;
  sensitivity: number;
  cm360: number;
  edpi: number;
  date: string;
  notes?: string;
}

export interface CrosshairConfig {
  color: string;
  size: number;
  thickness: number;
  gap: number;
  dot: boolean;
  outline: boolean;
}

export interface DrillResult {
  accuracy: number;        // 0 - 100%
  targetsHit: number;
  totalShots: number;
  smoothness: number;      // 0 - 100%
  avgReactionTimeMs: number;
  overshootCount: number;
  undershootCount: number;
  score: number;
}

export interface PsaRoundData {
  round: number;
  baseSens: number;
  lowSens: number;
  highSens: number;
  lowResult?: DrillResult;
  highResult?: DrillResult;
  chosen: 'low' | 'high' | null;
  overshootBias: number; // positive = overshoots more, negative = undershoots more
}

export interface BenchmarkPoint {
  sens: number;
  cm360: number;
  score: number;
  accuracy: number;
  smoothness: number;
  overshootRate: number;
}

export type DrillMode = 'tracking' | 'flicking' | 'free';
export type DrillDifficulty = 'easy' | 'medium' | 'hard' | 'pro';

export interface DifficultyConfig {
  name: string;
  targetRadius: number;
  speedMultiplier: number;
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<DrillDifficulty, DifficultyConfig> = {
  easy: {
    name: 'Dễ',
    targetRadius: 0.65,
    speedMultiplier: 0.75,
    description: 'Mục tiêu lớn, dễ bắn trúng cho người mới'
  },
  medium: {
    name: 'Vừa',
    targetRadius: 0.44,
    speedMultiplier: 1.0,
    description: 'Kích thước tiêu chuẩn thi đấu'
  },
  hard: {
    name: 'Khó',
    targetRadius: 0.26,
    speedMultiplier: 1.35,
    description: 'Mục tiêu nhỏ luyện vi chỉnh góc tâm'
  },
  pro: {
    name: 'Chuyên Nghiệp',
    targetRadius: 0.16,
    speedMultiplier: 1.7,
    description: 'Mục tiêu siêu nhỏ luyện headshot điểm ảnh'
  }
};
