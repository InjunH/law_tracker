
import React from 'react';
import { LawFirm, FirmStats } from '../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FirmCardProps {
  firm: LawFirm;
  stats: FirmStats;
  selected: boolean;
  onClick: () => void;
}

const FirmCard: React.FC<FirmCardProps> = ({ firm, stats, selected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-6 border-2 transition-all cursor-pointer ${
        selected
          ? 'border-slate-950 shadow-lg'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* 색상 바 */}
      <div
        className="w-full h-2 rounded-full mb-4"
        style={{ backgroundColor: firm.color }}
      />

      {/* 로펌명 + Tier */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-900">{firm.name}</h3>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {firm.tier}
        </span>
      </div>

      {/* 변호사 수 */}
      <div className="mb-3">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
          Current Attorneys
        </p>
        <p className="text-3xl font-bold text-slate-900">{stats.current}</p>
      </div>

      {/* 순변동 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">30-Day Net</span>
        {stats.net > 0 && (
          <span className="text-emerald-600 font-black text-sm flex items-center gap-1">
            <ArrowUpRight size={14} /> +{stats.net}
          </span>
        )}
        {stats.net < 0 && (
          <span className="text-rose-600 font-black text-sm flex items-center gap-1">
            <ArrowDownRight size={14} /> {stats.net}
          </span>
        )}
        {stats.net === 0 && (
          <span className="text-slate-400 font-black text-sm">0</span>
        )}
      </div>
    </div>
  );
};

export default FirmCard;
