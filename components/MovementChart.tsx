
import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { DailyStats } from '../types';

interface MovementChartProps {
  stats: DailyStats[];
}

const MovementChart: React.FC<MovementChartProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-[450px] flex flex-col">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h3 className="font-bold text-lg text-slate-900">시장 변동 시계열 분석</h3>
          <p className="text-xs text-slate-400 mt-1">최근 30일간의 인력 유동성 패턴</p>
        </div>
        <div className="flex gap-6">
          <LegendItem color="bg-slate-950" label="Recruitment" />
          <LegendItem color="bg-slate-400" label="Resignation" />
          <LegendItem color="bg-amber-500" label="Transfer" />
        </div>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats}>
            <defs>
              <linearGradient id="colorJoin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
              tickFormatter={(str) => str.split('-')[2]}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              cursor={{stroke: '#cbd5e1', strokeWidth: 1}}
            />
            <Area type="monotone" dataKey="joiners" stroke="#0f172a" fillOpacity={1} fill="url(#colorJoin)" strokeWidth={3} />
            <Area type="monotone" dataKey="leavers" stroke="#94a3b8" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
            <Area type="monotone" dataKey="transfers" stroke="#d97706" fillOpacity={0} strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 ${color} rounded-sm`}></div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

export default MovementChart;
