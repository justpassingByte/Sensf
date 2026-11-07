import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { BenchmarkPoint, CrosshairConfig, DrillResult, SupportedGame, DrillDifficulty, DrillMode, DIFFICULTY_CONFIGS } from '../types';
import { GAME_CONFIGS, calculateCm360 } from '../lib/sensCalculator';
import { FpsRange3D } from './FpsRange3D';
import { calculateDrillScore } from '../lib/psaAlgorithm';
import { BarChart3, Play, ZoomIn, ZoomOut, TrendingUp, Award, Shield } from 'lucide-react';

interface Props {
  selectedGame: SupportedGame;
  dpi: number;
  currentSens: number;
  crosshair: CrosshairConfig;
  targetColor?: string;
  onSensFound: (sens: number) => void;
  onSaveProfile?: (sens: number, game: SupportedGame) => void;
}

export const BenchmarkFinder: React.FC<Props> = ({
  selectedGame,
  dpi,
  currentSens,
  crosshair,
  targetColor,
  onSensFound,
  onSaveProfile
}) => {
  const [minSens, setMinSens] = useState<number>(() => Math.max(0.05, Number((currentSens * 0.6).toFixed(2))));
  const [maxSens, setMaxSens] = useState<number>(() => Number((currentSens * 1.5).toFixed(2)));
  const [drillMode, setDrillMode] = useState<DrillMode>('flicking');
  const [difficulty, setDifficulty] = useState<DrillDifficulty>('medium');
  const [isZoomed, setIsZoomed] = useState(false);
  const [numSteps] = useState<number>(5);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [points, setPoints] = useState<BenchmarkPoint[]>([]);
  const [testPoints, setTestPoints] = useState<number[]>([]);
  const [bestSens, setBestSens] = useState<BenchmarkPoint | null>(null);

  const handleStart = () => {
    const validMin = isNaN(minSens) || minSens <= 0 ? 0.1 : minSens;
    const validMax = isNaN(maxSens) || maxSens <= validMin ? validMin * 2 : maxSens;
    const step = (validMax - validMin) / (numSteps - 1);
    const generated: number[] = [];
    for (let i = 0; i < numSteps; i++) {
      generated.push(Number((validMin + i * step).toFixed(3)));
    }
    setTestPoints(generated);
    setPoints([]);
    setCurrentStepIndex(0);
    setIsRunning(true);
    setBestSens(null);
  };

  const handleStepComplete = (result: DrillResult) => {
    const testedSens = testPoints[currentStepIndex];
    const score = calculateDrillScore(result);
    const cm360 = calculateCm360(selectedGame, testedSens, dpi);
    const totalMiss = result.overshootCount + result.undershootCount;
    const overshootRate = totalMiss > 0 ? (result.overshootCount / totalMiss) * 100 : 0;

    const newPoint: BenchmarkPoint = {
      sens: testedSens,
      cm360,
      score,
      accuracy: result.accuracy,
      smoothness: result.smoothness,
      overshootRate
    };

    const nextPoints = [...points, newPoint];
    setPoints(nextPoints);

    if (currentStepIndex + 1 < testPoints.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsRunning(false);
      const sorted = [...nextPoints].sort((a, b) => b.score - a.score);
      const peak = sorted[0];
      setBestSens(peak);
      onSensFound(peak.sens);
      confetti({ particleCount: 100, spread: 70 });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setPoints([]);
    setCurrentStepIndex(0);
    setBestSens(null);
  };

  const gameConfig = GAME_CONFIGS[selectedGame];

  return (
    <div className="space-y-6">
      {/* Intro Configuration */}
      {!isRunning && points.length === 0 && (
        <div className="steam-panel rounded-2xl p-6 relative overflow-hidden shadow-hero-card">
          {/* Header */}
          <div className="border-b border-[#232938] pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>Quét & Đánh Giá Đỉnh Phong Độ Sens</span>
                <span className="px-2.5 py-0.5 rounded-full bg-volt-500/15 text-volt-400 font-mono text-xs font-bold border border-volt-500/30">
                  Thuật Toán Benchmark Oblivity
                </span>
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Hệ thống đưa bạn qua 5 mốc độ nhạy từ thấp đến cao để đo tốc độ di chuột, độ giật cơ tay và phản xạ vi chỉnh, từ đó dựng đường cong hiệu năng parabol để xác định đỉnh phong độ.
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
              {/* Row 1: Range Limits & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-200">
                      Cận Dưới (Sens Thấp)
                    </label>
                    <span className="text-xs font-bold text-volt-500 font-mono">{gameConfig.name}</span>
                  </div>
                  <input
                    type="number"
                    step="0.02"
                    value={minSens}
                    onChange={(e) => setMinSens(parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-[#0e121a] border border-[#2a3449] rounded-lg px-3 py-2 text-white font-mono font-bold text-base focus:border-volt-500 focus:outline-none"
                  />
                </div>

                <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-200">
                      Cận Trên (Sens Cao)
                    </label>
                    <span className="text-xs font-bold text-volt-500 font-mono">{gameConfig.name}</span>
                  </div>
                  <input
                    type="number"
                    step="0.02"
                    value={maxSens}
                    onChange={(e) => setMaxSens(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-[#0e121a] border border-[#2a3449] rounded-lg px-3 py-2 text-white font-mono font-bold text-base focus:border-volt-500 focus:outline-none"
                  />
                </div>

                <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
                  <label className="text-xs font-semibold text-slate-200 block mb-2">
                    Bài Tập Quét Sens
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
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
                      type="button"
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

              {/* Row 2: Difficulty Selector */}
              <div className="bg-[#181d2a] p-4 sm:p-5 rounded-xl steam-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#232a3b]">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Độ Khó Mục Tiêu Aim Lab</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      (Kích thước mục tiêu quét benchmark)
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

              {/* Start Button */}
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-10 py-3.5 bg-volt-500 hover:bg-volt-400 text-black font-black rounded-xl shadow-volt-glow transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider active:scale-95 cursor-pointer font-mono"
              >
                <Play className="w-4 h-4 fill-black" /> Bắt đầu quét hiệu năng (5 mốc)
              </button>
            </div>

            {/* Right Column (4 cols): Protocol Guide & Pro Tips */}
            <div className="lg:col-span-4 bg-[#141926] p-5 rounded-xl steam-border space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222a3d]">
                <Shield className="w-4 h-4 text-volt-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Quy Trình Quét Benchmark
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-volt-500/15 text-volt-400 font-bold flex items-center justify-center shrink-0 font-mono text-[11px] border border-volt-500/30">
                    1
                  </div>
                  <div>
                    <strong className="text-white block">5 Mốc Thử Trải Đều</strong>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Chia đều dải Sens từ cận dưới đến cận trên thành 5 bài bắn 12 giây liên tiếp.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-volt-500/15 text-volt-400 font-bold flex items-center justify-center shrink-0 font-mono text-[11px] border border-volt-500/30">
                    2
                  </div>
                  <div>
                    <strong className="text-white block">Đo Lường Độ Chuẩn Xác</strong>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Đo tốc độ phản xạ ms, tỷ lệ trúng mục tiêu và độ ổn định cơ tay ở từng mốc Sens.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-volt-500/15 text-volt-400 font-bold flex items-center justify-center shrink-0 font-mono text-[11px] border border-volt-500/30">
                    3
                  </div>
                  <div>
                    <strong className="text-white block">Dựng Đường Cong Parabol</strong>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Xác định đỉnh phong độ (Peak Sweet Spot) - mốc Sens bạn đạt điểm cao nhất.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div className="p-3.5 bg-[#0d1017] rounded-xl steam-border text-[11px] text-slate-300 leading-relaxed border-l-2 border-volt-500">
                <strong className="text-volt-400 block mb-1">Mẹo kiểm tra:</strong>
                Giữ cùng một tư thế tay xuyên suốt cả 5 mốc thử để kết quả so sánh độ nhạy có tính nhất quán cao nhất.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Running View */}
      {isRunning && testPoints.length > 0 && (
        <div className="space-y-4">
          <div className="steam-panel rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-volt-500/20 border border-volt-500 flex items-center justify-center font-mono font-extrabold text-volt-500 text-base">
                {currentStepIndex + 1}/{testPoints.length}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <span>MỐC {currentStepIndex + 1} TRÊN {testPoints.length}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-volt-400 font-mono uppercase font-bold">{drillMode === 'flicking' ? 'Flick Bắn Lướt' : 'Tracking Bám Tâm'}</span>
                </div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  Độ nhạy: <span className="text-volt-500 font-extrabold">{testPoints[currentStepIndex]}</span> • Quãng xoay: {calculateCm360(selectedGame, testPoints[currentStepIndex], dpi).toFixed(1)} cm
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#131722] p-1 rounded-xl steam-border text-xs">
                <span className="text-slate-400 text-xs px-2 font-medium">Độ khó:</span>
                {(['easy', 'medium', 'hard', 'pro'] as DrillDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      difficulty === d
                        ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={DIFFICULTY_CONFIGS[d].description}
                  >
                    {DIFFICULTY_CONFIGS[d].name}
                  </button>
                ))}
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
                className="text-xs text-slate-300 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-[#1a2030] transition-colors font-medium steam-border cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>

          <FpsRange3D
            game={selectedGame}
            sensitivity={testPoints[currentStepIndex]}
            mode={drillMode}
            difficulty={difficulty}
            isZoomed={isZoomed}
            onToggleZoom={() => setIsZoomed((z) => !z)}
            durationSeconds={12}
            crosshair={crosshair}
            targetColor={targetColor}
            isActive={true}
            onComplete={handleStepComplete}
          />
        </div>
      )}

      {/* Results Screen */}
      {!isRunning && points.length > 0 && bestSens && (
        <div className="steam-panel rounded-2xl p-6 shadow-hero-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232938] pb-4">
            <div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                Đỉnh Điểm Phong Độ: Sens <span className="text-volt-500 font-mono">{bestSens.sens}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Mức độ nhạy cho kết quả chuẩn xác và độ mượt cao nhất đã được áp dụng.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onSaveProfile && (
                <button
                  onClick={() => onSaveProfile(bestSens.sens, selectedGame)}
                  className="px-5 py-2.5 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-lg text-xs uppercase tracking-wider"
                >
                  Lưu Vào Kho Hồ Sơ
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-[#161b28] hover:bg-[#1e2538] text-slate-200 font-semibold rounded-lg text-xs steam-border"
              >
                Quét lại
              </button>
            </div>
          </div>

          {/* SVG Parabolic Performance Curve */}
          <div className="bg-[#10141e] steam-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2 text-white">
                <BarChart3 className="w-4 h-4 text-volt-500" />
                ĐƯỜNG CONG PHÂN PHỐI ĐIỂM SỐ
              </span>
              <span>Trục hoành: Sens • Trục tung: Điểm phong độ</span>
            </div>

            <div className="relative h-56 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                {[0, 45, 90, 135, 180].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="500"
                    y2={y}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                ))}

                {points.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#00e599"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points
                      .map((p, idx) => {
                        const x = (idx / (points.length - 1)) * 460 + 20;
                        const y = 170 - (p.score / 100) * 150;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}

                {points.map((p, idx) => {
                  const x = (idx / (points.length - 1)) * 460 + 20;
                  const y = 170 - (p.score / 100) * 150;
                  const isPeak = p.sens === bestSens.sens;

                  return (
                    <g key={idx}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isPeak ? 7 : 5}
                        fill={isPeak ? '#00e599' : '#ffffff'}
                        stroke="#0b0e14"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={195}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="monospace"
                      >
                        {p.sens}
                      </text>
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fill={isPeak ? '#00e599' : '#ffffff'}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {p.score}đ
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono">
            {points.map((p, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs ${
                  p.sens === bestSens.sens
                    ? 'bg-[#182329] border-volt-500 shadow-volt-glow'
                    : 'bg-[#161b28] steam-border'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white text-base">{p.sens}</span>
                  {p.sens === bestSens.sens && (
                    <span className="text-[10px] uppercase font-bold text-volt-500 bg-[#0e121a] px-1.5 py-0.5 rounded">
                      ĐỈNH
                    </span>
                  )}
                </div>
                <div className="text-slate-300 text-xs mb-2 font-medium">{p.cm360.toFixed(1)} cm</div>
                <div className="space-y-1.5 text-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span>Điểm:</span>
                    <span className="font-bold text-volt-500">{p.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chuẩn xác:</span>
                    <span className="text-white font-bold">{p.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Độ mượt:</span>
                    <span className="text-white font-bold">{p.smoothness}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
