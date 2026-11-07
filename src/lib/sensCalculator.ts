import { GameConfig, SupportedGame } from '../types';

export const GAME_CONFIGS: Record<SupportedGame, GameConfig> = {
  cs2: {
    id: 'cs2',
    name: 'Counter-Strike 2',
    yaw: 0.022,
    defaultFOV: 90,
    sensDecimals: 3,
    proRange: { min: 0.6, max: 2.5, median: 1.0 },
    samplePros: [
      { name: 's1mple', team: 'NAVI', dpi: 400, sens: 3.09, edpi: 1236 },
      { name: 'NiKo', team: 'Falcons', dpi: 400, sens: 1.4, edpi: 560 },
      { name: 'ZywOo', team: 'Vitality', dpi: 400, sens: 2.0, edpi: 800 },
      { name: 'donk', team: 'Spirit', dpi: 800, sens: 1.25, edpi: 1000 },
      { name: 'm0NESY', team: 'G2', dpi: 400, sens: 2.3, edpi: 920 }
    ]
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    yaw: 0.07,
    defaultFOV: 103,
    sensDecimals: 3,
    proRange: { min: 0.18, max: 0.65, median: 0.32 },
    samplePros: [
      { name: 'TenZ', team: 'Sentinels', dpi: 800, sens: 0.3, edpi: 240 },
      { name: 'yay', team: 'Bleed', dpi: 800, sens: 0.27, edpi: 216 },
      { name: 'cNed', team: 'FUT', dpi: 800, sens: 0.32, edpi: 256 },
      { name: 'Chronicle', team: 'Fnatic', dpi: 800, sens: 0.23, edpi: 184 },
      { name: 'Asuna', team: '100T', dpi: 1600, sens: 0.275, edpi: 440 }
    ]
  },
  apex: {
    id: 'apex',
    name: 'Apex Legends',
    yaw: 0.022,
    defaultFOV: 110,
    sensDecimals: 2,
    proRange: { min: 1.0, max: 2.8, median: 1.5 },
    samplePros: [
      { name: 'ImperialHal', team: 'Falcons', dpi: 800, sens: 1.6, edpi: 1280 },
      { name: 'sweetdreams', team: 'LG', dpi: 800, sens: 1.4, edpi: 1120 },
      { name: 'aceu', team: 'Content', dpi: 800, sens: 1.8, edpi: 1440 }
    ]
  },
  overwatch2: {
    id: 'overwatch2',
    name: 'Overwatch 2',
    yaw: 0.0066,
    defaultFOV: 103,
    sensDecimals: 2,
    proRange: { min: 3.0, max: 8.5, median: 4.8 },
    samplePros: [
      { name: 'Proper', team: 'Falcons', dpi: 800, sens: 4.5, edpi: 3600 },
      { name: 'Lip', team: 'Dragons', dpi: 800, sens: 4.25, edpi: 3400 },
      { name: 'Shu', team: 'Toronto', dpi: 800, sens: 5.0, edpi: 4000 }
    ]
  },
  rainbow6: {
    id: 'rainbow6',
    name: 'Rainbow Six Siege',
    yaw: 0.00572957795,
    defaultFOV: 84,
    sensDecimals: 1,
    proRange: { min: 4, max: 25, median: 9 },
    samplePros: [
      { name: 'Beaulo', team: 'DarkZero', dpi: 400, sens: 11, edpi: 4400 },
      { name: 'Shaiiko', team: 'BDS', dpi: 400, sens: 12, edpi: 4800 },
      { name: 'Spoit', team: 'M80', dpi: 400, sens: 9, edpi: 3600 }
    ]
  },
  cod: {
    id: 'cod',
    name: 'Call of Duty (MW/WZ)',
    yaw: 0.0066,
    defaultFOV: 120,
    sensDecimals: 2,
    proRange: { min: 3.5, max: 9.0, median: 5.2 },
    samplePros: [
      { name: 'Scump', team: 'OpTic', dpi: 800, sens: 5.0, edpi: 4000 },
      { name: 'Symfuhny', team: 'Content', dpi: 800, sens: 4.8, edpi: 3840 },
      { name: 'Aydan', team: 'NYSL', dpi: 800, sens: 6.0, edpi: 4800 }
    ]
  },
  pubg: {
    id: 'pubg',
    name: 'PUBG: BATTLEGROUNDS',
    yaw: 0.007,
    defaultFOV: 90,
    sensDecimals: 1,
    proRange: { min: 25, max: 55, median: 42 },
    samplePros: [
      { name: 'TGLTN', team: 'Soniqs', dpi: 800, sens: 40, edpi: 32000 },
      { name: 'Pio', team: 'Gen.G', dpi: 400, sens: 50, edpi: 20000 }
    ]
  },
  fortnite: {
    id: 'fortnite',
    name: 'Fortnite',
    yaw: 0.00555556,
    defaultFOV: 80,
    sensDecimals: 2,
    proRange: { min: 5.0, max: 14.0, median: 8.5 },
    samplePros: [
      { name: 'Mongraal', team: 'Pro', dpi: 800, sens: 8.8, edpi: 7040 },
      { name: 'Bugha', team: 'Dignitas', dpi: 800, sens: 7.2, edpi: 5760 }
    ]
  },
  deltaforce: {
    id: 'deltaforce',
    name: 'Delta Force',
    yaw: 0.022,
    defaultFOV: 105,
    sensDecimals: 2,
    proRange: { min: 0.8, max: 2.6, median: 1.35 },
    samplePros: [
      { name: 'shroud', team: 'Streamer', dpi: 800, sens: 1.4, edpi: 1120 },
      { name: 'LVNDMARK', team: 'Streamer', dpi: 400, sens: 1.8, edpi: 720 },
      { name: 'StankRat', team: 'Creator', dpi: 800, sens: 1.25, edpi: 1000 }
    ]
  }
};

