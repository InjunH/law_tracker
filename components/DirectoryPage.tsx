'use client'

import React, { useState, useEffect } from 'react';
import { fetchCurrentLawyers, fetchFirmHeadcounts } from '../services/supabaseService';
import { Search, Users, Building2, ChevronRight } from 'lucide-react';

interface LawyerPosition {
  id: string;
  lawyer_sid: string;
  firm_name: string;
  position_title: string;
  start_date: string;
  scraped_at: string;
  lawyers: {
    sid: string;
    name: string;
    name_chinese: string | null;
    birth_year: number | null;
    gender: string | null;
    exam_type: string | null;
    exam_number: number | null;
  };
}

export default function DirectoryPage() {
  const [lawyers, setLawyers] = useState<LawyerPosition[]>([]);
  const [firmCounts, setFirmCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 50;

  // 초기 로드: 로펌별 변호사 수만 가져오기
  useEffect(() => {
    loadFirmCounts();
  }, []);

  // 로펌 선택 시: 해당 로펌의 변호사 목록 로드
  useEffect(() => {
    if (selectedFirm) {
      loadLawyers(1); // 첫 페이지부터
    }
  }, [selectedFirm]);

  const loadFirmCounts = async () => {
    setLoading(true);
    try {
      const countsData = await fetchFirmHeadcounts();
      setFirmCounts(countsData);

      // 초기 선택: 변호사가 가장 많은 로펌
      if (Object.keys(countsData).length > 0) {
        const topFirm = Object.keys(countsData).sort((a, b) => countsData[b] - countsData[a])[0];
        setSelectedFirm(topFirm);
      }
    } catch (error) {
      console.error('Failed to load firm counts:', error);
    }
    setLoading(false);
  };

  const loadLawyers = async (page: number) => {
    if (!selectedFirm) return;

    setLawyersLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const lawyersData = await fetchCurrentLawyers(PAGE_SIZE, selectedFirm, offset);

      if (page === 1) {
        setLawyers(lawyersData as any);
      } else {
        setLawyers(prev => [...prev, ...(lawyersData as any)]);
      }

      setCurrentPage(page);
      setHasMore(lawyersData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load lawyers:', error);
    }
    setLawyersLoading(false);
  };

  const handleFirmSelect = (firmName: string) => {
    setSelectedFirm(firmName);
    setSearchQuery('');
    setCurrentPage(1);
    setLawyers([]);
  };

  const loadMore = () => {
    loadLawyers(currentPage + 1);
  };

  // 검색 필터링
  const filteredLawyers = lawyers.filter((item) => {
    const lawyer = item.lawyers;
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      lawyer.name.toLowerCase().includes(query) ||
      lawyer.name_chinese?.toLowerCase().includes(query) ||
      item.position_title?.toLowerCase().includes(query)
    );
  });

  // DB에 실제로 있는 로펌만 표시 (변호사 수로 정렬)
  const firms = Object.entries(firmCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400 text-sm font-medium">법조인 명부 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full animate-in fade-in duration-700">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Legal Directory</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">법조인 명부</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          대한민국 주요 로펌의 변호사 정보를 확인하세요.
        </p>
      </div>

      {/* 두 패널 레이아웃 */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        {/* 좌측 패널: 로펌 리스트 */}
        <div className="col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">주요 로펌</h3>
            <p className="text-xs text-slate-500">
              총 <span className="font-bold text-slate-900">{firms.length}</span>개 로펌
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {firms.map((firm) => (
              <button
                key={firm.name}
                onClick={() => handleFirmSelect(firm.name)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 border ${
                  selectedFirm === firm.name
                    ? 'bg-slate-950 text-white border-slate-950 shadow-lg'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2
                      size={20}
                      className={selectedFirm === firm.name ? 'text-amber-500' : 'text-slate-400'}
                    />
                    <div>
                      <p className={`font-bold text-sm ${selectedFirm === firm.name ? 'text-white' : 'text-slate-900'}`}>
                        {firm.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${selectedFirm === firm.name ? 'text-slate-400' : 'text-slate-500'}`}>
                        {firm.count}명의 변호사
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={selectedFirm === firm.name ? 'text-amber-500' : 'text-slate-300'}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 우측 패널: 변호사 테이블 */}
        <div className="col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* 검색 */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedFirm}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  총 <span className="font-bold text-slate-900">{firmCounts[selectedFirm] || 0}</span>명
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="이름으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* 테이블 */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                    직급
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                    출생년도
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                    시험정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                    스크랩 일시
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLawyers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">
                        {searchQuery
                          ? '검색 결과가 없습니다'
                          : '해당 로펌의 변호사 데이터가 없습니다'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLawyers.map((item) => {
                    const lawyer = item.lawyers;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{lawyer.name}</p>
                            {lawyer.name_chinese && (
                              <p className="text-xs text-slate-400 mt-0.5">({lawyer.name_chinese})</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 text-sm">{item.position_title || '변호사'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 text-sm">
                            {lawyer.birth_year ? `${lawyer.birth_year}년생` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 text-sm">
                            {lawyer.exam_type && lawyer.exam_number
                              ? `${lawyer.exam_type} ${lawyer.exam_number}회`
                              : lawyer.exam_type || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-400">
                            {new Date(item.scraped_at).toLocaleDateString('ko-KR')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
                {lawyersLoading && filteredLawyers.length > 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="text-slate-400 text-sm">로딩 중...</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 더 보기 버튼 */}
          {hasMore && !searchQuery && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-center">
              <button
                onClick={loadMore}
                disabled={lawyersLoading}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {lawyersLoading ? '로딩 중...' : `더 보기 (${filteredLawyers.length}/${firmCounts[selectedFirm] || 0})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
