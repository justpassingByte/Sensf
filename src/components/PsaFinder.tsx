import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CrosshairConfig, DrillResult, SupportedGame } from '../types';
import { GAME_CONFIGS, calculateCm360, getSpeedCategory, convertSens } from '../lib/sensCalculator';
import { FpsRange3D, DrillMode } from './FpsRange3D';
import { initPsaSession, advancePsaRound, PsaState, calculateDrillScore } from '../lib/psaAlgorithm';
import { ArrowRight, RotateCcw, Zap, Award, ChevronRight } from 'lucide-react';

interface Props {
  selectedGame: SupportedGame;
  dpi: number;
  currentSens: number;
  crosshair: CrosshairConfig;
  targetColor?: string;
  onSensFound: (optimalSens: number) => void;
  onSaveProfile?: (sens: number, game: SupportedGame) => void;
}

export const PsaFinder: React.FC<Props> = ({
  selectedGame,
  dpi,
  currentSens,
  crosshair,
  targetColor,
  onSensFound,
  onSaveProfile
}) => {
  const [baseSensInput, setBaseSensInput] = useState<number>(currentSens);
  const [drillMode, setDrillMode] = useState<DrillMode>('flicking');
  const [psaState, setPsaState] = useState<PsaState | null>(null);
  
  const [testStage, setTestStage] = useState<'low' | 'high' | 'review'>('low');
  const [tempLowResult, setTempLowResult] = useState<DrillResult | null>(null);
  const [tempHighResult, setTempHighResult] = useState<DrillResult | null>(null);

  useEffect(() => {
    if (!psaState) {
      setBaseSensInput(currentSens);
    }
  }, [currentSens, psaState]);

  const handleStartPsa = () => {
    const validBase = isNaN(baseSensInput) || baseSensInput <= 0 ? (currentSens > 0 ? currentSens : 0.35) : baseSensInput;
    const session = initPsaSession(validBase, 5);
    setPsaState(session);
    setTestStage('low');
    setTempLowResult(null);
    setTempHighResult(null);
  };

  const handleCompleteLow = (result: DrillResult) => {
    const scoredResult = { ...result, score: calculateDrillScore(result) };
    setTempLowResult(scoredResult);
    setTestStage('high');
  };

  const handleCompleteHigh = (result: DrillResult) => {
    const scoredResult = { ...result, score: calculateDrillScore(result) };
    setTempHighResult(scoredResult);
    setTestStage('review');
  };

  const handleAdvanceRound = (chosen: 'low' | 'high') => {
    if (!psaState || !tempLowResult || !tempHighResult) return;

    const nextState = advancePsaRound(psaState, tempLowResult, tempHighResult, chosen);
    setPsaState(nextState);

    if (nextState.isFinished && nextState.optimalSens !== null) {
      onSensFound(nextState.optimalSens);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } else {
      setTestStage('low');
      setTempLowResult(null);
      setTempHighResult(null);
    }
  };

  const handleReset = () => {
    setPsaState(null);
    setTestStage('low');
    setTempLowResult(null);
    setTempHighResult(null);
  };

  const gameConfig = GAME_CONFIGS[selectedGame];

  return (
    <div className="space-y-6">
      {/* Intro Configuration */}
      {!psaState && (
        <div className="steam-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Dò Tìm Độ Nhạy Chuột Phù Hợp Cơ Tay
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-6 font-normal">
              Hệ thống sẽ thử nghiệm hai mức độ nhạy chuột khác nhau qua các bài tập ngắn 12 giây. Dữ liệu độ giật cổ tay, tốc độ bám mục tiêu và số lần vẩy lệch sẽ giúp thuật toán tự động thu hẹp và tìm ra mức độ nhạy tối ưu nhất cho bạn.
            </p>

            {/* Inputs Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-200">
                    Sens Khởi Điểm
                  </label>
                  <span className="text-xs font-bold text-volt-500">{gameConfig.name}</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={baseSensInput}
                  onChange={(e) => setBaseSensInput(Math.max(0.01, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-[#0e121a] border border-[#2a3449] rounded-lg px-3 py-2 text-white font-mono font-bold text-lg focus:border-volt-500 focus:outline-none"
                />
              </div>

              <div className="bg-[#181d2a] p-4 rounded-xl steam-border flex flex-col justify-between">
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Cảm Biến Chuột
                </label>
                <div className="text-white font-mono font-bold text-lg">
                  {dpi} <span className="text-xs text-slate-300 font-normal">DPI</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {calculateCm360(selectedGame, baseSensInput, dpi).toFixed(1)} cm trên 360°
                </div>
              </div>

              <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
                <label className="text-xs font-semibold text-slate-200 block mb-2">
                  Bài Tập Kiểm Tra
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDrillMode('flicking')}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                      drillMode === 'flicking'
                        ? 'bg-volt-500 text-black border-volt-500 shadow-md font-extrabold'
                        : 'bg-[#0e121a] border-[#2a3449] text-slate-200 hover:text-white'
                    }`}
                  >
                    Flick
                  </button>
                  <button
                    onClick={() => setDrillMode('tracking')}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                      drillMode === 'tracking'
                        ? 'bg-volt-500 text-black border-volt-500 shadow-md font-extrabold'
                        : 'bg-[#0e121a] border-[#2a3449] text-slate-200 hover:text-white'
                    }`}
                  >
                    Tracking
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartPsa}
              className="px-8 py-3 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-xl shadow-volt-glow transition-all flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95"
            >
              <Zap className="w-4 h-4 fill-black" /> Bắt đầu kiểm tra
            </button>
          </div>
        </div>
      )}

      {/* Active In-Progress View */}
      {psaState && !psaState.isFinished && (
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="steam-panel rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-volt-500/20 border border-volt-500 text-volt-500 font-extrabold text-base font-mono">
                {psaState.currentRound}/{psaState.maxRounds}
              </div>
              <div>
                <div className="text-xs text-slate-300 font-medium">
                  VÒNG {psaState.currentRound} TRÊN {psaState.maxRounds}
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-3 font-mono mt-0.5">
                  <span>Mức Thấp: <strong className="text-volt-500 font-extrabold">{psaState.lowSens}</strong></span>
                  <span className="text-slate-500">|</span>
                  <span>Mức Cao: <strong className="text-white font-extrabold">{psaState.highSens}</strong></span>
                </div>
              </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={`px-3 py-1.5 rounded-lg ${
                testStage === 'low'
                  ? 'bg-volt-500 text-black font-bold'
                  : tempLowResult
                  ? 'bg-[#1e2538] text-volt-500 font-semibold'
                  : 'text-slate-400 bg-[#161b28]'
              }`}>
                Bước 1: Sens Thấp
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span className={`px-3 py-1.5 rounded-lg ${
                testStage === 'high'
                  ? 'bg-volt-500 text-black font-bold'
                  : tempHighResult
                  ? 'bg-[#1e2538] text-volt-500 font-semibold'
                  : 'text-slate-400 bg-[#161b28]'
              }`}>
                Bước 2: Sens Cao
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span className={`px-3 py-1.5 rounded-lg ${
                testStage === 'review'
                  ? 'bg-volt-500 text-black font-bold'
                  : 'text-slate-400 bg-[#161b28]'
              }`}>
                Bước 3: Chọn Lọc
              </span>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-slate-300 hover:text-rose-400 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a2030] font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Bắt đầu lại
            </button>
          </div>

          {/* Test Stage 1: Low Sens */}
          {testStage === 'low' && (
            <div>
              <div className="mb-2 text-xs font-mono text-volt-500 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-volt-500 animate-pulse"></span>
                Đang thử mức Thấp: {psaState.lowSens} • Quãng xoay: {calculateCm360(selectedGame, psaState.lowSens, dpi).toFixed(1)} cm
              </div>
              <FpsRange3D
                game={selectedGame}
                sensitivity={psaState.lowSens}
                mode={drillMode}
                durationSeconds={12}
                crosshair={crosshair}
                targetColor={targetColor}
                isActive={true}
                onComplete={handleCompleteLow}
              />
            </div>
          )}

          {/* Test Stage 2: High Sens */}
          {testStage === 'high' && (
            <div>
              <div className="mb-2 text-xs font-mono text-slate-200 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-volt-500 animate-pulse"></span>
                Đang thử mức Cao: {psaState.highSens} • Quãng xoay: {calculateCm360(selectedGame, psaState.highSens, dpi).toFixed(1)} cm
              </div>
              <FpsRange3D
                game={selectedGame}
                sensitivity={psaState.highSens}
                mode={drillMode}
                durationSeconds={12}
                crosshair={crosshair}
                targetColor={targetColor}
                isActive={true}
                onComplete={handleCompleteHigh}
              />
            </div>
          )}

          {/* Review & Choice Stage */}
          {testStage === 'review' && tempLowResult && tempHighResult && (
            <div className="steam-panel rounded-2xl p-6 shadow-hero-card">
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Award className="w-5 h-5 text-volt-500" />
                Kết Quả Vòng {psaState.currentRound}
              </h3>
              <p className="text-sm text-slate-200 mb-6">
                Chọn mức cảm giác tay ổn định hơn để hệ thống tiếp tục thu hẹp phạm vi.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {/* Low Sens Card */}
                <div className={`p-5 rounded-xl border relative transition-all ${
                  tempLowResult.score >= tempHighResult.score
                    ? 'bg-[#182329] border-volt-500 shadow-volt-glow'
                    : 'bg-[#151924] steam-border opacity-85'
                }`}>
                  <div className="text-xs font-bold text-slate-300 uppercase mb-1">MỨC SENS THẤP</div>
                  <div className="text-4xl font-extrabold font-mono text-white mb-4">
                    {psaState.lowSens}
                  </div>

                  <div className="space-y-2.5 text-xs border-t border-[#2a3449] pt-3 text-slate-200 font-medium">
                    <div className="flex justify-between">
                      <span>Điểm kiểm soát:</span>
                      <span className="font-bold text-volt-500 text-sm font-mono">{tempLowResult.score} / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Độ chuẩn xác:</span>
                      <span className="font-mono text-white font-bold">{tempLowResult.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Độ mượt đường chuột:</span>
                      <span className="font-mono text-white font-bold">{tempLowResult.smoothness}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lệch quá mục tiêu:</span>
                      <span className="text-rose-400 font-bold font-mono">{tempLowResult.overshootCount} lần</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdvanceRound('low')}
                    className="w-full mt-5 py-3 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    Chọn mức {psaState.lowSens} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* High Sens Card */}
                <div className={`p-5 rounded-xl border relative transition-all ${
                  tempHighResult.score > tempLowResult.score
                    ? 'bg-[#182329] border-volt-500 shadow-volt-glow'
                    : 'bg-[#151924] steam-border opacity-85'
                }`}>
                  <div className="text-xs font-bold text-slate-300 uppercase mb-1">MỨC SENS CAO</div>
                  <div className="text-4xl font-extrabold font-mono text-white mb-4">
                    {psaState.highSens}
                  </div>

                  <div className="space-y-2.5 text-xs border-t border-[#2a3449] pt-3 text-slate-200 font-medium">
                    <div className="flex justify-between">
                      <span>Điểm kiểm soát:</span>
                      <span className="font-bold text-volt-500 text-sm font-mono">{tempHighResult.score} / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Độ chuẩn xác:</span>
                      <span className="font-mono text-white font-bold">{tempHighResult.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Độ mượt đường chuột:</span>
                      <span className="font-mono text-white font-bold">{tempHighResult.smoothness}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lệch quá mục tiêu:</span>
                      <span className="text-rose-400 font-bold font-mono">{tempHighResult.overshootCount} lần</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdvanceRound('high')}
                    className="w-full mt-5 py-3 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    Chọn mức {psaState.highSens} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finished Screen */}
      {psaState && psaState.isFinished && psaState.optimalSens && (
        <div className="steam-panel rounded-2xl p-8 text-center relative overflow-hidden steam-border-glow">
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Độ Nhạy Chuột Tối Ưu Của Bạn
          </h2>
          <p className="text-sm text-slate-200 max-w-md mx-auto mb-6">
            Mức sens đã được tự động áp dụng và quy đổi đồng bộ sang toàn bộ các tựa game khác.
          </p>

          <div className="inline-block p-6 bg-[#161b28] steam-border rounded-2xl mb-8 min-w-[300px]">
            <div className="text-xs uppercase font-bold text-slate-300 mb-1">
              {gameConfig.name}
            </div>
            <div className="text-6xl font-black font-mono text-volt-500 tracking-tight my-2">
              {psaState.optimalSens}
            </div>
            <div className="text-xs font-mono text-slate-200 flex items-center justify-center gap-3 font-semibold mt-3">
              <span>{dpi} DPI</span>
              <span>•</span>
              <span>{calculateCm360(selectedGame, psaState.optimalSens, dpi).toFixed(1)} cm trên 360°</span>
              <span>•</span>
              <span>eDPI {(psaState.optimalSens * dpi).toFixed(0)}</span>
            </div>
            <div className="mt-4">
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg bg-[#0e121a] steam-border ${getSpeedCategory(calculateCm360(selectedGame, psaState.optimalSens, dpi)).style}`}>
                {getSpeedCategory(calculateCm360(selectedGame, psaState.optimalSens, dpi)).label}
              </span>
            </div>
          </div>

          {/* Quick Cross-game preview */}
          <div className="max-w-xl mx-auto bg-[#161b28] steam-border rounded-xl p-5 mb-6 text-left">
            <div className="text-xs font-bold uppercase text-slate-300 mb-3">
              Quy đổi đồng bộ sang các tựa game
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {(['cs2', 'valorant', 'apex', 'overwatch2'] as SupportedGame[]).map((gKey) => {
                const converted = convertSens(selectedGame, psaState.optimalSens!, dpi, gKey, dpi);
                return (
                  <div key={gKey} className="bg-[#0e121a] p-3 rounded-lg steam-border">
                    <div className="text-slate-300 text-xs font-medium">{GAME_CONFIGS[gKey].name}</div>
                    <div className="text-white font-mono font-bold text-base mt-1">{converted}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            {onSaveProfile && (
              <button
                onClick={() => onSaveProfile(psaState.optimalSens!, selectedGame)}
                className="px-6 py-2.5 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all"
              >
                Tạo Hồ Sơ Tùy Chỉnh
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#161b28] hover:bg-[#1e2538] text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-2 transition-colors steam-border"
            >
              <RotateCcw className="w-4 h-4" /> Bắt đầu lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
