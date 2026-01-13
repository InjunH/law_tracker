
import { createClient } from '@supabase/supabase-js';
import { SystemStatus } from '../types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Added explicit return type Promise<SystemStatus> to ensure string literals 'idle' and 'connected' 
// are correctly mapped to the union types defined in SystemStatus.
export const getSystemHealth = async (): Promise<SystemStatus> => {
  // 실제 환경에서는 Supabase Edge Functions 또는 Health Check API 호출
  return {
    crawlerStatus: 'idle',
    lastSync: new Date().toISOString(),
    nextSync: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4시간 후
    dbStatus: 'connected',
    activeWorkers: 2,
    cpuUsage: 14,
    memoryUsage: 42
  };
};
