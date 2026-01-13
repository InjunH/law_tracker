
import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  Activity, 
  Clock, 
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';
import { getSystemHealth } from '../lib/supabase';
import { SystemStatus } from '../types';

const SystemMonitor: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    getSystemHealth().then(setStatus);
    const interval = setInterval(() => {
      getSystemHealth().then(setStatus);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerManualCrawl = () => {
    setIsSyncing(true);
    // 실제로는 Supabase Edge Function이나 백엔드 Webhook 호출
    setTimeout(() => {
      setIsSyncing(false);
      alert('크롤링 서버(Worker-01)에 작업이 할당되었습니다.');
    }, 1500);
  };

  if (!status) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">시스템 제어 센터</h2>
          <p className="text-slate-500 mt-1">스케줄러 서버 및 크롤러 인프라 실시간 모니터링</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={triggerManualCrawl}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <Zap size={18} className={isSyncing ? "animate-pulse" : ""} />
            수동 크롤링 실행
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard title="스케줄러 서버" value="Active" sub="Node.js Cluster" icon={Server} color="text-emerald-500" />
        <StatusCard title="Supabase DB" value="Connected" sub="PostgreSQL 15" icon={Database} color="text-blue-500" />
        <StatusCard title="크롤러 CPU" value={`${status.cpuUsage}%`} sub="Idle State" icon={Cpu} color="text-amber-500" />
        <StatusCard title="다음 작업" value="00:00 AM" sub="Daily Batch" icon={Clock} color="text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-slate-300 font-mono text-sm shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4 relative z-10">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-emerald-500" />
                <span className="font-bold text-slate-100 uppercase tracking-tighter">Crawler-Core-01 Logs</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full live-dot"></span>
              </div>
            </div>
            <div className="space-y-2 h-[320px] overflow-y-auto custom-scrollbar relative z-10">
              <LogLine time="09:12:44" level="INFO" msg="Scheduler initiated: Daily Attorney Tracker" />
              <LogLine time="09:12:45" level="INFO" msg="Initializing Puppeteer headless cluster..." />
              <LogLine time="09:12:48" level="INFO" msg="Target set: lawnb.com/lawyers" />
              <LogLine time="09:12:50" level="SUCCESS" msg="Authentication successful with Lawnb provider" />
              <LogLine time="09:13:12" level="INFO" msg="Scraping Firm: Kim & Chang (Batch 1/13)..." />
              <LogLine time="09:13:45" level="SUCCESS" msg="Synced 964 records to Supabase: 'lawyers_snapshot'" />
              <LogLine time="09:14:02" level="INFO" msg="Comparing snapshots: 2026-01-12 vs 2026-01-13" />
              <LogLine time="09:14:05" level="INFO" msg="3 movements detected. Updating 'movements' table..." />
              <div className="text-emerald-500/50 animate-pulse mt-4">>> Waiting for next signal...</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              인프라 상태 요약
            </h3>
            <div className="space-y-5">
              <MetricItem label="서버 업타임" value="14일 2시간" />
              <MetricItem label="API 레이턴시" value="42ms" />
              <MetricItem label="데이터 성공률" value="99.9%" />
              <MetricItem label="스토리지 사용량" value="1.2 / 50 GB" />
            </div>
            <div className="mt-8">
              <div className="flex justify-between mb-2 text-xs font-bold text-slate-400">
                <span>리소스 사용량</span>
                <span>42%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[42%]"></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <HardDrive className="text-blue-400" size={24} />
                <h4 className="font-bold">Database Instance</h4>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
               Supabase PostgreSQL 인스턴스가 안정적으로 가동 중입니다. 매일 오전 2시 전체 데이터 백업이 수행됩니다.
             </p>
             <button className="w-full mt-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all">
               백업 로그 확인
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between hover:border-blue-200 transition-colors cursor-default">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
    <div className={`${color} p-3 bg-slate-50 rounded-2xl`}>
      <Icon size={24} />
    </div>
  </div>
);

const LogLine = ({ time, level, msg }: any) => {
  const levelColor = level === 'SUCCESS' ? 'text-emerald-400' : level === 'ERROR' ? 'text-rose-400' : 'text-blue-400';
  return (
    <div className="flex gap-4 hover:bg-white/5 transition-colors py-0.5 rounded px-1">
      <span className="text-slate-600 shrink-0">[{time}]</span>
      <span className={`${levelColor} font-bold w-16`}>{level}:</span>
      <span className="text-slate-300">{msg}</span>
    </div>
  );
};

const MetricItem = ({ label, value }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-bold text-slate-800">{value}</span>
  </div>
);

export default SystemMonitor;
