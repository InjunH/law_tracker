
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
import { TrendData } from '../types';

interface FirmTrendChartProps {
  data: TrendData[];
  firmName: string;
}

const FirmTrendChart: React.FC<FirmTrendChartProps> = ({ data, firmName }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-[450px] flex flex-col">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h3 className="font-bold text-lg text-slate-900">30일 인력 변화 추이</h3>
          <p className="text-xs text-slate-400 mt-1">{firmName}의 변호사 수 변동</p>
        </div>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(str) => {
                const [year, month, day] = str.split('-');
                return `${month}/${day}`;
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
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
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              labelFormatter={(label) => {
                const [year, month, day] = label.split('-');
                return `${year}년 ${month}월 ${day}일`;
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#0f172a"
              fillOpacity={1}
              fill="url(#colorCount)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FirmTrendChart;
