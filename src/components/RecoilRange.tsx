import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CrosshairConfig, DrillResult, SupportedGame, DrillDifficulty, DrillAngle, DrillHistoryItem, DIFFICULTY_CONFIGS } from '../types';
import { FpsRange3D } from './FpsRange3D';
import { SensDatabase } from '../lib/db';
import { Target, Zap, Clock, Trophy, ZoomIn, ZoomOut, Flame, Compass, TrendingUp, History, Trash2, Award } from 'lucide-react';

interface Props {
  game: SupportedGame;
  sensitivity: number;
  dpi: number;
  crosshair: CrosshairConfig;
  targetColor?: string;
  onTargetColorChange?: (color: string) => void;
}

export const RecoilRange: React.FC<Props> = ({
  game,
  sensitivity,
  dpi,
  crosshair,
  targetColor = '#ffea00',
  onTargetColorChange
}) => {
  const [drillMode, setDrillMode] = useState<'flicking' | 'tracking'>('flicking');
  const [difficulty, setDifficulty] = useState<DrillDifficulty>('medium');
  const [drillAngle, setDrillAngle] = useState<DrillAngle>('90');
  const [isZoomed, setIsZoomed] = useState(false);
  const [duration, setDuration] = useState<number>(30);
  const [lastResult, setLastResult] = useState<DrillResult | null>(null);
  const [history, setHistory] = useState<DrillHistoryItem[]>(() => SensDatabase.getDrillHistory());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const currentHighScore = Math.max(0, ...history.filter(h => h.mode === drillMode).map(h => h.score || 0));

  const handleComplete = (result: DrillResult) => {
    setLastResult(result);

    const historyItem: DrillHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      game,
      sens: sensitivity,
      dpi,
      mode: drillMode,
      difficulty,
      angle: drillAngle,
      score: result.score,
      targetsHit: result.targetsHit,
      totalShots: result.totalShots,
      accuracy: result.accuracy,
      avgReactionTimeMs: result.avgReactionTimeMs,
      smoothness: result.smoothness,
      reactionGrade: result.reactionGrade || 'Chuẩn Xác'
    };

    const nextHistory = SensDatabase.saveDrillResult(historyItem);
    setHistory(nextHistory);

    if (result.score > currentHighScore && currentHighScore > 0) {
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    }
  };

  const handleClearHistory = () => {
    SensDatabase.clearDrillHistory();
    setHistory([]);
    setLastResult(null);
  };

  // Recent 10 runs for trend preview
  const recentRuns = history.slice(0, 10);
  const maxScoreInChart = Math.max(1000, ...recentRuns.map(r => r.score));

  return (
    <div className="space-y-6">
      <div className="steam-panel rounded-2xl p-6 shadow-hero-card">
        {/* Header Controls: Clean 2-Tier Layout */}
        <div className="border-b border-[#232938] pb-5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Phòng Luyện Phản Xạ Aim Lab</span>
              <span className="px-2.5 py-0.5 rounded-full bg-volt-500/15 text-volt-400 font-mono text-xs font-bold border border-volt-500/30">
                Aim Lab Studio 3D
              </span>
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Bắn vỡ các mục tiêu phản quang để đo lường cự ly vẩy chuột, tốc độ phản xạ và so sánh độ cải thiện điểm số.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentHighScore > 0 && (
              <div className="flex items-center gap-2 bg-[#181f2f] px-3.5 py-1.5 rounded-xl border border-volt-500/40 text-xs font-mono">
                <Trophy className="w-4 h-4 text-volt-500" />
                <span className="text-slate-300">Kỷ lục cá nhân:</span>
                <span className="font-extrabold text-volt-400 text-sm">{currentHighScore.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-[#131722] px-3.5 py-1.5 rounded-xl steam-border font-mono text-xs">
              <span className="text-slate-400">Đang thử nghiệm:</span>
              <span className="font-bold text-volt-500">Sens {sensitivity}</span>
              <span className="text-slate-600">•</span>
              <span className="text-white">{dpi} DPI</span>
            </div>
          </div>
        </div>

        {/* Spacious 2-Tier Toolbar */}
        <div className="space-y-3 mb-5">
          {/* Row 1: Mode, Difficulty, Spawn Angle, ADS Zoom */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-[#131722] p-1 rounded-xl steam-border">
              <button
                onClick={() => setDrillMode('flicking')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  drillMode === 'flicking'
                    ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Flick Bắn Lướt
              </button>
              <button
                onClick={() => setDrillMode('tracking')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  drillMode === 'tracking'
                    ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Tracking Bám Tâm
              </button>
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1 bg-[#131722] p-1 rounded-xl steam-border">
              <span className="text-xs text-slate-400 px-2 font-medium">Độ khó:</span>
              {(['easy', 'medium', 'hard', 'pro'] as DrillDifficulty[]).map((diffKey) => {
                const diff = DIFFICULTY_CONFIGS[diffKey];
                const isSelected = difficulty === diffKey;
                return (
                  <button
                    key={diffKey}
                    onClick={() => setDifficulty(diffKey)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#222a3d] text-volt-500 font-extrabold border border-volt-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={diff.description}
                  >
                    {diff.name}
                  </button>
                );
              })}
            </div>

            {/* Spawn Angle Selector (Góc thực chiến) */}
            <div className="flex items-center gap-1 bg-[#131722] p-1 rounded-xl steam-border">
              <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" /> Góc xuất hiện:
              </span>
              {[
                { id: '90' as DrillAngle, label: '90° Trước mặt' },
                { id: '180' as DrillAngle, label: '180° Bán nguyệt' },
                { id: '360' as DrillAngle, label: '360° Toàn cảnh' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setDrillAngle(id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drillAngle === id
                      ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ADS Zoom Button */}
            <button
              type="button"
              onClick={() => setIsZoomed((z) => !z)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer steam-border ${
                isZoomed
                  ? 'bg-volt-500 text-black shadow-volt-glow font-black'
                  : 'bg-[#131722] text-slate-200 hover:text-white hover:bg-[#1b2130]'
              }`}
              title="Chuột phải hoặc bấm vào đây để phóng to mục tiêu"
            >
              {isZoomed ? (
                <>
                  <ZoomOut className="w-4 h-4" />
                  <span>Thu Nhỏ Ngắm (74°)</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-4 h-4 text-volt-500" />
                  <span>Phóng To Ngắm (ADS)</span>
                </>
              )}
            </button>
          </div>

          {/* Row 2: Duration, Target Color, History Modal Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#1a2130]">
            {/* Duration Selector */}
            <div className="flex items-center gap-1 bg-[#131722] p-1 rounded-xl steam-border text-xs font-mono">
              <span className="text-slate-400 text-xs px-2 font-sans font-medium">Thời gian bài tập:</span>
              {[30, 45, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setDuration(sec)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    duration === sec
                      ? 'bg-[#222a3d] text-volt-500 font-extrabold border border-volt-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Target Color palette & History button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#131722] px-3 py-1.5 rounded-xl steam-border">
                <span className="text-xs font-semibold text-slate-300 mr-1">Màu địch:</span>
                {[
                  { hex: '#ffea00', label: 'Vàng' },
                  { hex: '#ff3355', label: 'Đỏ' },
                  { hex: '#00e599', label: 'Volt' },
                  { hex: '#00e5ff', label: 'Cyan' },
                  { hex: '#d946ef', label: 'Tím' },
                  { hex: '#ffffff', label: 'Trắng' }
                ].map(({ hex, label }) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => onTargetColorChange && onTargetColorChange(hex)}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      targetColor?.toLowerCase() === hex.toLowerCase()
                        ? 'scale-125 border-white ring-2 ring-white/50 shadow-volt-glow'
                        : 'border-black/50 opacity-60 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={label}
                  />
                ))}
              </div>

              {history.length > 0 && (
                <button
                  onClick={() => setShowHistoryModal(prev => !prev)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#131722] hover:bg-[#1a2030] steam-border text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-volt-500" />
                  <span>Lịch sử ({history.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3D Aim Lab Range */}
        <FpsRange3D
          game={game}
          sensitivity={sensitivity}
          mode={drillMode}
          difficulty={difficulty}
          angle={drillAngle}
          isZoomed={isZoomed}
          onToggleZoom={() => setIsZoomed((z) => !z)}
          durationSeconds={duration}
          crosshair={crosshair}
          targetColor={targetColor}
          isActive={true}
          onComplete={handleComplete}
        />

        {/* Last Run Stats Summary & Score Comparison */}
        {lastResult && (
          <div className="mt-5 p-5 rounded-2xl bg-[#141926] steam-border space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222a3d] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-volt-500/15 border border-volt-500/40 text-volt-500 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Kết quả bài bắn vừa xong</span>
                    {lastResult.score >= currentHighScore && currentHighScore > 0 && (
                      <span className="px-2 py-0.5 rounded bg-volt-500 text-black font-extrabold text-[11px] uppercase tracking-wider animate-pulse">
                        🏆 Kỷ Lục Mới!
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white font-mono flex items-baseline gap-3 mt-0.5">
                    <span>{lastResult.score.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-normal">điểm</span></span>
                    {currentHighScore > 0 && (
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        lastResult.score >= currentHighScore
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/70 text-rose-400 border border-rose-800'
                      }`}>
                        {lastResult.score >= currentHighScore
                          ? `+${(lastResult.score - currentHighScore).toLocaleString()} so với kỷ lục cũ`
                          : `${(lastResult.score - currentHighScore).toLocaleString()} so với kỷ lục`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reaction Grade Badge */}
              <div className="flex items-center gap-3 bg-[#0d1017] px-4 py-2.5 rounded-xl steam-border self-start md:self-auto">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-medium">Đánh giá phản xạ:</div>
                  <div className="text-xs font-black uppercase tracking-wider font-mono text-volt-400">
                    {lastResult.reactionGrade}
                  </div>
                </div>
                <div className="h-7 w-px bg-slate-800" />
                <div className="text-left font-mono">
                  <div className="text-[11px] text-slate-400">Thời gian:</div>
                  <div className="text-base font-extrabold text-white">
                    {lastResult.avgReactionTimeMs} <span className="text-xs text-slate-400 font-sans">ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#0e121a] p-3 rounded-xl steam-border">
                <span className="text-slate-400 block mb-1">Mục tiêu trúng:</span>
                <span className="text-base font-extrabold text-white">{lastResult.targetsHit}</span>
                <span className="text-slate-500 text-xs"> / {lastResult.totalShots} viên</span>
              </div>
              <div className="bg-[#0e121a] p-3 rounded-xl steam-border">
                <span className="text-slate-400 block mb-1">Độ chính xác:</span>
                <span className="text-base font-extrabold text-volt-500">{lastResult.accuracy}%</span>
              </div>
              <div className="bg-[#0e121a] p-3 rounded-xl steam-border">
                <span className="text-slate-400 block mb-1">Tốc độ phản xạ:</span>
                <span className="text-base font-extrabold text-cyan-400">{lastResult.avgReactionTimeMs}ms</span>
              </div>
              <div className="bg-[#0e121a] p-3 rounded-xl steam-border">
                <span className="text-slate-400 block mb-1">Độ mượt vẩy chuột:</span>
                <span className="text-base font-extrabold text-emerald-400">{lastResult.smoothness}%</span>
              </div>
            </div>

            {/* Reaction time guide explanation */}
            <div className="p-3 bg-[#0d1017] rounded-xl steam-border text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-volt-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Ý nghĩa chỉ số phản xạ (Reaction Time):</strong> Số miligiây (ms) là thời gian từ khi mục tiêu xuất hiện tới khi bạn vẩy chuột bắn trúng. 
                <span className="text-volt-400 font-semibold"> Số ms càng NHỎ thì bắn càng NHANH!</span> Tuyển thủ Esports chuyên nghiệp thường đạt cự ly dưới 220ms, mức 250-300ms là tiêu chuẩn người chơi phổ thông.
              </div>
            </div>
          </div>
        )}

        {/* History Modal / Expandable Panel */}
        {showHistoryModal && history.length > 0 && (
          <div className="mt-5 p-5 rounded-2xl bg-[#141926] steam-border space-y-4">
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-volt-500" />
                <h3 className="text-lg font-extrabold text-white">Lịch Sử & Tiến Trình Nâng Cao Điểm Số</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-[#1e2538] cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Performance Trend Mini Bars */}
            <div>
              <div className="text-xs text-slate-400 mb-2 font-medium">Xu hướng điểm 10 bài bắn gần nhất:</div>
              <div className="h-28 bg-[#0d1017] p-3 rounded-xl steam-border flex items-end gap-2">
                {recentRuns.slice().reverse().map((run, idx) => {
                  const heightPercent = Math.max(10, Math.round((run.score / maxScoreInChart) * 100));
                  const isTop = run.score === currentHighScore;
                  return (
                    <div key={run.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 whitespace-nowrap bg-black/90 px-1.5 py-0.5 rounded z-10">
                        {run.score}đ • {run.avgReactionTimeMs}ms
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          isTop
                            ? 'bg-volt-500 shadow-volt-glow'
                            : 'bg-[#253248] hover:bg-[#384a6b]'
                        }`}
                      />
                      <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222a3d] text-slate-400">
                    <th className="py-2 px-2 font-medium">Thời gian</th>
                    <th className="py-2 px-2 font-medium">Chế độ</th>
                    <th className="py-2 px-2 font-medium">Độ khó</th>
                    <th className="py-2 px-2 font-medium">Góc bắn</th>
                    <th className="py-2 px-2 font-medium">Sens</th>
                    <th className="py-2 px-2 font-medium">Chính xác</th>
                    <th className="py-2 px-2 font-medium">Phản xạ</th>
                    <th className="py-2 px-2 font-medium text-right">Điểm số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2638]">
                  {history.slice(0, 8).map((item) => (
                    <tr key={item.id} className="hover:bg-[#181f2e] transition-colors">
                      <td className="py-2.5 px-2 text-slate-400">{item.date}</td>
                      <td className="py-2.5 px-2 text-white font-bold capitalize">{item.mode}</td>
                      <td className="py-2.5 px-2 text-volt-400">{DIFFICULTY_CONFIGS[item.difficulty]?.name || item.difficulty}</td>
                      <td className="py-2.5 px-2 text-cyan-400">{item.angle}°</td>
                      <td className="py-2.5 px-2 text-white">{item.sens}</td>
                      <td className="py-2.5 px-2 text-volt-500 font-bold">{item.accuracy}%</td>
                      <td className="py-2.5 px-2 text-slate-200">{item.avgReactionTimeMs}ms</td>
                      <td className="py-2.5 px-2 text-right font-bold text-white text-sm">
                        {item.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#181d2a] steam-border p-4 rounded-xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-volt-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm">Phản xạ nhắm mục tiêu</div>
              <p className="text-slate-200 text-xs mt-1 leading-relaxed">
                Khi mục tiêu xuất hiện, hãy vẩy chuột dứt khoát trong 1 nhịp. Thời gian phản xạ dưới 220ms thể hiện cơ tay đã đạt chuẩn phản xạ của tuyển thủ chuyên nghiệp.
              </p>
            </div>
          </div>

          <div className="bg-[#181d2a] steam-border p-4 rounded-xl flex items-start gap-3">
            <Compass className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm">Mô phỏng góc thực chiến</div>
              <p className="text-slate-200 text-xs mt-1 leading-relaxed">
                Chuyển sang góc 180° hoặc 360° để luyện quay đầu và kiểm tra góc sau lưng, giúp bạn làm quen với các tình huống giao tranh đa hướng trong game.
              </p>
            </div>
          </div>

          <div className="bg-[#181d2a] steam-border p-4 rounded-xl flex items-start gap-3">
            <Trophy className="w-5 h-5 text-volt-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm">Theo dõi sự cải thiện</div>
              <p className="text-slate-200 text-xs mt-1 leading-relaxed">
                Hệ thống tự động ghi nhớ điểm số kỷ lục cá nhân. Sau mỗi bài bắn, bạn sẽ thấy ngay mình đã tiến bộ hay tụt lùi bao nhiêu điểm so với kỷ lục.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
