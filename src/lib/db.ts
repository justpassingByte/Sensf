import { SupportedGame, MouseProfile, CrosshairConfig } from '../types';
import { calculateCm360 } from './sensCalculator';

const STORAGE_KEY_ACTIVE_STATE = 'sensfinder_active_state_v2';
const STORAGE_KEY_GAME_SENS_MAP = 'sensfinder_game_sens_map_v2';
const STORAGE_KEY_PROFILES = 'sensfinder_profiles_v2';
const STORAGE_KEY_CROSSHAIR = 'sensfinder_crosshair_v2';
const STORAGE_KEY_TARGET_COLOR = 'sensfinder_target_color_v2';

export interface ActiveState {
  game: SupportedGame;
  dpi: number;
  sensitivity: number;
  cm360: number;
  lastUpdated: number;
}

export const TARGET_COLOR_PRESETS = [
  { name: 'Vàng Phản Quang', hex: '#ffea00' },
  { name: 'Đỏ Ruby', hex: '#ff3355' },
  { name: 'Xanh Volt Neon', hex: '#00e599' },
  { name: 'Xanh Cyber Cyan', hex: '#00e5ff' },
  { name: 'Tím Neon Amethyst', hex: '#d946ef' },
  { name: 'Cam Rực Rỡ', hex: '#ff7700' },
  { name: 'Trắng Tinh Khiết', hex: '#ffffff' }
];

export const DEFAULT_GAME_SENS: Record<SupportedGame, number> = {
  cs2: 1.15,
  valorant: 0.36,
  apex: 1.15,
  overwatch2: 3.8,
  rainbow6: 9.0,
  cod: 4.8,
  pubg: 40.0,
  fortnite: 8.0
};

export class SensDatabase {
  static getActiveState(): ActiveState {
    const defaultGame: SupportedGame = 'valorant';
    const defaultDpi = 800;
    const defaultSens = DEFAULT_GAME_SENS[defaultGame];

    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_STATE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.sensitivity === 'number' &&
          !isNaN(parsed.sensitivity) &&
          parsed.sensitivity > 0 &&
          parsed.game
        ) {
          return parsed;
        }
      }
    } catch {}

    return {
      game: defaultGame,
      dpi: defaultDpi,
      sensitivity: defaultSens,
      cm360: calculateCm360(defaultGame, defaultSens, defaultDpi),
      lastUpdated: Date.now()
    };
  }

  static saveActiveState(game: SupportedGame, sensitivity: number, dpi: number): ActiveState {
    const cm360 = calculateCm360(game, sensitivity, dpi);
    const state: ActiveState = {
      game,
      dpi,
      sensitivity: Number(sensitivity.toFixed(4)),
      cm360: Number(cm360.toFixed(2)),
      lastUpdated: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_STATE, JSON.stringify(state));
      const gameMap = this.getGameSensMap();
      gameMap[game] = sensitivity;
      localStorage.setItem(STORAGE_KEY_GAME_SENS_MAP, JSON.stringify(gameMap));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    return state;
  }

  static getGameSensMap(): Record<SupportedGame, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GAME_SENS_MAP);
      if (raw) return { ...DEFAULT_GAME_SENS, ...JSON.parse(raw) };
    } catch {}
    return { ...DEFAULT_GAME_SENS };
  }

  static saveGameSens(game: SupportedGame, sens: number) {
    const map = this.getGameSensMap();
    map[game] = sens;
    try {
      localStorage.setItem(STORAGE_KEY_GAME_SENS_MAP, JSON.stringify(map));
    } catch {}
  }

  static getProfiles(): MouseProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: '1',
        name: 'Valorant Tournament Sens',
        game: 'valorant',
        dpi: 800,
        sensitivity: 0.32,
        cm360: 51.0,
        edpi: 256,
        date: 'Hôm nay'
      },
      {
        id: '2',
        name: 'CS2 Arm Aim (400 DPI)',
        game: 'cs2',
        dpi: 400,
        sensitivity: 1.4,
        cm360: 74.2,
        edpi: 560,
        date: 'Gần đây'
      }
    ];
  }

  static saveProfiles(profiles: MouseProfile[]) {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch {}
  }

  static getCrosshair(): CrosshairConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CROSSHAIR);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      color: '#00e599',
      size: 5,
      thickness: 2,
      gap: 3,
      dot: true,
      outline: true
    };
  }

  static saveCrosshair(config: CrosshairConfig) {
    try {
      localStorage.setItem(STORAGE_KEY_CROSSHAIR, JSON.stringify(config));
    } catch {}
  }

  // Target / Enemy color persistence
  static getTargetColor(): string {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TARGET_COLOR);
      if (raw) return raw;
    } catch {}
    return '#ffea00'; // Default high-visibility yellow
  }

  static saveTargetColor(hex: string) {
    try {
      localStorage.setItem(STORAGE_KEY_TARGET_COLOR, hex);
    } catch {}
  }
}
