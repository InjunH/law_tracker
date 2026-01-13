
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Movement, DailyStats } from '../types';

// Lazy initialization을 위한 클라이언트 캐시
let supabaseInstance: SupabaseClient | null = null;

// Supabase 클라이언트를 필요할 때만 생성 (lazy initialization)
function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    // 브라우저 환경에서만 초기화
    if (typeof window === 'undefined') {
      throw new Error('Supabase client can only be initialized in browser');
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // 환경 변수가 없으면 빈 클라이언트 생성 (에러는 실제 사용 시 발생)
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

export interface SystemLog {
  id: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  timestamp: string;
}

/**
 * 최근 이동 내역 조회
 * movements 테이블에서 최근 30일 데이터를 가져옵니다.
 */
export const fetchMovements = async (limit: number = 60): Promise<Movement[]> => {
  try {
    const { data, error } = await getSupabase()
      .from('movements')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching movements:', error);
      // 에러 시 빈 배열 반환
      return [];
    }

    // DB 데이터를 Movement 타입으로 변환
    const movements: Movement[] = (data || []).map((item: any) => ({
      id: item.id,
      lawyerName: item.lawyer_name,
      date: item.detected_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      type: item.movement_type?.toUpperCase() as 'JOIN' | 'LEAVE' | 'TRANSFER',
      fromFirm: item.from_firm || undefined,
      toFirm: item.to_firm || undefined,
      position: '변호사', // movements 테이블에는 position 없음, 기본값
      expertise: [] // movements 테이블에는 expertise 없음, 빈 배열
    }));

    return movements;
  } catch (error) {
    console.error('Failed to fetch movements:', error);
    return [];
  }
};

/**
 * Movement 데이터로부터 DailyStats 계산
 */
