
import { createClient } from '@supabase/supabase-js';
import { Movement, DailyStats } from '../types';

// 환경 변수가 없을 경우를 대비한 Mock Fallback 로직 포함
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface SystemLog {
  id: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  timestamp: string;
}

export const fetchMovements = async (): Promise<Movement[]> => {
  // 실제 구현 시: 
  // const { data, error } = await supabase.from('movements').select('*').order('date', { ascending: false });
  // return data;
  
  // 현재는 인터페이스 데모를 위해 비동기 시뮬레이션
  return new Promise((resolve) => {
    setTimeout(() => {
      import('./mockDataService').then(m => resolve(m.generateMockMovements(60)));
    }, 500);
  });
};

export const fetchSystemStatus = async () => {
  return {
    crawler: 'online',
    lastSync: new Date().toISOString(),
    nextSync: '2026-01-14T00:00:00Z',
    dbConnection: 'healthy',
    activeWorkers: 3
  };
};

export const fetchLogs = async (): Promise<SystemLog[]> => {
  return [
    { id: '1', level: 'info', message: '김앤장 변호사 목록 크롤링 시작', timestamp: new Date().toISOString() },
    { id: '2', level: 'info', message: '광장 데이터 파싱 완료 (변동 3건 감지)', timestamp: new Date().toISOString() },
    { id: '3', level: 'info', message: 'Supabase DB 스냅샷 저장 성공', timestamp: new Date().toISOString() },
    { id: '4', level: 'info', message: '일일 리포트 알림 발송 완료', timestamp: new Date().toISOString() },
  ];
};
