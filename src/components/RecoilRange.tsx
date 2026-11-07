import React, { useState } from 'react';
import { CrosshairConfig, DrillResult, SupportedGame, DrillDifficulty, DIFFICULTY_CONFIGS } from '../types';
import { FpsRange3D } from './FpsRange3D';
import { Target, Zap, Clock, Trophy, ZoomIn, ZoomOut, Flame } from 'lucide-react';

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [duration, setDuration] = useState<number>(30);
  const [lastResult, setLastResult] = useState<DrillResult | null>(null);

  const handleComplete = (result: DrillResult) => {
    setLastResult(result);
  };

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
              Bắn vỡ các mục tiêu phản quang ngẫu nhiên để rèn luyện trí nhớ cơ bắp và kiểm tra cảm giác vẩy chuột.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#131722] px-3.5 py-1.5 rounded-xl steam-border self-start md:self-auto font-mono text-xs">
            <span className="text-slate-400">Đang thử nghiệm:</span>
            <span className="font-bold text-volt-500">Sens {sensitivity}</span>
            <span className="text-slate-600">•</span>
            <span className="text-white">{dpi} DPI</span>
          </div>
        </div>

        {/* Spacious 2-Tier Toolbar */}
        <div className="space-y-3 mb-5">
          {/* Row 1: Mode, Difficulty, ADS Zoom */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-[#131722] p-1 rounded-xl steam-border">
              <button
                onClick={() => setDrillMode('flicking')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  drillMode === 'flicking'
                    ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Flick Bắn Lướt
              </button>
              <button
                onClick={() => setDrillMode('tracking')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  drillMode === 'tracking'
                    ? 'bg-volt-500 text-black shadow-volt-glow font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Tracking Bám Tâm
              </button>
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1.5 bg-[#131722] p-1 rounded-xl steam-border">
              <span className="text-xs text-slate-400 px-2 font-medium">Độ khó:</span>
              {(['easy', 'medium', 'hard', 'pro'] as DrillDifficulty[]).map((diffKey) => {
                const diff = DIFFICULTY_CONFIGS[diffKey];
                const isSelected = difficulty === diffKey;
                return (
                  <button
                    key={diffKey}
                    onClick={() => setDifficulty(diffKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

            {/* ADS Zoom Button */}
            <button
              type="button"
              onClick={() => setIsZoomed((z) => !z)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer steam-border ${
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

          {/* Row 2: Duration, Target Color, Quick Hint */}
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

            {/* Target Color palette */}
            <div className="flex items-center gap-2 bg-[#131722] px-3 py-1.5 rounded-xl steam-border">
              <span className="text-xs font-semibold text-slate-300 mr-1">Màu mục tiêu địch:</span>
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
          </div>
        </div>

        {/* 3D Aim Lab Range */}
        <FpsRange3D
          game={game}
          sensitivity={sensitivity}
          mode={drillMode}
          difficulty={difficulty}
          isZoomed={isZoomed}
          onToggleZoom={() => setIsZoomed((z) => !z)}
          durationSeconds={duration}
          crosshair={crosshair}
          targetColor={targetColor}
          isActive={true}
          onComplete={handleComplete}
        />

        {/* Last Run Stats Summary (Aim Lab style) */}
        {lastResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#181d2a] steam-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-volt-500/20 text-volt-500 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-300 font-medium">Kết quả bài bắn vừa hoàn thành</div>
                <div className="text-lg font-extrabold text-white">
                  {lastResult.targetsHit} mục tiêu trúng • {lastResult.accuracy}% chuẩn xác
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-[#0e121a] px-3 py-1.5 rounded-lg steam-border">
                <span className="text-slate-400">Phản xạ:</span> <strong className="text-volt-500">{lastResult.avgReactionTimeMs}ms</strong>
              </div>
              <div className="bg-[#0e121a] px-3 py-1.5 rounded-lg steam-border">
                <span className="text-slate-400">Độ mượt:</span> <strong className="text-white">{lastResult.smoothness}%</strong>
              </div>
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
                Khi mục tiêu xuất hiện, hãy vẩy chuột dứt khoát trong 1 nhịp. Nếu liên tục phải nhích chuột lần 2 thì Sens có thể đang hơi thấp.
              </p>
            </div>
          </div>

          <div className="bg-[#181d2a] steam-border p-4 rounded-xl flex items-start gap-3">
            <Target className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm">Kiểm soát lố tâm</div>
              <p className="text-slate-200 text-xs mt-1 leading-relaxed">
                Nếu tâm chuột thường xuyên vẩy bay vọt qua mục tiêu rồi mới kéo giật ngược lại, Sens hiện tại có thể đang hơi cao so với cổ tay.
              </p>
            </div>
          </div>

          <div className="bg-[#181d2a] steam-border p-4 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm">Cơ chế đọc tín hiệu thô</div>
              <p className="text-slate-200 text-xs mt-1 leading-relaxed">
                Sử dụng Pointer Lock API để đọc chuyển động chuột trực tiếp 1:1, không bị ảnh hưởng bởi gia tốc chuột của hệ điều hành Windows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
