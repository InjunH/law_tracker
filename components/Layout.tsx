'use client'

import React from 'react';
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  TrendingUp,
  Scale,
  Activity
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '시장 요약', icon: LayoutDashboard },
    { id: 'movements', label: '이직 히스토리', icon: ArrowRightLeft },
    { id: 'firms', label: '법인별 분석', icon: TrendingUp },
    { id: 'directory', label: '법조인 명부', icon: Users },
    ...(process.env.NODE_ENV === 'development' ? [{ id: 'monitor', label: '데이터 관제', icon: Activity }] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-200 flex flex-col hidden md:flex border-r border-slate-800 shadow-2xl">
        <div className="p-8 flex flex-col gap-1 items-start">
          <div className="flex items-center gap-3 mb-2">
            <Scale size={28} className="text-amber-500" />
            <h1 className="font-bold text-xl tracking-tighter text-white">LAW TRACK</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Intelligence Platform</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-slate-800 text-amber-500 shadow-inner border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className={`text-sm tracking-tight ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {item.id === 'monitor' && (
                <span className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full live-dot"></span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-10 z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-0.5">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latest Update</span>
               <span className="text-xs text-slate-900 font-bold">2026.01.13 00:12:04</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
