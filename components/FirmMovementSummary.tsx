
import React, { useMemo } from 'react';
import { Movement } from '../types';
import { MAJOR_FIRMS } from '../constants';
import { ArrowUpRight, ArrowDownRight, Minus, Scale } from 'lucide-react';

interface FirmMovementSummaryProps {
  movements: Movement[];
}

const FirmMovementSummary: React.FC<FirmMovementSummaryProps> = ({ movements }) => {
  const firmStats = useMemo(() => {
    const stats: Record<string, { in: number; out: number }> = {};
    MAJOR_FIRMS.forEach(firm => {
      stats[firm.name] = { in: 0, out: 0 };
    });
    movements.forEach(m => {
      if (m.toFirm && stats[m.toFirm]) stats[m.toFirm].in++;
      if (m.fromFirm && stats[m.fromFirm]) stats[m.fromFirm].out++;
    });
    return MAJOR_FIRMS.map(firm => ({
      ...firm,
      in: stats[firm.name].in,
      out: stats[firm.name].out,
      net: stats[firm.name].in - stats[firm.name].out
    })).sort((a, b) => b.net - a.net);
  }, [movements]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900">법인별 인력 수급 현황</h3>
          <p className="text-xs text-slate-400 mt-1">30일 내 확정된 입사/퇴사 데이터 기준</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Scale size={20} className="text-slate-400" />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <th className="px-8 py-4">Law Firm</th>
              <th className="px-8 py-4 text-center">Inflow</th>
              <th className="px-8 py-4 text-center">Outflow</th>
              <th className="px-8 py-4 text-right">Net Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {firmStats.map((firm) => (
              <tr key={firm.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-8 rounded-full bg-slate-200" style={{ backgroundColor: firm.color }}></div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{firm.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{firm.tier}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className="text-slate-900 font-bold text-base">{firm.in}</span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className="text-slate-400 font-bold text-base">{firm.out}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {firm.net > 0 ? (
                      <span className="text-emerald-600 font-black text-sm flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                        <ArrowUpRight size={14} /> +{firm.net}
                      </span>
                    ) : firm.net < 0 ? (
                      <span className="text-rose-600 font-black text-sm flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                        <ArrowDownRight size={14} /> {firm.net}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-black text-sm flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                        <Minus size={14} /> 0
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FirmMovementSummary;
