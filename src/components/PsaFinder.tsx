import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CrosshairConfig, DrillResult, SupportedGame, DrillDifficulty, DrillAngle, DIFFICULTY_CONFIGS } from '../types';
import { GAME_CONFIGS, calculateCm360, getSpeedCategory, convertSens } from '../lib/sensCalculator';
import { FpsRange3D, DrillMode } from './FpsRange3D';
import { initPsaSession, advancePsaRound, PsaState, calculateDrillScore } from '../lib/psaAlgorithm';
import { ArrowRight, RotateCcw, Zap, Award, ChevronRight, ZoomIn, ZoomOut, Target, Shield } from 'lucide-react';

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
  const [difficulty, setDifficulty] = useState<DrillDifficulty>('medium');
  const [drillAngle, setDrillAngle] = useState<DrillAngle>('90');
  const [isZoomed, setIsZoomed] = useState(false);
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
        <div className="steam-panel rounded-2xl p-6 relative overflow-hidden shadow-hero-card">
          {/* Header */}
          <div className="border-b border-[#232938] pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>Dò Tìm Độ Nhạy Chuột Phù Hợp Cơ Tay</span>
                <span className="px-2.5 py-0.5 rounded-full bg-volt-500/15 text-volt-400 font-mono text-xs font-bold border border-volt-500/30">
                  Thuật Toán PSA 5 Vòng
                </span>
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Thử nghiệm 2 mức Sens (Thấp vs Cao) qua các bài tập 12 giây để phát hiện xu hướng vẩy hụt tầm (Undershoot) hoặc quá đà (Overshoot), từ đó tìm ra điểm cân bằng hoàn hảo cho cổ tay.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#131722] px-3.5 py-1.5 rounded-xl steam-border font-mono text-xs shrink-0 self-start md:self-auto">
              <span className="text-slate-400">Đang chọn:</span>
              <span className="font-bold text-volt-500">{gameConfig.name}</span>
              <span className="text-slate-600">•</span>
              <span className="text-white">{dpi} DPI</span>
            </div>
          </div>

          {/* 2-Column Balanced Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Inputs & Difficulty */}
            <div className="lg:col-span-8 space-y-5">
              {/* Row 1: 3 Configuration Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-200">
                      Sens Khởi Điểm
                    </label>
                    <span className="text-xs font-bold text-volt-500 font-mono">{gameConfig.name}</span>
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
                    Cảm Biến Chuột (DPI)
                  </label>
                  <div className="text-white font-mono font-bold text-lg">
                    {dpi} <span className="text-xs text-slate-300 font-normal">DPI</span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {calculateCm360(selectedGame, baseSensInput, dpi).toFixed(1)} cm / 360°
                  </div>
                </div>

                <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
                  <label className="text-xs font-semibold text-slate-200 block mb-2">
                    Bài Tập Kiểm Tra
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDrillMode('flicking')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        drillMode === 'flicking'
                          ? 'bg-volt-500 text-black border-volt-500 shadow-volt-glow font-extrabold'
                          : 'bg-[#0e121a] border-[#2a3449] text-slate-200 hover:text-white'
                      }`}
                    >
                      Flick Bắn Lướt
                    </button>
                    <button
                      onClick={() => setDrillMode('tracking')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        drillMode === 'tracking'
                          ? 'bg-volt-500 text-black border-volt-500 shadow-volt-glow font-extrabold'
                          : 'bg-[#0e121a] border-[#2a3449] text-slate-200 hover:text-white'
                      }`}
                    >
                      Tracking Bám Tâm
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Difficulty Selector Cards */}
              <div className="bg-[#181d2a] p-4 sm:p-5 rounded-xl steam-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#232a3b]">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Độ Khó Mục Tiêu Aim Lab</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      (Kích thước mục tiêu đo độ chính xác vi chỉnh)
                    </span>
                  </label>
                  <span className="text-xs text-volt-400 font-medium">
                    {DIFFICULTY_CONFIGS[difficulty].description}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['easy', 'medium', 'hard', 'pro'] as DrillDifficulty[]).map((diffKey) => {
                    const conf = DIFFICULTY_CONFIGS[diffKey];
                    const isSelected = difficulty === diffKey;
                    return (
                      <button
                        key={diffKey}
                        type="button"
                        onClick={() => setDifficulty(diffKey)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#222a3d] border-volt-500 shadow-volt-glow ring-1 ring-volt-500/50'
                            : 'bg-[#0e121a] border-[#2a3449] hover:border-slate-500 hover:bg-[#121622]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-volt-500' : 'text-white'}`}>
                            {conf.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            r={conf.targetRadius}m
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 leading-snug">
                          {diffKey === 'easy' && 'Mục tiêu to, dễ vẩy cho người mới'}
                          {diffKey === 'medium' && 'Kích thước chuẩn thi đấu FPS'}
                          {diffKey === 'hard' && 'Mục tiêu nhỏ luyện micro-flick'}
                          {diffKey === 'pro' && 'Mục tiêu siêu nhỏ headshot pixel'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Combat Angle Selector */}
              <div className="bg-[#181d2a] p-4 sm:p-5 rounded-xl steam-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 pb-2 border-b border-[#232a3b]">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Góc Xuất Hiện Mục Tiêu</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      (Không gian xuất hiện mục tiêu thực chiến)
                    </span>
                  </label>
                  <span className="text-xs text-volt-400 font-mono font-medium">
                    {drillAngle === '360' ? '360° Toàn Cảnh (Trước, sườn & sau lưng)' : drillAngle === '180' ? '180° Bán Nguyệt (Trước mặt & hai bên sườn)' : '90° Trước Mặt (Góc hẹp trực diện)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: '90', label: '90° Trước Mặt', tag: 'Trực diện', desc: 'Đấu súng trực diện, phù hợp luyện phản xạ góc hẹp' },
                    { id: '180', label: '180° Bán Nguyệt', tag: 'Góc rộng', desc: 'Quét mục tiêu nửa vòng tròn, luyện vẩy góc rộng sang 2 bên sườn' },
                    { id: '360', label: '360° Toàn Cảnh', tag: 'Thực chiến', desc: 'Địch xuất hiện ngẫu nhiên khắp nơi 360°, có radar chỉ hướng' }
                  ].map((ang) => {
                    const isSelected = drillAngle === ang.id;
                    return (
                      <button
                        key={ang.id}
                        type="button"
                        onClick={() => setDrillAngle(ang.id as DrillAngle)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#222a3d] border-volt-500 shadow-volt-glow ring-1 ring-volt-500/50'
                            : 'bg-[#0e121a] border-[#2a3449] hover:border-slate-500 hover:bg-[#121622]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-volt-500' : 'text-white'}`}>
                            {ang.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131722] text-slate-400 border border-slate-700">
                            {ang.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 leading-snug">{ang.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartPsa}
                className="w-full sm:w-auto px-10 py-3.5 bg-volt-500 hover:bg-volt-400 text-black font-black rounded-xl shadow-volt-glow transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider active:scale-95 cursor-pointer font-mono"
              >
                <Zap className="w-4 h-4 fill-black" /> Bắt đầu kiểm tra PSA (5 vòng)
              </button>
            </div>

            {/* Right Column (4 cols): Protocol Guide & Pro Tips (Fills the right side!) */}
            <div className="lg:col-span-4 bg-[#141926] p-5 rounded-xl steam-border space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222a3d]">
                <Shield className="w-4 h-4 text-volt-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Quy Trình Dò Sens PSA
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-volt-500/15 text-volt-400 font-bold flex items-center justify-center shrink-0 font-mono text-[11px] border border-volt-500/30">
                    1
                  </div>
                  <div>
                    <strong className="text-white block">Thử Sens Thấp & Sens Cao</strong>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Mỗi vòng bạn sẽ bắn thử 12 giây ở 2 mức Sens chênh lệch nhau để so sánh cảm giác cơ tay.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-volt-500/15 text-volt-400 font-bold flex items-center justify-center shrink-0 font-mono text-[11px] border border-volt-500/30">
                    2
                  </div>
                  <div>
                    <strong className="text-white block">Phát hiện Lố tâm / Hụt tầm</strong>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Thuật toán tự động đo độ vẩy chuột vượt qua mục tiêu (Overshoot) hoặc chưa tới (Undershoot).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-volt-500/15 text-volt-400 font-bold flex items-center justify-center shrink-0 font-mono text-[11px] border border-volt-500/30">
                    3
                  </div>
                  <div>
                    <strong className="text-white block">Tìm ra Golden Sens sau 5 vòng</strong>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Sau 5 vòng thu hẹp dải tìm kiếm, hệ thống xác định con số độ nhạy vàng lý tưởng nhất cho bạn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div className="p-3.5 bg-[#0d1017] rounded-xl steam-border text-[11px] text-slate-300 leading-relaxed border-l-2 border-volt-500">
                <strong className="text-volt-400 block mb-1">Mẹo chuẩn bị thi đấu:</strong>
                Hãy ngồi đúng tư thế cầm chuột thường ngày, đặt cẳng tay thoải mái trên bàn và chuẩn bị sẵn sàng trước khi nhấn nút.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active In-Progress View */}
      {psaState && !psaState.isFinished && (
        <div className="space-y-4">
          {/* Progress Header & Live Difficulty / Zoom Toolbar */}
          <div className="steam-panel rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-volt-500/20 border border-volt-500 text-volt-500 font-extrabold text-base font-mono">
                {psaState.currentRound}/{psaState.maxRounds}
              </div>
              <div>
                <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
                  <span>VÒNG {psaState.currentRound} TRÊN {psaState.maxRounds}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-volt-400 font-mono uppercase font-bold">{drillMode === 'flicking' ? 'Flick Bắn Lướt' : 'Tracking Bám Tâm'}</span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-3 font-mono mt-0.5">
                  <span>Mức Thấp: <strong className="text-volt-500 font-extrabold">{psaState.lowSens}</strong></span>
                  <span className="text-slate-500">|</span>
                  <span>Mức Cao: <strong className="text-white font-extrabold">{psaState.highSens}</strong></span>
                </div>
              </div>
            </div>

            {/* Locked Difficulty Badge & ADS Zoom Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-[#131722] px-3 py-1.5 rounded-xl steam-border text-xs">
                <span className="text-slate-400 font-medium">Độ khó mục tiêu:</span>
                <span className="px-2 py-0.5 rounded bg-volt-500/20 text-volt-400 font-mono font-extrabold text-[11px] uppercase border border-volt-500/30">
                  {DIFFICULTY_CONFIGS[difficulty].name} (r={DIFFICULTY_CONFIGS[difficulty].targetRadius}m)
                </span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">• Cố định cho 5 vòng</span>
              </div>

              <button
                type="button"
                onClick={() => setIsZoomed((z) => !z)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer steam-border ${
                  isZoomed
                    ? 'bg-volt-500 text-black shadow-volt-glow font-black'
                    : 'bg-[#131722] text-slate-200 hover:text-white'
                }`}
                title="Chuột phải hoặc bấm để phóng to ngắm (ADS)"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Thu Nhỏ (74°)</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-3.5 h-3.5 text-volt-500" />
                    <span>Ngắm ADS</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="text-xs text-slate-300 hover:text-rose-400 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a2030] font-medium steam-border cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Bắt đầu lại
              </button>
            </div>
          </div>

          {/* Persistent Continuous FpsRange3D (Stays mounted across all 5 rounds and stages without ever exiting Fullscreen) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono font-bold bg-[#131722] p-3 rounded-xl steam-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-volt-500 animate-pulse"></span>
                <span className={testStage === 'low' ? 'text-volt-500 font-extrabold' : 'text-slate-200'}>
                  {testStage === 'low'
                    ? `Vòng ${psaState.currentRound}/5 • Lượt 1/2: Thử Sens Thấp (${psaState.lowSens})`
                    : testStage === 'high'
                    ? `Vòng ${psaState.currentRound}/5 • Lượt 2/2: Thử Sens Cao (${psaState.highSens})`
                    : `Vòng ${psaState.currentRound}/5 • Đã Xong 2 Lượt: So Sánh Kết Quả`}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-300 hidden sm:inline">
                  Quãng xoay: {calculateCm360(selectedGame, testStage === 'high' ? psaState.highSens : psaState.lowSens, dpi).toFixed(1)} cm
                </span>
              </div>
              <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                <span>Góc: <strong className="text-volt-400">{drillAngle === '360' ? '360° Toàn Cảnh' : drillAngle === '180' ? '180° Bán Nguyệt' : '90° Trước Mặt'}</strong></span>
                <span>•</span>
                <span>Độ khó: <strong className="text-volt-400">{DIFFICULTY_CONFIGS[difficulty].name}</strong></span>
              </div>
            </div>

            <FpsRange3D
              game={selectedGame}
              sensitivity={testStage === 'high' ? psaState.highSens : psaState.lowSens}
              mode={drillMode}
              difficulty={difficulty}
              angle={drillAngle}
              isZoomed={isZoomed}
              onToggleZoom={() => setIsZoomed((z) => !z)}
              durationSeconds={12}
              crosshair={crosshair}
              targetColor={targetColor}
              isActive={true}
              stageTitle={
                testStage === 'low'
                  ? `Vòng ${psaState.currentRound}/5 (Lượt 1/2): Thử Sens Thấp ${psaState.lowSens}`
                  : `Vòng ${psaState.currentRound}/5 (Lượt 2/2): Thử Sens Cao ${psaState.highSens}`
              }
              onComplete={testStage === 'low' ? handleCompleteLow : handleCompleteHigh}
              customOverlay={
                testStage === 'review' && tempLowResult && tempHighResult ? (
                  <div className="max-w-2xl w-full bg-[#111520] steam-border rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-[#232938] pb-4 mb-5">
                      <div>
                        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                          <Award className="w-5 h-5 text-volt-500" />
                          Kết Quả Vòng {psaState.currentRound} / 5
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">
                          Chọn mức Sens cho cảm giác cơ tay kiểm soát chắc chắn hơn để tiếp tục thu hẹp dải tìm kiếm.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-volt-500/15 text-volt-400 font-mono text-xs font-bold border border-volt-500/30">
                        Vòng {psaState.currentRound} / 5
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Low Sens Card */}
                      <div className={`p-4 rounded-xl border relative transition-all ${
                        tempLowResult.score >= tempHighResult.score
                          ? 'bg-[#182329] border-volt-500 shadow-volt-glow'
                          : 'bg-[#151924] steam-border opacity-85'
                      }`}>
                        <div className="text-xs font-bold text-slate-300 uppercase mb-1">MỨC SENS THẤP</div>
                        <div className="text-3xl font-extrabold font-mono text-white mb-3">
                          {psaState.lowSens}
                        </div>

                        <div className="space-y-2 text-xs border-t border-[#2a3449] pt-2.5 text-slate-200 font-medium">
                          <div className="flex justify-between">
                            <span>Điểm kiểm soát:</span>
                            <span className="font-bold text-volt-500 text-sm font-mono">{tempLowResult.score} / 100</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Độ chuẩn xác:</span>
                            <span className="font-mono text-white font-bold">{tempLowResult.accuracy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Độ mượt chuột:</span>
                            <span className="font-mono text-white font-bold">{tempLowResult.smoothness}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phản xạ trung bình:</span>
                            <span className="font-mono text-white font-bold">{tempLowResult.avgReactionTimeMs}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lố tâm / Hụt tầm:</span>
                            <span className="font-mono text-rose-400 font-bold">{tempLowResult.overshootCount} / {tempLowResult.undershootCount}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdvanceRound('low')}
                          className="w-full mt-4 py-2.5 bg-volt-500 hover:bg-volt-400 text-black font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-volt-glow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Chọn mức {psaState.lowSens} <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* High Sens Card */}
                      <div className={`p-4 rounded-xl border relative transition-all ${
                        tempHighResult.score > tempLowResult.score
                          ? 'bg-[#182329] border-volt-500 shadow-volt-glow'
                          : 'bg-[#151924] steam-border opacity-85'
                      }`}>
                        <div className="text-xs font-bold text-slate-300 uppercase mb-1">MỨC SENS CAO</div>
                        <div className="text-3xl font-extrabold font-mono text-white mb-3">
                          {psaState.highSens}
                        </div>

                        <div className="space-y-2 text-xs border-t border-[#2a3449] pt-2.5 text-slate-200 font-medium">
                          <div className="flex justify-between">
                            <span>Điểm kiểm soát:</span>
                            <span className="font-bold text-volt-500 text-sm font-mono">{tempHighResult.score} / 100</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Độ chuẩn xác:</span>
                            <span className="font-mono text-white font-bold">{tempHighResult.accuracy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Độ mượt chuột:</span>
                            <span className="font-mono text-white font-bold">{tempHighResult.smoothness}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phản xạ trung bình:</span>
                            <span className="font-mono text-white font-bold">{tempHighResult.avgReactionTimeMs}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lố tâm / Hụt tầm:</span>
                            <span className="font-mono text-rose-400 font-bold">{tempHighResult.overshootCount} / {tempHighResult.undershootCount}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdvanceRound('high')}
                          className="w-full mt-4 py-2.5 bg-volt-500 hover:bg-volt-400 text-black font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-volt-glow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Chọn mức {psaState.highSens} <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : undefined
              }
            />
          </div>
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
              {(['cs2', 'valorant', 'deltaforce', 'apex', 'overwatch2'] as SupportedGame[])
                .filter((gKey) => gKey !== selectedGame)
                .slice(0, 4)
                .map((gKey) => {
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
