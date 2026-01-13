'use client'

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatsCards from '../components/StatsCards';
import MovementTable from '../components/MovementTable';
import MovementChart from '../components/MovementChart';
import AIAssistant from '../components/AIAssistant';
import SystemMonitor from '../components/SystemMonitor';
import FirmMovementSummary from '../components/FirmMovementSummary';
import { generateMockMovements, calculateStats } from '../services/mockDataService';
import { MAJOR_FIRMS } from '../constants';
import { Movement, DailyStats } from '../types';
import { ChevronRight, Briefcase, Loader2, Sparkles, Scale, FileText } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const data = generateMockMovements(60);
      setMovements(data);
      setStats(calculateStats(data));
      setLoading(false);
    };
    initData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="relative mb-8">
          <Scale className="w-16 h-16 text-slate-900 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-bold text-xl tracking-tighter">SECURE DATABASE ACCESS</p>
          <p className="text-slate-400 text-xs mt-2 font-black uppercase tracking-[0.3em]">Decrypting Market Intelligence...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Legal Intelligence Unit</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">변호사 영입 및 이직 분석 리포트</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">대한민국 주요 13개 로펌의 인력 변동을 실시간으로 추적합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
             {['Daily', 'Weekly', 'Monthly'].map((period) => (
               <button
                key={period}
                className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                  period === 'Daily' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
               >
                 {period}
               </button>
             ))}
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-amber-500 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all border border-slate-800">
            <FileText size={14} /> PDF Export
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          <MovementChart stats={stats} />
          <MovementTable movements={movements.slice(0, 8)} />
          <FirmMovementSummary movements={movements} />
        </div>

        <div className="space-y-10">
          <AIAssistant movements={movements} />

          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-8 flex items-center justify-between">
              실시간 인력 수급 랭킹
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Week</span>
            </h3>
            <div className="space-y-6">
              {MAJOR_FIRMS.slice(0, 5).map((firm, idx) => (
                <div key={firm.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-300 w-4 italic">#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-md group-hover:bg-slate-950 transition-colors" style={{ backgroundColor: firm.color }}>
                      {firm.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">{firm.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{firm.tier}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600">▲ 4</p>
                    <p className="text-[9px] text-slate-300 font-bold uppercase">Points</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-10 py-3 bg-slate-50 text-slate-400 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100">
              Show Full Analysis
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl p-8 text-white relative shadow-2xl border border-slate-800">
            <h3 className="font-bold text-base mb-6 flex items-center gap-3">
              <div className="bg-amber-600 p-1.5 rounded-lg">
                <Briefcase size={16} className="text-slate-900" />
              </div>
              <span className="tracking-tight">Exclusive Legal News</span>
            </h3>
            <div className="space-y-6">
              {[
                { title: '광장, 공정거래 부문 대규모 파트너급 보강 실시', date: '2026.01.13' },
                { title: '15기 변호사 수습 종료에 따른 로펌별 채용 티오 분석', date: '2026.01.12' }
              ].map((news, i) => (
                <div key={i} className="group cursor-pointer">
                  <p className="text-sm leading-relaxed font-bold text-slate-300 group-hover:text-amber-500 transition-colors">{news.title}</p>
                  <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-widest">{news.date} • INTERNAL REPORT</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'monitor' && <SystemMonitor />}
      {activeTab !== 'dashboard' && activeTab !== 'monitor' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-300 animate-in fade-in duration-700">
          <div className="p-10 rounded-full border-2 border-slate-100 mb-8">
            <Briefcase size={48} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Access Restricted</h3>
          <p className="text-slate-400 text-sm font-medium">선택하신 모듈은 현재 데이터 정합성 검토 단계에 있습니다.</p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mt-10 text-slate-900 text-xs font-black uppercase tracking-[0.2em] hover:underline underline-offset-8"
          >
            Back to Intelligence Center
          </button>
        </div>
      )}
    </Layout>
  );
}
