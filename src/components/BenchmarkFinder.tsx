import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { BenchmarkPoint, CrosshairConfig, DrillResult, SupportedGame } from '../types';
import { GAME_CONFIGS, calculateCm360 } from '../lib/sensCalculator';
import { FpsRange3D } from './FpsRange3D';
import { calculateDrillScore } from '../lib/psaAlgorithm';
import { BarChart3, Play } from 'lucide-react';

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
        <div className="steam-panel rounded-2xl p-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Quét & Đánh Giá Đỉnh Phong Độ
          </h2>
          <p className="text-sm text-slate-200 mb-6 max-w-2xl leading-relaxed font-normal">
            Hệ thống đưa bạn qua 5 mốc độ nhạy từ thấp đến cao để đo tốc độ di chuột, độ giật cơ tay và phản xạ vi chỉnh. Biểu đồ đường cong phân phối điểm sẽ làm nổi bật mốc độ nhạy giúp bạn đạt phong độ cao nhất.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-w-2xl">
            <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-200">
                  Cận Dưới
                </label>
                <span className="text-xs font-bold text-volt-500">{gameConfig.name}</span>
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
                  Cận Trên
                </label>
                <span className="text-xs font-bold text-volt-500">{gameConfig.name}</span>
              </div>
              <input
                type="number"
                step="0.02"
                value={maxSens}
                onChange={(e) => setMaxSens(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-[#0e121a] border border-[#2a3449] rounded-lg px-3 py-2 text-white font-mono font-bold text-base focus:border-volt-500 focus:outline-none"
              />
            </div>

            <div className="bg-[#181d2a] p-4 rounded-xl steam-border flex flex-col justify-between">
              <label className="text-xs font-semibold text-slate-200 block mb-1">
                Số Lượng Mốc Thử
              </label>
              <div className="text-volt-500 font-mono font-extrabold text-lg">
                {numSteps} Mốc
              </div>
              <div className="text-xs text-slate-300 font-medium">
                12 giây mỗi mốc
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="px-8 py-3 bg-volt-500 hover:bg-volt-600 text-black font-extrabold rounded-xl shadow-volt-glow transition-all flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" /> Bắt đầu quét hiệu năng
          </button>
        </div>
      )}

      {/* Running View */}
      {isRunning && testPoints.length > 0 && (
        <div className="space-y-4">
          <div className="steam-panel rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-volt-500/20 border border-volt-500 flex items-center justify-center font-mono font-extrabold text-volt-500 text-base">
                {currentStepIndex + 1}/{testPoints.length}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300">ĐANG KIỂM TRA MỐC {currentStepIndex + 1}</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  Độ nhạy: <span className="text-volt-500 font-extrabold">{testPoints[currentStepIndex]}</span> • Quãng xoay: {calculateCm360(selectedGame, testPoints[currentStepIndex], dpi).toFixed(1)} cm
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-slate-300 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-[#1a2030] transition-colors font-medium steam-border"
            >
              Hủy bỏ
            </button>
          </div>

          <FpsRange3D
            game={selectedGame}
            sensitivity={testPoints[currentStepIndex]}
            mode="tracking"
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
