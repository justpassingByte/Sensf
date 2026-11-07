import React, { useState, useEffect, useCallback } from 'react';
import { CrosshairConfig, MouseProfile, SupportedGame } from './types';
import { GAME_CONFIGS, calculateCm360 } from './lib/sensCalculator';
import { SensDatabase, ActiveState, TARGET_COLOR_PRESETS } from './lib/db';
import { PsaFinder } from './components/PsaFinder';
import { BenchmarkFinder } from './components/BenchmarkFinder';
import { SensConverter } from './components/SensConverter';
import { RecoilRange } from './components/RecoilRange';
import { ProfileManager } from './components/ProfileManager';
import { CrosshairCustomizer } from './components/CrosshairCustomizer';
import { 
  Target, 
  Activity, 
  ArrowRightLeft, 
  Flame, 
  Bookmark, 
  Crosshair, 
  Palette,
  X,
  Check
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeState, setActiveState] = useState<ActiveState>(() => SensDatabase.getActiveState());
  const [selectedGame, setSelectedGame] = useState<SupportedGame>(activeState.game);
  const [dpi, setDpi] = useState<number>(activeState.dpi);
  const [currentSens, setCurrentSens] = useState<number>(activeState.sensitivity);
  const [targetColor, setTargetColor] = useState<string>(() => SensDatabase.getTargetColor());
  
  const [activeTab, setActiveTabState] = useState<'psa' | 'benchmark' | 'converter' | 'recoil' | 'profiles'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['psa', 'benchmark', 'converter', 'recoil', 'profiles'].includes(hash)) {
      return hash as any;
    }
    return 'psa';
  });

  const setActiveTab = (tab: 'psa' | 'benchmark' | 'converter' | 'recoil' | 'profiles') => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };
  const [showCrosshairModal, setShowCrosshairModal] = useState(false);
  const [showTargetColorModal, setShowTargetColorModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveProfileName, setSaveProfileName] = useState('');
  const [saveToast, setSaveToast] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  const [crosshair, setCrosshair] = useState<CrosshairConfig>(() => SensDatabase.getCrosshair());
  const [profiles, setProfiles] = useState<MouseProfile[]>(() => SensDatabase.getProfiles());

  const triggerAutoSaveToast = useCallback((msg: string) => {
    setSaveToast({ visible: true, text: msg });
    setTimeout(() => {
      setSaveToast({ visible: false, text: '' });
    }, 2800);
  }, []);

  const updateAndSaveSens = useCallback((newSens: number, gameToUpdate = selectedGame, dpiToUpdate = dpi) => {
    const updated = SensDatabase.saveActiveState(gameToUpdate, newSens, dpiToUpdate);
    setActiveState(updated);
    setCurrentSens(newSens);
    setSelectedGame(gameToUpdate);
    setDpi(dpiToUpdate);
    triggerAutoSaveToast(`Đã lưu Sens ${newSens} vào hệ thống`);
  }, [selectedGame, dpi, triggerAutoSaveToast]);

  const handleGameChange = (newGame: SupportedGame) => {
    setSelectedGame(newGame);
    const gameMap = SensDatabase.getGameSensMap();
    const savedSensForGame = gameMap[newGame] || activeState.sensitivity;
    setCurrentSens(savedSensForGame);
    const updated = SensDatabase.saveActiveState(newGame, savedSensForGame, dpi);
    setActiveState(updated);
    triggerAutoSaveToast(`Đã tải Sens của ${GAME_CONFIGS[newGame].name}: ${savedSensForGame}`);
  };

  const handleDpiChange = (newDpi: number) => {
    setDpi(newDpi);
    updateAndSaveSens(currentSens, selectedGame, newDpi);
  };

  const handleTargetColorChange = (newColor: string) => {
    setTargetColor(newColor);
    SensDatabase.saveTargetColor(newColor);
    triggerAutoSaveToast(`Đã đổi màu địch`);
  };

  useEffect(() => {
    SensDatabase.saveCrosshair(crosshair);
  }, [crosshair]);

  useEffect(() => {
    SensDatabase.saveProfiles(profiles);
  }, [profiles]);

  const confirmSaveProfile = () => {
    const cm360 = calculateCm360(selectedGame, currentSens, dpi);
    const newProfile: MouseProfile = {
      id: Date.now().toString(),
      name: saveProfileName || `${GAME_CONFIGS[selectedGame].name} Custom Sens`,
      game: selectedGame,
      dpi,
      sensitivity: currentSens,
      cm360,
      edpi: Math.round(currentSens * dpi),
      date: new Date().toLocaleDateString('vi-VN')
    };
    const nextProfiles = [newProfile, ...profiles];
    setProfiles(nextProfiles);
    SensDatabase.saveProfiles(nextProfiles);
    setShowSaveModal(false);
    triggerAutoSaveToast(`Đã lưu hồ sơ ${newProfile.name}`);
    setActiveTab('profiles');
  };

  const handleDeleteProfile = (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    SensDatabase.saveProfiles(next);
  };

  const handleApplyProfile = (profile: MouseProfile) => {
    setSelectedGame(profile.game);
    setDpi(profile.dpi);
    updateAndSaveSens(profile.sensitivity, profile.game, profile.dpi);
  };

  const cm360 = calculateCm360(selectedGame, currentSens, dpi);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="border-b border-[#232938] bg-[#0c101a]/95 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 flex-wrap lg:flex-nowrap">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="SensFinder Logo"
              className="w-8 h-8 object-contain drop-shadow-[0_0_16px_rgba(0,229,153,0.4)]"
            />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-wider">
                SENSFINDER
              </span>
              <span className="px-1.5 py-0.5 rounded bg-volt-500 text-black text-[11px] font-black tracking-widest font-mono">
                PRO
              </span>
            </div>
          </div>

          {/* Focal Active Sens Status Pill */}
          <div className="hidden md:flex items-center gap-2.5 bg-[#131722] px-3.5 py-1.5 rounded-xl steam-border shadow-inner font-mono text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-volt-500 animate-pulse"></span>
            <span className="text-slate-400 font-sans">Sens:</span>
            <span className="font-extrabold text-volt-500 text-sm">
              {currentSens}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-200">{dpi} DPI</span>
            <span className="text-slate-600">•</span>
            <span className="text-white font-bold">{cm360.toFixed(1)} cm / 360°</span>
          </div>

          {/* Quick Settings: Game, DPI, Crosshair, Target Color */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            {/* Game Selector */}
            <div className="flex items-center gap-1.5 bg-[#131722] hover:bg-[#1a2030] steam-border rounded-xl px-2.5 py-1.5 transition-colors">
              <span className="text-xs text-slate-400 font-medium">Game:</span>
              <select
                value={selectedGame}
                onChange={(e) => handleGameChange(e.target.value as SupportedGame)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
              >
                {Object.keys(GAME_CONFIGS).map((key) => (
                  <option key={key} value={key} className="bg-[#131722] text-white">
                    {GAME_CONFIGS[key as SupportedGame].name}
                  </option>
                ))}
              </select>
            </div>

            {/* DPI Selector */}
            <div className="flex items-center gap-1 bg-[#131722] hover:bg-[#1a2030] steam-border rounded-xl px-2.5 py-1.5 transition-colors">
              <span className="text-xs text-slate-400 font-medium">DPI:</span>
              <select
                value={dpi}
                onChange={(e) => handleDpiChange(Number(e.target.value))}
                className="bg-transparent text-xs font-bold font-mono text-volt-500 focus:outline-none cursor-pointer"
              >
                {[400, 800, 1200, 1600, 3200].map((val) => (
                  <option key={val} value={val} className="bg-[#131722] text-white">
                    {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-5 w-px bg-slate-800 mx-0.5"></div>

            {/* Crosshair Button */}
            <button
              onClick={() => setShowCrosshairModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#131722] hover:bg-[#1a2030] steam-border text-slate-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap"
              title="Chỉnh tâm ngắm"
            >
              <Crosshair className="w-3.5 h-3.5 text-volt-500" />
              <span className="hidden sm:inline">Tâm ngắm</span>
            </button>

            {/* Target Color Button */}
            <button
              onClick={() => setShowTargetColorModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#131722] hover:bg-[#1a2030] steam-border text-slate-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer whitespace-nowrap"
              title="Đổi màu mục tiêu địch"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm shrink-0"
                style={{ backgroundColor: targetColor, boxShadow: `0 0 10px ${targetColor}cc` }}
              />
              <span className="hidden sm:inline">Màu địch</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#232938] no-scrollbar">
          <button
            onClick={() => setActiveTab('psa')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all uppercase tracking-wide ${
              activeTab === 'psa'
                ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                : 'bg-[#131722] hover:bg-[#1a2030] text-slate-200 hover:text-white steam-border'
            }`}
          >
            <Target className="w-4 h-4" /> Dò Sens PSA
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all uppercase tracking-wide ${
              activeTab === 'benchmark'
                ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                : 'bg-[#131722] hover:bg-[#1a2030] text-slate-200 hover:text-white steam-border'
            }`}
          >
            <Activity className="w-4 h-4" /> Quét Benchmark
          </button>

          <button
            onClick={() => setActiveTab('converter')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all uppercase tracking-wide ${
              activeTab === 'converter'
                ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                : 'bg-[#131722] hover:bg-[#1a2030] text-slate-200 hover:text-white steam-border'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Quy Đổi Sens
          </button>

          <button
            onClick={() => setActiveTab('recoil')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all uppercase tracking-wide ${
              activeTab === 'recoil'
                ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                : 'bg-[#131722] hover:bg-[#1a2030] text-slate-200 hover:text-white steam-border'
            }`}
          >
            <Target className="w-4 h-4" /> Bắn Thử Aim Lab
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all uppercase tracking-wide ${
              activeTab === 'profiles'
                ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                : 'bg-[#131722] hover:bg-[#1a2030] text-slate-200 hover:text-white steam-border'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Kho Hồ Sơ
            <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === 'profiles' ? 'bg-black/30 text-black' : 'bg-[#1a2030] text-volt-500 font-mono'}`}>
              {profiles.length}
            </span>
          </button>
        </div>

        {/* Tab Content Views */}
        <div>
          {activeTab === 'psa' && (
            <PsaFinder
              selectedGame={selectedGame}
              dpi={dpi}
              currentSens={currentSens}
              crosshair={crosshair}
              targetColor={targetColor}
              onSensFound={(optimal) => updateAndSaveSens(optimal, selectedGame, dpi)}
              onSaveProfile={() => {
                setSaveProfileName(`${GAME_CONFIGS[selectedGame].name} Sens`);
                setShowSaveModal(true);
              }}
            />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkFinder
              selectedGame={selectedGame}
              dpi={dpi}
              currentSens={currentSens}
              crosshair={crosshair}
              targetColor={targetColor}
              onSensFound={(peakSens) => updateAndSaveSens(peakSens, selectedGame, dpi)}
              onSaveProfile={() => {
                setSaveProfileName(`${GAME_CONFIGS[selectedGame].name} Benchmark Peak`);
                setShowSaveModal(true);
              }}
            />
          )}

          {activeTab === 'converter' && (
            <SensConverter
              initialGame={selectedGame}
              initialSens={currentSens}
              dpi={dpi}
              onApplySens={(newSens, game) => updateAndSaveSens(newSens, game, dpi)}
            />
          )}

          {activeTab === 'recoil' && (
            <RecoilRange
              game={selectedGame}
              sensitivity={currentSens}
              dpi={dpi}
              crosshair={crosshair}
              targetColor={targetColor}
              onTargetColorChange={handleTargetColorChange}
            />
          )}

          {activeTab === 'profiles' && (
            <ProfileManager
              profiles={profiles}
              onDeleteProfile={handleDeleteProfile}
              onApplyProfile={handleApplyProfile}
            />
          )}
        </div>
      </main>

      {/* Floating Auto-Save Notification Toast */}
      {saveToast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161b28] border border-volt-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-bounce">
          <div className="w-6 h-6 rounded-full bg-volt-500/20 text-volt-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span>{saveToast.text}</span>
        </div>
      )}

      {/* Crosshair Modal */}
      {showCrosshairModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full relative">
            <button
              onClick={() => setShowCrosshairModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-[#1a2030] hover:bg-[#232938] text-slate-300 hover:text-white transition-colors z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <CrosshairCustomizer config={crosshair} onChange={setCrosshair} />
          </div>
        </div>
      )}

      {/* Target Color Modal */}
      {showTargetColorModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="steam-panel rounded-2xl p-6 max-w-md w-full relative shadow-hero-card">
            <button
              onClick={() => setShowTargetColorModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-[#1a2030] hover:bg-[#232938] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1.5 tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-volt-500" />
              Tùy Chỉnh Màu Mục Tiêu Địch
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Lựa chọn tông màu sắc nét giúp phản xạ và vẩy tâm chính xác nhất trong phòng tập 3D.
            </p>

            {/* Live Visual Preview */}
            <div className="bg-[#0b0e14] border border-[#232938] rounded-xl p-5 mb-5 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#182338]/40 via-transparent to-transparent pointer-events-none" />
              
              {/* Target Sphere Preview */}
              <div 
                className="w-20 h-20 rounded-full transition-all duration-300 relative flex items-center justify-center border-2 border-white/20 shadow-2xl"
                style={{
                  backgroundColor: targetColor,
                  boxShadow: `0 0 35px ${targetColor}99, inset -8px -8px 16px rgba(0,0,0,0.4), inset 6px 6px 12px rgba(255,255,255,0.6)`
                }}
              >
                {/* Crosshair simulation on top */}
                <div className="w-3 h-0.5 bg-black/70 absolute"></div>
                <div className="h-3 w-0.5 bg-black/70 absolute"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
              </div>
              <div className="mt-3 font-mono text-xs font-bold text-slate-300">
                Mã màu: <span className="text-white uppercase font-mono">{targetColor}</span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold text-slate-300 block">
                Bảng Màu Nổi Tiếng
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_COLOR_PRESETS.map((preset) => {
                  const isSelected = targetColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      onClick={() => handleTargetColorChange(preset.hex)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#182329] border-volt-500 shadow-volt-glow'
                          : 'bg-[#121622] border-[#222838] hover:border-slate-500 hover:bg-[#181d2c]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/50 shrink-0"
                        style={{ backgroundColor: preset.hex, boxShadow: `0 0 8px ${preset.hex}80` }}
                      />
                      <span className="text-xs font-bold text-white truncate">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Input */}
            <div className="bg-[#121622] p-3 rounded-xl border border-[#222838] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={targetColor}
                  onChange={(e) => handleTargetColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <div>
                  <div className="text-xs font-bold text-white">Màu Tự Chọn</div>
                  <div className="text-[11px] text-slate-400">Chọn bất kỳ mã màu Hex</div>
                </div>
              </div>
              <input
                type="text"
                value={targetColor}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{0,7}$/.test(e.target.value)) {
                    handleTargetColorChange(e.target.value);
                  }
                }}
                className="w-24 bg-[#0b0e14] border border-[#2a3449] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white text-center focus:border-volt-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowTargetColorModal(false)}
                className="px-6 py-2 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-lg uppercase tracking-wider text-xs cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Profile Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="steam-panel rounded-2xl p-6 max-w-md w-full relative shadow-hero-card">
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-[#1a2030] hover:bg-[#232938] text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1.5 tracking-tight">Lưu Hồ Sơ Độ Nhạy Chuột</h3>
            <p className="text-xs text-slate-300 mb-4">
              Đặt tên để lưu thông số này vào danh sách cá nhân của bạn.
            </p>

            <div className="space-y-3 mb-6 text-sm">
              <div>
                <label className="text-slate-300 block mb-1 text-xs font-medium">Tên hồ sơ</label>
                <input
                  type="text"
                  value={saveProfileName}
                  onChange={(e) => setSaveProfileName(e.target.value)}
                  placeholder="Ví dụ: CS2 AK Headshot Sens"
                  className="w-full bg-[#0b0e14] steam-border rounded-lg px-3 py-2 text-white focus:border-volt-500 focus:outline-none"
                />
              </div>

              <div className="bg-[#0b0e14] p-3 rounded-xl steam-border text-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Game:</span>
                  <span className="font-bold text-white">{GAME_CONFIGS[selectedGame].name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Độ nhạy:</span>
                  <span className="font-bold text-volt-500 font-mono text-sm">{currentSens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">DPI:</span>
                  <span className="font-mono text-white">{dpi} DPI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Xoay 360°:</span>
                  <span className="font-mono text-white">{cm360.toFixed(1)} cm</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-[#1a2030] hover:bg-[#232938] text-slate-200 rounded-lg steam-border font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={confirmSaveProfile}
                className="px-5 py-2 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-lg uppercase tracking-wider"
              >
                Lưu vào kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
