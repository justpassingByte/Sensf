import React from 'react';
import { MouseProfile } from '../types';
import { GAME_CONFIGS } from '../lib/sensCalculator';
import { Trash2, Copy, Check, Shield } from 'lucide-react';

interface Props {
  profiles: MouseProfile[];
  onDeleteProfile: (id: string) => void;
  onApplyProfile: (profile: MouseProfile) => void;
}

export const ProfileManager: React.FC<Props> = ({
  profiles,
  onDeleteProfile,
  onApplyProfile
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (profile: MouseProfile) => {
    const text = `FPS Sens Profile: ${profile.name}\nGame: ${GAME_CONFIGS[profile.game].name}\nDPI: ${profile.dpi}\nSens: ${profile.sensitivity}\neDPI: ${profile.edpi}\ncm/360: ${profile.cm360.toFixed(1)} cm`;
    navigator.clipboard.writeText(text);
    setCopiedId(profile.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="steam-panel rounded-2xl p-6 shadow-hero-card space-y-6">
      <div className="flex items-center justify-between border-b border-[#232938] pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Kho Cấu Hình Chuột Cá Nhân
          </h2>
          <p className="text-sm text-slate-200 mt-1">
            Lưu trữ và chuyển đổi nhanh giữa các cấu hình độ nhạy của bạn.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-300">
          Tổng cộng: <span className="text-volt-500 font-bold">{profiles.length}</span> hồ sơ
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="py-12 text-center bg-[#181d2a] steam-border rounded-xl">
          <Shield className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-white font-semibold">Chưa có hồ sơ nào được lưu</p>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto font-normal">
            Sau khi dò Sens PSA hoặc Benchmark, bấm nút &quot;Lưu vào Hồ Sơ&quot; để lưu lại độ nhạy của bạn tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="bg-[#181d2a] steam-border rounded-xl p-4 hover:border-slate-500 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-white group-hover:text-volt-500 transition-colors">
                    {p.name}
                  </h4>
                  <span className="text-xs text-slate-300 bg-[#0e121a] px-2 py-0.5 rounded font-mono steam-border">
                    {p.date}
                  </span>
                </div>

                <div className="text-xs font-semibold text-volt-500 mb-3">
                  {GAME_CONFIGS[p.game].name}
                </div>

                <div className="space-y-2 text-xs text-slate-200 bg-[#0e121a] p-3.5 rounded-lg steam-border mb-4 font-mono font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Sens:</span>
                    <span className="font-bold text-volt-500 text-base">{p.sensitivity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">DPI:</span>
                    <span className="text-white font-bold">{p.dpi} DPI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">eDPI:</span>
                    <span className="text-white font-bold">{p.edpi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Quãng xoay 360°:</span>
                    <span className="text-white font-bold">{p.cm360.toFixed(1)} cm</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#232938]">
                <button
                  onClick={() => onApplyProfile(p)}
                  className="flex-1 py-2 bg-volt-500 hover:bg-volt-600 text-black font-extrabold text-xs rounded-lg transition-colors uppercase tracking-wider"
                >
                  Áp dụng Sens này
                </button>
                <button
                  onClick={() => handleCopy(p)}
                  className="p-2 rounded bg-[#0e121a] hover:bg-[#202738] text-slate-300 hover:text-white transition-colors steam-border"
                  title="Sao chép thông số"
                >
                  {copiedId === p.id ? <Check className="w-4 h-4 text-volt-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onDeleteProfile(p.id)}
                  className="p-2 rounded bg-[#0e121a] hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors steam-border"
                  title="Xóa hồ sơ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
