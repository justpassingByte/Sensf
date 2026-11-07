import React, { useState, useEffect } from 'react';
import { SupportedGame } from '../types';
import { GAME_CONFIGS, calculateCm360, calculateSensFromCm360, convertSens, getSpeedCategory } from '../lib/sensCalculator';
import { Copy, Check, Users } from 'lucide-react';

interface Props {
  initialGame?: SupportedGame;
  initialSens?: number;
  dpi: number;
  onApplySens?: (sens: number, game: SupportedGame) => void;
}

export const SensConverter: React.FC<Props> = ({
  initialGame = 'valorant',
  initialSens = 0.35,
  dpi,
  onApplySens
}) => {
  const [sourceGame, setSourceGame] = useState<SupportedGame>(initialGame);
  const [sensInput, setSensInput] = useState<number>(initialSens);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setSensInput(initialSens);
  }, [initialSens]);

  useEffect(() => {
    setSourceGame(initialGame);
  }, [initialGame]);

  const cm360 = calculateCm360(sourceGame, sensInput, dpi);
  const speedCat = getSpeedCategory(cm360);
  const sourceConfig = GAME_CONFIGS[sourceGame];

  const handleCopy = (val: number, key: string) => {
    navigator.clipboard.writeText(val.toString());
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleCmChange = (newCm: number) => {
    const updated = calculateSensFromCm360(sourceGame, newCm, dpi);
    setSensInput(updated);
    if (onApplySens) {
      onApplySens(updated, sourceGame);
    }
  };

  const handleApplyConverted = (targetGame: SupportedGame, convertedSens: number) => {
    if (onApplySens) {
      onApplySens(convertedSens, targetGame);
    }
  };

  const gamesList: SupportedGame[] = [
    'cs2',
    'valorant',
    'deltaforce',
    'apex',
    'overwatch2',
    'rainbow6',
    'cod',
    'pubg',
    'fortnite'
  ];

  return (
    <div className="space-y-6">
      {/* Top Controller Panel */}
      <div className="steam-panel rounded-2xl p-6 shadow-hero-card">
        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
          Quy Đổi Độ Nhạy Chuột Đa Game
        </h2>
        <p className="text-sm text-slate-200 mb-6">
          Chuyển đổi góc xoay chuột chính xác giữa các game FPS mà không làm thay đổi cự ly di tay.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Source Game */}
          <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              Tựa Game Hiện Tại
            </label>
            <select
              value={sourceGame}
              onChange={(e) => setSourceGame(e.target.value as SupportedGame)}
              className="w-full bg-[#0e121a] border border-[#2a3449] rounded-lg px-3 py-2 text-white font-bold text-sm focus:border-volt-500 focus:outline-none cursor-pointer"
            >
              {gamesList.map((g) => (
                <option key={g} value={g} className="bg-[#181d2a] text-white">
                  {GAME_CONFIGS[g].name}
                </option>
              ))}
            </select>
          </div>

          {/* Sens Input */}
          <div className="bg-[#181d2a] p-4 rounded-xl steam-border">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-200">
                Độ Nhạy Trong Game
              </label>
              <span className="text-xs text-volt-500 font-bold font-mono">Đang áp dụng</span>
            </div>
            <input
              type="number"
              step="0.01"
              value={sensInput}
              onChange={(e) => {
                const val = Math.max(0.001, parseFloat(e.target.value) || 0.01);
                setSensInput(val);
                if (onApplySens) onApplySens(val, sourceGame);
              }}
              className="w-full bg-[#0e121a] border border-[#2a3449] rounded-lg px-3 py-2 text-volt-500 font-mono font-black text-xl focus:border-volt-500 focus:outline-none"
            />
          </div>

          {/* DPI & eDPI */}
          <div className="bg-[#181d2a] p-4 rounded-xl steam-border flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-200">Cảm Biến Chuột</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-white font-bold text-base font-mono">{dpi} DPI</span>
              <span className="text-volt-500 font-black text-xl font-mono">
                {(sensInput * dpi).toFixed(0)} <span className="text-xs text-slate-300 font-normal">eDPI</span>
              </span>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Công thức: Sens nhân DPI
            </div>
          </div>
        </div>

        {/* Visual cm/360 Metric Bar */}
        <div className="bg-[#181d2a] steam-border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-300">Quãng đường chuột để xoay trọn 360°:</span>
              <div className="text-2xl font-black font-mono text-white mt-0.5 flex items-baseline gap-2">
                <span>{cm360.toFixed(2)} cm</span>
                <span className="text-xs text-slate-300 font-normal font-mono">hoặc {(cm360 / 2.54).toFixed(1)} inches</span>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="inline-block text-xs font-mono font-bold px-3 py-1 rounded bg-[#0e121a] steam-border text-volt-500">
                {speedCat.label}
              </span>
              <p className="text-xs text-slate-200 mt-1 max-w-sm font-normal">{speedCat.desc}</p>
            </div>
          </div>

          {/* Interactive slider */}
          <div className="space-y-1.5 pt-2 font-mono">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>15 cm • Rất nhanh</span>
              <span>35 cm • Vừa phải</span>
              <span>55 cm • Chậm ổn định</span>
              <span>85 cm • Quét rộng</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="0.5"
              value={Math.min(90, Math.max(15, cm360))}
              onChange={(e) => handleCmChange(Number(e.target.value))}
              className="w-full accent-volt-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Cross-Game Table */}
      <div className="steam-panel rounded-2xl p-6 shadow-hero-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Thông Số Tương Đương Ở Các Game Khác
          </h3>
          <span className="text-xs font-mono text-volt-500 font-extrabold">
            Cùng mức {cm360.toFixed(1)} cm
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gamesList.map((targetGame) => {
            const isSelf = targetGame === sourceGame;
            const converted = isSelf
              ? sensInput
              : convertSens(sourceGame, sensInput, dpi, targetGame, dpi);
            const targetConfig = GAME_CONFIGS[targetGame];

            return (
              <div
                key={targetGame}
                className={`p-4 rounded-xl border transition-all ${
                  isSelf
                    ? 'bg-[#182329] border-volt-500 shadow-volt-glow'
                    : 'bg-[#181d2a] steam-border hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-white">
                    {targetConfig.name}
                  </div>
                  {isSelf && (
                    <span className="text-xs font-mono font-bold text-volt-500 bg-[#0e121a] px-2 py-0.5 rounded">
                      Đang chọn
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-2xl font-black font-mono text-volt-500">
                    {converted}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!isSelf && onApplySens && (
                      <button
                        onClick={() => handleApplyConverted(targetGame, converted)}
                        className="px-2.5 py-1 text-xs font-bold bg-[#10141e] hover:bg-[#202738] text-slate-200 hover:text-white rounded steam-border"
                        title="Chuyển sang game này"
                      >
                        Áp dụng
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(converted, targetGame)}
                      className="p-1.5 rounded bg-[#10141e] hover:bg-[#202738] text-slate-300 hover:text-white transition-colors"
                      title="Sao chép sens"
                    >
                      {copiedKey === targetGame ? (
                        <Check className="w-4 h-4 text-volt-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-300 flex justify-between font-medium">
                  <span>eDPI {(converted * dpi).toFixed(0)}</span>
                  <span>Góc {targetConfig.yaw}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pro Players Comparison */}
      <div className="steam-panel rounded-2xl p-6 shadow-hero-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-volt-500" />
            Độ Nhạy Tuyển Thủ Chuyên Nghiệp
          </h3>
          <span className="text-xs font-bold text-volt-500">{sourceConfig.name}</span>
        </div>
        <p className="text-sm text-slate-200 mb-5">
          Thông số thi đấu thực tế tại các giải vô địch thế giới để bạn dễ dàng so sánh cảm giác tay.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {sourceConfig.samplePros.map((pro) => (
            <div
              key={pro.name}
              className="bg-[#181d2a] steam-border rounded-xl p-3.5 flex items-center justify-between hover:border-slate-500 transition-colors"
            >
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{pro.name}</span>
                  <span className="text-xs text-volt-500 font-mono px-1.5 py-0.5 rounded bg-[#0e121a] steam-border">{pro.team}</span>
                </div>
                <div className="text-xs text-slate-300 mt-1 font-mono font-medium">
                  {pro.dpi} DPI • Sens: <span className="text-white font-bold">{pro.sens}</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-bold text-volt-500">
                  {pro.edpi} eDPI
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {calculateCm360(sourceGame, pro.sens, pro.dpi).toFixed(1)} cm
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
