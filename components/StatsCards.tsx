
import React from 'react';
import { UserPlus, UserMinus, ArrowRightLeft, Activity } from 'lucide-react';
import { DailyStats } from '../types';

interface StatsCardsProps {
  stats: DailyStats[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const latest = stats[stats.length - 1] || { joiners: 0, leavers: 0, transfers: 0 };
  const previous = stats[stats.length - 2] || { joiners: 0, leavers: 0, transfers: 0 };

  // 이전 기간 대비 증감 계산
  const joinersTrend = latest.joiners - previous.joiners;
  const leaversTrend = latest.leavers - previous.leavers;
  const transfersTrend = latest.transfers - previous.transfers;

  // 시장 활성도: 전체 이동 건수 대비 최근 7일 이동 비율
  const recentWeekStats = stats.slice(-7);
  const recentTotal = recentWeekStats.reduce((sum, s) => sum + s.joiners + s.leavers + s.transfers, 0);
  const overallTotal = stats.reduce((sum, s) => sum + s.joiners + s.leavers + s.transfers, 0);
  const marketActivity = overallTotal > 0 ? ((recentTotal / overallTotal) * 100).toFixed(1) : '0.0';

  const cards = [
    { label: '신규 임용', value: latest.joiners, icon: UserPlus, trend: joinersTrend },
    { label: '퇴사/휴업', value: latest.leavers, icon: UserMinus, trend: leaversTrend },
    { label: '로펌 이직', value: latest.transfers, icon: ArrowRightLeft, trend: transfersTrend },
    { label: '시장 활성도', value: `${marketActivity}%`, icon: Activity, trend: null },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-slate-50 rounded-lg text-slate-900 group-hover:bg-slate-900 group-hover:text-amber-500 transition-colors duration-300 border border-slate-100">
              <card.icon size={20} strokeWidth={2.5} />
            </div>
            {card.trend !== null && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                card.trend > 0 ? 'text-emerald-600 bg-emerald-50' :
                card.trend < 0 ? 'text-rose-600 bg-rose-50' :
                'text-slate-400 bg-slate-100'
              }`}>
                {card.trend > 0 ? `+${card.trend}` : card.trend}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-950 tracking-tighter">{card.value}</h3>
              <span className="text-xs text-slate-400 font-medium">Cases</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
