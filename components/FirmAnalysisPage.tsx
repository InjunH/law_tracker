'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { MAJOR_FIRMS } from '../constants';
import { fetchFirmHeadcounts, fetchFirmMovementStats } from '../services/supabaseService';
import { FirmStats } from '../types';
import { Scale } from 'lucide-react';
import FirmComparisonGrid from './FirmComparisonGrid';
import FirmDetailSection from './FirmDetailSection';

export default function FirmAnalysisPage() {
  const [selectedFirm, setSelectedFirm] = useState<string | null>(null);
  const [firmStats, setFirmStats] = useState<Record<string, FirmStats>>({});
  const [tierFilter, setTierFilter] = useState<'all' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('all');
  const [sortBy, setSortBy] = useState<'netChange' | 'headcount' | 'name'>('netChange');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [headcounts, movementStats] = await Promise.all([
          fetchFirmHeadcounts(),
          fetchFirmMovementStats(30)
        ]);

        // 로펌별 통계 계산
        const stats: Record<string, FirmStats> = {};
        MAJOR_FIRMS.forEach(firm => {
          const current = headcounts[firm.name] || 0;
          const movement = movementStats[firm.name] || { joins: 0, leaves: 0, net: 0 };

          stats[firm.name] = {
            firmName: firm.name,
            current,
            joins: movement.joins,
            leaves: movement.leaves,
            net: movement.net
          };
        });

        setFirmStats(stats);
      } catch (error) {
        console.error('Failed to load firm analysis data:', error);
      }
      setLoading(false);
    };

    initData();
  }, []);

  // 필터링 및 정렬
  const filteredAndSortedFirms = useMemo(() => {
    let filtered = MAJOR_FIRMS;

    // Tier 필터
    if (tierFilter !== 'all') {
      filtered = filtered.filter(firm => firm.tier === tierFilter.replace('_', ' '));
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      const statsA = firmStats[a.name];
      const statsB = firmStats[b.name];

      if (!statsA || !statsB) return 0;

      switch (sortBy) {
        case 'netChange':
          return statsB.net - statsA.net;
        case 'headcount':
          return statsB.current - statsA.current;
        case 'name':
          return a.name.localeCompare(b.name, 'ko');
        default:
          return 0;
      }
    });

    return sorted;
  }, [tierFilter, sortBy, firmStats]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="relative mb-8">
          <Scale className="w-16 h-16 text-slate-900 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-bold text-xl tracking-tighter">LOADING FIRM ANALYSIS</p>
          <p className="text-slate-400 text-xs mt-2 font-black uppercase tracking-[0.3em]">Calculating Statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Firm Analysis Unit</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">법인별 분석</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">13개 주요 로펌의 통계를 비교하세요</p>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tier</span>
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            {(['all', 'TIER_1', 'TIER_2', 'TIER_3'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                  tierFilter === tier ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {tier === 'all' ? 'All' : tier.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">정렬</span>
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            {([
              { value: 'netChange', label: '변동순' },
              { value: 'headcount', label: '인원순' },
              { value: 'name', label: '이름순' }
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                  sortBy === option.value ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 로펌 비교 그리드 */}
      <FirmComparisonGrid
        firms={filteredAndSortedFirms}
        firmStats={firmStats}
        selectedFirm={selectedFirm}
        onSelectFirm={setSelectedFirm}
      />

      {/* 로펌 상세 (조건부 렌더링) */}
      {selectedFirm && firmStats[selectedFirm] && (
        <FirmDetailSection
          firmName={selectedFirm}
          stats={firmStats[selectedFirm]}
          onClose={() => setSelectedFirm(null)}
        />
      )}
    </div>
  );
}
