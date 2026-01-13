
import React from 'react';
import { Users, UserPlus, UserMinus, TrendingUp } from 'lucide-react';
import { FirmStats } from '../types';

interface FirmStatsCardsProps {
  stats: FirmStats;
}

const FirmStatsCards: React.FC<FirmStatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: '현재 인원',
      value: stats.current,
      icon: Users,
      trend: null
    },
    {
      label: '30일 입사',
      value: stats.joins,
      icon: UserPlus,
      trend: stats.joins > 0 ? '+' + stats.joins : '0'
    },
    {
      label: '30일 퇴사',
      value: stats.leaves,
      icon: UserMinus,
      trend: stats.leaves > 0 ? '-' + stats.leaves : '0'
    },
    {
      label: '순변동',
      value: stats.net > 0 ? '+' + stats.net : stats.net,
      icon: TrendingUp,
      trendType: stats.net > 0 ? 'positive' : stats.net < 0 ? 'negative' : 'neutral'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-slate-50 rounded-lg text-slate-900 group-hover:bg-slate-900 group-hover:text-amber-500 transition-colors duration-300 border border-slate-100">
              <card.icon size={20} strokeWidth={2.5} />
            </div>
            {card.trend && (
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded ${
                  card.trend.startsWith('+')
                    ? 'text-emerald-600 bg-emerald-50'
                    : card.trend.startsWith('-')
                    ? 'text-rose-600 bg-rose-50'
                    : 'text-slate-400 bg-slate-100'
                }`}
              >
                {card.trend}
              </span>
            )}
            {card.trendType && (
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded ${
                  card.trendType === 'positive'
                    ? 'text-emerald-600 bg-emerald-50'
                    : card.trendType === 'negative'
                    ? 'text-rose-600 bg-rose-50'
                    : 'text-slate-400 bg-slate-100'
                }`}
              >
                {card.value}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              {card.label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-950 tracking-tighter">
                {typeof card.value === 'number' || !card.trendType ? card.value : ''}
              </h3>
              {!card.trendType && (
                <span className="text-xs text-slate-400 font-medium">명</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FirmStatsCards;
