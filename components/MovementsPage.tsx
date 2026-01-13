'use client'

import React, { useState, useMemo } from 'react';
import { Movement, MovementType } from '../types';
import MovementTable from './MovementTable';
import MovementChart from './MovementChart';
import { Search, Users } from 'lucide-react';

interface MovementsPageProps {
  initialMovements?: Movement[];
}

export default function MovementsPage({ initialMovements = [] }: MovementsPageProps) {
  // 상태 관리
  const [movements] = useState<Movement[]>(initialMovements);
  const [selectedFirms, setSelectedFirms] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<MovementType[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // 필터링 (useMemo로 최적화)
  const filteredMovements = useMemo(() => {
    let result = movements;

    // 로펌 필터
    if (selectedFirms.length > 0) {
      result = result.filter(m =>
        selectedFirms.includes(m.fromFirm || '') ||
        selectedFirms.includes(m.toFirm || '')
      );
    }

    // 유형 필터
    if (selectedTypes.length > 0) {
      result = result.filter(m => selectedTypes.includes(m.type));
    }

    // 날짜 필터
    if (dateRange) {
      result = result.filter(m =>
        m.date >= dateRange.start && m.date <= dateRange.end
      );
    }

    // 검색 필터
    if (searchQuery) {
      result = result.filter(m =>
        m.lawyerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [movements, selectedFirms, selectedTypes, dateRange, searchQuery]);

  // 페이지네이션
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMovements.slice(start, start + PAGE_SIZE);
  }, [filteredMovements, currentPage]);

  // 전체 로펌 리스트 (movements 데이터에서 추출)
  const firmList = useMemo(() => {
    const firmSet = new Set<string>();
    movements.forEach(m => {
      if (m.fromFirm) firmSet.add(m.fromFirm);
      if (m.toFirm) firmSet.add(m.toFirm);
    });
    return Array.from(firmSet).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [movements]);

  // 통계 계산
  const stats = useMemo(() => {
    const joinCount = filteredMovements.filter(m => m.type === 'JOIN').length;
    const leaveCount = filteredMovements.filter(m => m.type === 'LEAVE').length;
    const transferCount = filteredMovements.filter(m => m.type === 'TRANSFER').length;
    return { joinCount, leaveCount, transferCount };
  }, [filteredMovements]);

  return (
    <div className="h-full animate-in fade-in duration-700">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Movement History
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">이직 히스토리</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          대한민국 주요 로펌의 변호사 이동 이력을 확인하세요.
        </p>
      </div>

      {/* 3패널 레이아웃 */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        {/* 좌측: 필터 패널 */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* 로펌 필터 */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">로펌별 필터</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {firmList.map(firm => (
                <label key={firm} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedFirms.includes(firm)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFirms([...selectedFirms, firm]);
                      } else {
                        setSelectedFirms(selectedFirms.filter(f => f !== firm));
                      }
                    }}
                    className="w-4 h-4 text-slate-900 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{firm}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 이동 유형 필터 */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">이동 유형</h3>
            <div className="space-y-2">
              {[
                { type: 'JOIN' as const, label: '영입', color: 'emerald' },
                { type: 'LEAVE' as const, label: '퇴사', color: 'rose' },
                { type: 'TRANSFER' as const, label: '이직', color: 'blue' }
              ].map(({ type, label, color }) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, type]);
                      } else {
                        setSelectedTypes(selectedTypes.filter(t => t !== type));
                      }
                    }}
                    className="w-4 h-4 text-slate-900 rounded border-slate-300"
                  />
                  <span className={`text-${color}-700 font-black text-xs uppercase tracking-wider bg-${color}-50 px-2 py-0.5 rounded border border-${color}-100`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 날짜 필터 */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">기간 설정</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">시작일</label>
                <input
                  type="date"
                  value={dateRange?.start || ''}
                  onChange={(e) => setDateRange({
                    start: e.target.value,
                    end: dateRange?.end || ''
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">종료일</label>
                <input
                  type="date"
                  value={dateRange?.end || ''}
                  onChange={(e) => setDateRange({
                    start: dateRange?.start || '',
                    end: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={() => setDateRange(undefined)}
                className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                날짜 필터 초기화
              </button>
            </div>
          </div>

          {/* 필터 초기화 버튼 */}
          <div className="p-6 border-t border-slate-200 mt-auto">
            <button
              onClick={() => {
                setSelectedFirms([]);
                setSelectedTypes([]);
                setDateRange(undefined);
                setSearchQuery('');
              }}
              className="w-full py-3 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              전체 필터 초기화
            </button>
          </div>
        </div>

        {/* 중앙: 메인 테이블 */}
        <div className="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* 검색 바 */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">이동 내역</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  총 <span className="font-bold text-slate-900">{filteredMovements.length}</span>건
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="변호사 이름으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* 테이블 내용 */}
          <div className="flex-1 overflow-y-auto">
            {paginatedMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <Users className="w-16 h-16 mb-4" />
                <p className="text-sm font-medium text-slate-400">
                  {searchQuery || selectedFirms.length > 0 || selectedTypes.length > 0 || dateRange
                    ? '검색 결과가 없습니다'
                    : '이동 이력이 없습니다'}
                </p>
              </div>
            ) : (
              <MovementTable movements={paginatedMovements} />
            )}
          </div>

          {/* 페이지네이션 */}
          {filteredMovements.length > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredMovements.length)} of {filteredMovements.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * PAGE_SIZE >= filteredMovements.length}
                  className="px-4 py-2 bg-white border border-slate-200 rounded text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 우측: 통계 패널 */}
        <div className="col-span-3 space-y-6">
          {/* 빠른 통계 카드 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">빠른 통계</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">총 이동 건수</span>
                <span className="text-2xl font-bold text-slate-900">{filteredMovements.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600">영입</span>
                <span className="text-lg font-bold text-emerald-600">{stats.joinCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-600">퇴사</span>
                <span className="text-lg font-bold text-rose-600">{stats.leaveCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600">이직</span>
                <span className="text-lg font-bold text-blue-600">{stats.transferCount}</span>
              </div>
            </div>
          </div>

          {/* 미니 차트 - 향후 추가 예정 */}
          {movements.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-64">
              <h3 className="text-sm font-bold text-slate-900 mb-4">시계열 추이</h3>
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                차트 표시 예정
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
