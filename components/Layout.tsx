
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ArrowRightLeft, 
  TrendingUp, 
  Settings, 
  Bell,
  Search,
  Scale,
  Activity,
  ChevronDown
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
    { id: 'monitor', label: '데이터 관제', icon: Activity },
    { id: 'directory', label: '법조인 명부', icon: Users },
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

        <div className="p-6">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50 mb-4">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Status</span>
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            </div>
            <p className="text-xs text-slate-300 font-semibold tracking-tight">Enterprise Gateway 04</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white transition-colors text-sm font-medium">
            <Settings size={18} />
            시스템 설정
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-10">
          <div className="relative w-80">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="변호사명 또는 로펌 검색..."
              className="w-full bg-transparent border-none py-2 pl-7 pr-4 text-sm focus:ring-0 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end gap-0.5">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latest Update</span>
               <span className="text-xs text-slate-900 font-bold">2026.01.13 00:12:04</span>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-200"></div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-amber-600 rounded-full ring-2 ring-white"></span>
              </button>
              
              <button className="flex items-center gap-3 group">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">관리자 계정</p>
                  <p className="text-[10px] text-slate-500 font-medium">Master Admin</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center text-amber-500 font-bold text-xs shadow-lg border border-slate-800">
                  AD
                </div>
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
              </button>
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
