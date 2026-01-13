
import React from 'react';
import { Movement } from '../types';
import { ArrowRight, LogIn, LogOut, ArrowRightLeft, MoreHorizontal } from 'lucide-react';

interface MovementTableProps {
  movements: Movement[];
}

const MovementTable: React.FC<MovementTableProps> = ({ movements }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 tracking-tight">실시간 인력 이동 내역</h3>
          <p className="text-xs text-slate-400 mt-0.5">전국 13개 대형 로펌 기준 실시간 업데이트</p>
        </div>
        <button className="text-slate-400 hover:text-slate-900 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-[0.15em] border-b border-slate-100">
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4">Attorney</th>
              <th className="px-8 py-4">Transfer Details</th>
              <th className="px-8 py-4">Position</th>
              <th className="px-8 py-4">Expertise</th>
              <th className="px-8 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                <td className="px-8 py-5">
                  {m.type === 'JOIN' && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-black text-[10px] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Recruitment
                    </span>
                  )}
                  {m.type === 'LEAVE' && (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-black text-[10px] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      Resignation
                    </span>
                  )}
                  {m.type === 'TRANSFER' && (
                    <span className="inline-flex items-center gap-1.5 text-blue-700 font-black text-[10px] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Transfer
                    </span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-amber-500 shadow-sm">
                      {m.lawyerName.substring(4, 5)}
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{m.lawyerName}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${!m.fromFirm ? 'text-slate-300' : 'text-slate-600'}`}>
                      {m.fromFirm || 'Initial'}
                    </span>
                    <ArrowRight size={12} className="text-slate-300" />
                    <span className={`text-xs font-bold ${!m.toFirm ? 'text-slate-300' : 'text-slate-900 underline underline-offset-4 decoration-slate-200'}`}>
                      {m.toFirm || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs text-slate-500 font-medium uppercase tracking-tight">{m.position}</td>
                <td className="px-8 py-5">
                  <div className="flex flex-wrap gap-1.5">
                    {m.expertise.slice(0, 2).map((exp, i) => (
                      <span key={i} className="text-[10px] font-bold border border-slate-200 text-slate-500 px-2 py-0.5 rounded bg-white">
                        {exp}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-5 text-right text-xs text-slate-400 font-mono">
                  {m.date.replace(/-/g, '.')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MovementTable;
