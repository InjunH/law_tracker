
import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { FirmStats, TrendData } from '../types';
import { fetchFirmHeadcountHistory } from '../services/supabaseService';
import FirmStatsCards from './FirmStatsCards';
import FirmTrendChart from './FirmTrendChart';

interface FirmDetailSectionProps {
  firmName: string;
  stats: FirmStats;
  onClose: () => void;
}

const FirmDetailSection: React.FC<FirmDetailSectionProps> = ({ firmName, stats, onClose }) => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrendData = async () => {
      setLoading(true);
      try {
        const data = await fetchFirmHeadcountHistory(firmName, 30);
        setTrendData(data);
      } catch (error) {
        console.error('Failed to load firm trend data:', error);
      }
      setLoading(false);
    };

    loadTrendData();
  }, [firmName]);

  return (
    <div className="mt-10 space-y-8 animate-in fade-in duration-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">{firmName} 상세 분석</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* 통계 카드 */}
      <FirmStatsCards stats={stats} />

      {/* 차트 */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-[450px] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
          <p className="text-slate-400 text-sm">데이터 로딩 중...</p>
        </div>
      ) : trendData.length > 0 ? (
        <FirmTrendChart data={trendData} firmName={firmName} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-[450px] flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm">표시할 추세 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default FirmDetailSection;
