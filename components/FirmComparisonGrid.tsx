
import React from 'react';
import { LawFirm, FirmStats } from '../types';
import FirmCard from './FirmCard';

interface FirmComparisonGridProps {
  firms: LawFirm[];
  firmStats: Record<string, FirmStats>;
  selectedFirm: string | null;
  onSelectFirm: (firmName: string) => void;
}

const FirmComparisonGrid: React.FC<FirmComparisonGridProps> = ({
  firms,
  firmStats,
  selectedFirm,
  onSelectFirm
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {firms.map((firm) => {
        const stats = firmStats[firm.name];

        // 통계가 없는 경우 기본값 사용
        const defaultStats: FirmStats = {
          firmName: firm.name,
          current: 0,
          joins: 0,
          leaves: 0,
          net: 0
        };

        return (
          <FirmCard
            key={firm.id}
            firm={firm}
            stats={stats || defaultStats}
            selected={selectedFirm === firm.name}
            onClick={() => onSelectFirm(firm.name)}
          />
        );
      })}
    </div>
  );
};

export default FirmComparisonGrid;
