
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SystemStatus } from '../types';

// Lazy initialization을 위한 클라이언트 캐시
let supabaseInstance: SupabaseClient | null = null;

// Supabase 클라이언트를 필요할 때만 생성 (lazy initialization)
function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase credentials not found');
    }

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseInstance;
}

// Supabase 클라이언트 export (lazy initialization 사용)
export const supabase = {
  get from() {
    return getSupabase().from.bind(getSupabase());
  },
  get auth() {
    return getSupabase().auth;
  },
  get storage() {
    return getSupabase().storage;
  }
} as any;

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