/**
 * Calculates cm per 360 degree mouse turn based on game, sens, and DPI.
 */
export function calculateCm360(game: SupportedGame, sens: number, dpi: number): number {
  if (sens <= 0 || dpi <= 0) return 0;
  const config = GAME_CONFIGS[game];
  const countsPer360 = 360 / (sens * config.yaw);
  const inchesPer360 = countsPer360 / dpi;
  return inchesPer360 * 2.54;
}

/**
 * Calculates in-game sensitivity from desired cm/360, game, and DPI.
 */
export function calculateSensFromCm360(game: SupportedGame, cm360: number, dpi: number): number {
  if (cm360 <= 0 || dpi <= 0) return 0;
  const config = GAME_CONFIGS[game];
  const inchesPer360 = cm360 / 2.54;
  const countsPer360 = inchesPer360 * dpi;
  const sens = 360 / (countsPer360 * config.yaw);
  return Number(sens.toFixed(config.sensDecimals));
}

/**
 * Converts sensitivity directly from source game to target game while keeping cm/360 identical.
 */
export function convertSens(
  fromGame: SupportedGame,
  fromSens: number,
  fromDpi: number,
  toGame: SupportedGame,
  toDpi: number
): number {
  const cm360 = calculateCm360(fromGame, fromSens, fromDpi);
  return calculateSensFromCm360(toGame, cm360, toDpi);
}

/**
 * Returns speed category based on cm/360 with clean gaming terminology
 */
export function getSpeedCategory(cm360: number): {
  label: string;
  style: string;
  color: string;
  desc: string;
} {
  if (cm360 <= 0) return { label: 'Chưa xác định', style: 'text-gray-400', color: '#94a3b8', desc: '' };
  if (cm360 < 22) {
    return {
      label: 'Ultra High Sens',
      style: 'text-rose-400',
      color: '#fb7185',
      desc: 'Tốc độ quay cực nhanh bằng đầu ngón tay và cổ tay. Phù hợp các game nhịp độ dồn dập.'
    };
  }
  if (cm360 < 32) {
    return {
      label: 'High Sens',
      style: 'text-amber-400',
      color: '#fbbf24',
      desc: 'Lia góc 180 độ nhanh gọn, tốn ít diện tích lót chuột.'
    };
  }
  if (cm360 < 48) {
    return {
      label: 'Medium Sens',
      style: 'text-volt-500',
      color: '#00e599',
      desc: 'Mức chuẩn của đại đa số tuyển thủ chuyên nghiệp, cân bằng giữa tốc độ flick và bám tâm.'
    };
  }
  if (cm360 < 65) {
    return {
      label: 'Low Sens',
      style: 'text-cyan-400',
      color: '#22d3ee',
      desc: 'Độ chuẩn xác vi chỉnh cực cao bằng cẳng tay. Yêu cầu lót chuột cỡ vừa hoặc lớn.'
    };
  }
  return {
    label: 'Ultra Low Sens',
    style: 'text-indigo-400',
    color: '#818cf8',
    desc: 'Ưu tiên tối đa độ ổn định khi kê tâm xa. Cần quét tay biên độ rộng.'
  };
}
