import React from 'react';
import { CrosshairConfig } from '../types';

interface Props {
  config: CrosshairConfig;
  onChange: (config: CrosshairConfig) => void;
}

export const PRESET_COLORS = [
  '#00e599', // Volt Green
  '#00f0ff', // Cyber Cyan
  '#eab308', // Classic Yellow
  '#ff3355', // Red
  '#ffffff', // Clean White
  '#ec4899', // Magenta
];

export const CrosshairCustomizer: React.FC<Props> = ({ config, onChange }) => {
  return (
    <div className="steam-panel rounded-2xl p-5 shadow-hero-card">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-volt-500 animate-pulse"></span>
          TÙY CHỈNH TÂM NGẮM
        </h4>
        <div className="text-[11px] font-mono text-slate-400">Xem trước trực tiếp</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Preview box */}
        <div className="relative h-32 bg-obsidian-950 steam-border rounded-xl flex items-center justify-center overflow-hidden">
          <div className="w-12 h-12 rounded-full border border-rose-500/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-rose-500/20" />
          </div>

          {/* Render Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {config.dot && (
              <div
                style={{
                  width: `${config.thickness + 1}px`,
                  height: `${config.thickness + 1}px`,
                  backgroundColor: config.color,
                  boxShadow: config.outline ? '0 0 1px 1px #000' : 'none'
                }}
                className="absolute rounded-full"
              />
            )}
            {/* Top */}
            <div
              style={{
                width: `${config.thickness}px`,
                height: `${config.size}px`,
                backgroundColor: config.color,
                bottom: `calc(50% + ${config.gap}px)`,
                boxShadow: config.outline ? '0 0 1px 1px #000' : 'none'
              }}
              className="absolute"
            />
            {/* Bottom */}
            <div
              style={{
                width: `${config.thickness}px`,
                height: `${config.size}px`,
                backgroundColor: config.color,
                top: `calc(50% + ${config.gap}px)`,
                boxShadow: config.outline ? '0 0 1px 1px #000' : 'none'
              }}
              className="absolute"
            />
            {/* Left */}
            <div
              style={{
                height: `${config.thickness}px`,
                width: `${config.size}px`,
                backgroundColor: config.color,
                right: `calc(50% + ${config.gap}px)`,
                boxShadow: config.outline ? '0 0 1px 1px #000' : 'none'
              }}
              className="absolute"
            />
            {/* Right */}
            <div
              style={{
                height: `${config.thickness}px`,
                width: `${config.size}px`,
                backgroundColor: config.color,
                left: `calc(50% + ${config.gap}px)`,
                boxShadow: config.outline ? '0 0 1px 1px #000' : 'none'
              }}
              className="absolute"
            />
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1.5 uppercase">Bảng màu</div>
            <div className="flex gap-2">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col}
                  onClick={() => onChange({ ...config, color: col })}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    config.color === col ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
            <div>
              <label className="text-slate-400 block mb-1 text-[10px]">Độ dài: {config.size}</label>
              <input
                type="range"
                min="2"
                max="16"
                value={config.size}
                onChange={(e) => onChange({ ...config, size: Number(e.target.value) })}
                className="w-full accent-volt-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px]">Độ dày: {config.thickness}</label>
              <input
                type="range"
                min="1"
                max="6"
                value={config.thickness}
                onChange={(e) => onChange({ ...config, thickness: Number(e.target.value) })}
                className="w-full accent-volt-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px]">Khoảng cách: {config.gap}</label>
              <input
                type="range"
                min="0"
                max="14"
                value={config.gap}
                onChange={(e) => onChange({ ...config, gap: Number(e.target.value) })}
                className="w-full accent-volt-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={config.dot}
                onChange={(e) => onChange({ ...config, dot: e.target.checked })}
                className="accent-volt-500 rounded"
              />
              <span>Chấm giữa</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={config.outline}
                onChange={(e) => onChange({ ...config, outline: e.target.checked })}
                className="accent-volt-500 rounded"
              />
              <span>Viền ngoài</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