export const calculateDailyStats = (movements: Movement[]): DailyStats[] => {
  const statsMap = new Map<string, { joiners: number; leavers: number; transfers: number }>();

  movements.forEach((movement) => {
    const date = movement.date;
    if (!statsMap.has(date)) {
      statsMap.set(date, { joiners: 0, leavers: 0, transfers: 0 });
    }

    const stats = statsMap.get(date)!;
    switch (movement.type) {
      case 'JOIN':
        stats.joiners++;
        break;
      case 'LEAVE':
        stats.leavers++;
        break;
      case 'TRANSFER':
        stats.transfers++;
        break;
    }
  });

  return Array.from(statsMap.entries())
    .map(([date, stats]) => ({
      date,
      ...stats
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * 로펌별 현재 변호사 수 조회 (firm_headcount 뷰 사용)
 */
export const fetchFirmHeadcounts = async (): Promise<Record<string, number>> => {
  try {
    const { data, error } = await getSupabase()
      .from('firm_headcount')
      .select('firm_name, lawyer_count');

    if (error) {
      console.error('Error fetching firm headcounts:', error);
      return {};
    }

    // 배열을 Record 형태로 변환
    const counts: Record<string, number> = {};
    (data || []).forEach((item: any) => {
      counts[item.firm_name] = item.lawyer_count;
    });

    console.log('📊 DB 로펌 헤드카운트:', counts);

    return counts;
  } catch (error) {
    console.error('Failed to fetch firm headcounts:', error);
    return {};
  }
};

/**
 * 현재 활동 중인 변호사 목록 조회 (로펌 필터링 및 페이지네이션 지원)
 * 변호사 이름 기준 가나다순 정렬
 */
export const fetchCurrentLawyers = async (
  limit: number = 100,
  firmName?: string,
  offset: number = 0
) => {
  try {
    let query = getSupabase()
      .from('lawyer_positions')
      .select(`
        id,
        lawyer_sid,
        firm_name,
        position_title,
        start_date,
        scraped_at,
        lawyers:lawyer_sid (
          sid,
          name,
          name_chinese,
          birth_year,
          gender,
          exam_type,
          exam_number
        )
      `)
      .eq('is_current', true);

    // 로펌 필터 적용
    if (firmName) {
      query = query.eq('firm_name', firmName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching current lawyers:', error);
      return [];
    }

    // 변호사 이름 기준 가나다순 정렬 (클라이언트 사이드)
    const sortedData = (data || []).sort((a: any, b: any) => {
      const nameA = a.lawyers?.name || '';
      const nameB = b.lawyers?.name || '';
      return nameA.localeCompare(nameB, 'ko');
    });

    // 페이지네이션 적용
    return sortedData.slice(offset, offset + limit);
  } catch (error) {
    console.error('Failed to fetch current lawyers:', error);
    return [];
  }
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

/**
 * 로펌별 이동 통계 (최근 N일)
 * 각 로펌의 입사, 퇴사, 순변동 집계
 */
export const fetchFirmMovementStats = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await getSupabase()
      .from('movements')
      .select('*')
      .gte('detected_at', startDate.toISOString());

    if (error) throw error;

    // 로펌별 집계
    const stats: Record<string, { joins: number; leaves: number; net: number }> = {};

    data?.forEach((movement: any) => {
      const toFirm = movement.to_firm;
      const fromFirm = movement.from_firm;

      // 입사
      if (toFirm && movement.movement_type === 'join') {
        if (!stats[toFirm]) stats[toFirm] = { joins: 0, leaves: 0, net: 0 };
        stats[toFirm].joins++;
        stats[toFirm].net++;
      }

      // 퇴사
      if (fromFirm && movement.movement_type === 'leave') {
        if (!stats[fromFirm]) stats[fromFirm] = { joins: 0, leaves: 0, net: 0 };
        stats[fromFirm].leaves++;
        stats[fromFirm].net--;
      }

      // 이직 (from에서 -1, to에서 +1)
      if (movement.movement_type === 'transfer' && fromFirm && toFirm) {
        if (!stats[fromFirm]) stats[fromFirm] = { joins: 0, leaves: 0, net: 0 };
        if (!stats[toFirm]) stats[toFirm] = { joins: 0, leaves: 0, net: 0 };
        stats[fromFirm].net--;
        stats[toFirm].net++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Failed to fetch firm movement stats:', error);
    return {};
  }
};

/**
 * 로펌의 일별 변호사 수 추세 (간소화 - 계산 방식)
 * MVP: movements 데이터로부터 역산
 */
export const fetchFirmHeadcountHistory = async (
  firmName: string,
  days: number = 30
) => {
  try {
    // 1. 현재 인원 조회
    const { data: currentData } = await getSupabase()
      .from('lawyer_positions')
      .select('lawyer_sid')
      .eq('firm_name', firmName)
      .eq('is_current', true);

    const currentCount = currentData?.length || 0;

    // 2. 최근 N일간의 movements 조회
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: movements } = await getSupabase()
      .from('movements')
      .select('*')
      .gte('detected_at', startDate.toISOString())
      .or(`from_firm.eq.${firmName},to_firm.eq.${firmName}`)
      .order('detected_at', { ascending: true });

    // 3. 일별 변화 계산 (역산)
    const dailyChanges: Record<string, number> = {};
    movements?.forEach((m: any) => {
      const date = m.detected_at.split('T')[0];
      if (!dailyChanges[date]) dailyChanges[date] = 0;

      if (m.to_firm === firmName) dailyChanges[date]++;
      if (m.from_firm === firmName) dailyChanges[date]--;
    });

    // 4. 일별 누적 계산
    const trendData: { date: string; count: number }[] = [];
    let runningCount = currentCount;

    // 오늘부터 역순으로 계산
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      trendData.unshift({ date: dateStr, count: runningCount });
      runningCount -= (dailyChanges[dateStr] || 0);
    }

    return trendData;
  } catch (error) {
    console.error('Failed to fetch firm headcount history:', error);
    return [];
  }
};
