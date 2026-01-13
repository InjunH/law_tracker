'use client'

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Quote } from 'lucide-react';
import { Movement } from '../types';
import { getMarketInsights } from '../services/gemini';

interface AIAssistantProps {
  movements: Movement[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ movements }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchInsight = async () => {
    setLoading(true);
    const result = await getMarketInsights(movements);
    setInsight(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsight();
  }, []);

  return (
    <div className="bg-slate-950 rounded-xl p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
      {/* Texture background */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Sparkles size={180} />
      </div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <Sparkles size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-tight">AI 인텔리전스 리포트</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Market Analysis</p>
          </div>
        </div>
        <button 
          onClick={fetchInsight}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative z-10 min-h-[140px] flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center w-full gap-4 py-8">
            <div className="w-10 h-[1px] bg-amber-500/50 animate-pulse"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Processing Data...</p>
          </div>
        ) : (
          <div className="relative">
            <Quote className="absolute -top-4 -left-4 text-slate-800 w-10 h-10 -z-10" />
            <p className="text-[15px] leading-relaxed text-slate-300 font-medium italic">
              {insight}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-10 pt-6 border-t border-slate-900 flex items-center justify-between relative z-10">
        <div className="flex flex-col">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Engine</p>
            <p className="text-[11px] text-slate-300 font-bold">Gemini 3 Flash Pro</p>
        </div>
        <button className="text-[11px] font-bold border border-slate-800 bg-slate-900 text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-amber-500 transition-all duration-300">
          심층 분석 자료실
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
