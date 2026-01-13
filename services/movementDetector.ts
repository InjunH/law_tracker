/**
 * Movement Detector Service
 *
 * 변호사 이동 감지 시스템
 * - 스크랩 데이터와 DB 현재 상태를 비교하여 입사/퇴사/이직 감지
 * - movements 테이블에 이동 기록 저장
 * - is_current 플래그 관리
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LawyerRawData } from './lawnbScraper';
import {
  MovementRecord,
  MovementResult,
  CurrentPosition,
  RecentLeaveEvent,
} from '@/types/movements';

export class MovementDetector {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 메인 메서드: 이동 감지 실행
   *
   * @param firmName 로펌명
   * @param scrapedLawyers 스크랩된 변호사 데이터
   * @returns MovementResult (이동 기록, 업데이트할 position ID 등)
   */
  async detectMovements(
    firmName: string,
    scrapedLawyers: LawyerRawData[]
  ): Promise<MovementResult> {
    // 1. 첫 스크랩인지 확인
    const isFirstScrape = await this.checkFirstScrape(firmName);
    if (isFirstScrape) {
      console.log(`   ℹ️  First scrape for ${firmName}, skipping movement detection`);
      return {
        movements: [],
        positionsToUpdate: [],
        leaves: 0,
        joins: 0,
        transfers: 0,
      };
    }

    // 2. DB에서 현재 재직 중인 변호사 조회
    const currentPositions = await this.getCurrentPositions(firmName);

    // 3. SID 집합 생성
    const currentSids = new Set(currentPositions.map(p => p.lawyer_sid));
    const scrapedSids = new Set(scrapedLawyers.map(l => l.sid));

    // 4. 퇴사자 식별 (DB에는 있지만 스크랩에 없음)
    const leaverSids = Array.from(currentSids).filter(sid => !scrapedSids.has(sid));

    // 5. 입사자 식별 (스크랩에는 있지만 DB에 없음)
    const joinerData = scrapedLawyers.filter(l => !currentSids.has(l.sid));

    // 6. 이동 기록 생성
    const movements: MovementRecord[] = [];
    let leaveCount = 0;
    let joinCount = 0;
    let transferCount = 0;

    // 6.1. 퇴사자 처리
    for (const sid of leaverSids) {
      const position = currentPositions.find(p => p.lawyer_sid === sid);
      if (position) {
        movements.push({
          lawyer_sid: sid,
          lawyer_name: position.lawyer_name,
          from_firm: firmName,
          to_firm: '',  // 퇴사는 to_firm이 빈 문자열
          movement_type: 'leave',
          detected_at: new Date(),
        });
        leaveCount++;
      }
    }

    // 6.2. 입사자/이직자 처리
    for (const joiner of joinerData) {
      // 최근 30일 이내 다른 로펌에서 LEAVE 이벤트가 있는지 확인
      const isTransfer = await this.checkIfTransfer(joiner.sid, firmName);

      if (isTransfer) {
        // 이직자
        const recentLeave = await this.getRecentLeaveEvent(joiner.sid);
        movements.push({
          lawyer_sid: joiner.sid,
          lawyer_name: joiner.name,
          from_firm: recentLeave?.from_firm || null,
          to_firm: firmName,
          movement_type: 'transfer',
          detected_at: new Date(),
        });
        transferCount++;
      } else {
        // 신규 입사자
        movements.push({
          lawyer_sid: joiner.sid,
          lawyer_name: joiner.name,
          from_firm: null,
          to_firm: firmName,
          movement_type: 'join',
          detected_at: new Date(),
        });
        joinCount++;
      }
    }

    // 7. 업데이트할 position ID 조회 (퇴사자)
    const positionsToUpdate = await this.getPositionsToUpdate(leaverSids, firmName);

    return {
      movements,
      positionsToUpdate,
      leaves: leaveCount,
      joins: joinCount,
      transfers: transferCount,
    };
  }

  /**
   * 첫 스크랩 여부 확인
   * 해당 로펌의 데이터가 DB에 없으면 true 반환
   */
  private async checkFirstScrape(firmName: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('lawyer_positions')
      .select('*', { count: 'exact', head: true })
      .eq('firm_name', firmName)
      .eq('is_current', true);

    if (error) {
      console.error(`Error checking first scrape for ${firmName}:`, error);
      return false;
    }

    return count === 0;
  }

  /**
   * 현재 재직 중인 변호사 조회
   */
  private async getCurrentPositions(firmName: string): Promise<CurrentPosition[]> {
    const { data, error } = await this.supabase
      .from('lawyer_positions')
      .select(`
        id,
        lawyer_sid,
        firm_name,
        lawyers:lawyer_sid (
          name
        )
      `)
      .eq('firm_name', firmName)
      .eq('is_current', true);

    if (error) {
      console.error(`Error fetching current positions for ${firmName}:`, error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      lawyer_sid: item.lawyer_sid,
      lawyer_name: item.lawyers?.name || '',
      firm_name: item.firm_name,
    }));
  }

  /**
   * 이직 여부 확인 (최근 30일 이내 다른 로펌에서 LEAVE 이벤트)
   */
  private async checkIfTransfer(lawyerSid: string, currentFirm: string): Promise<boolean> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await this.supabase
      .from('movements')
      .select('*')
      .eq('lawyer_sid', lawyerSid)
      .eq('movement_type', 'leave')
      .neq('from_firm', currentFirm)
      .gte('detected_at', thirtyDaysAgo.toISOString())
      .order('detected_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Error checking transfer for ${lawyerSid}:`, error);
      return false;
    }

    return (data?.length || 0) > 0;
  }

  /**
   * 최근 LEAVE 이벤트 조회 (이직자의 이전 로펌 정보)
   */
  private async getRecentLeaveEvent(lawyerSid: string): Promise<RecentLeaveEvent | null> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await this.supabase
      .from('movements')
      .select('lawyer_sid, from_firm, detected_at')
      .eq('lawyer_sid', lawyerSid)
      .eq('movement_type', 'leave')
      .gte('detected_at', thirtyDaysAgo.toISOString())
      .order('detected_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      lawyer_sid: data[0].lawyer_sid,
      from_firm: data[0].from_firm,
      detected_at: new Date(data[0].detected_at),
    };
  }

  /**
   * 업데이트할 position ID 조회 (퇴사자들의 is_current를 false로 변경)
   */
  private async getPositionsToUpdate(leaverSids: string[], firmName: string): Promise<string[]> {
    if (leaverSids.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('lawyer_positions')
      .select('id')
      .eq('firm_name', firmName)
      .eq('is_current', true)
      .in('lawyer_sid', leaverSids);

    if (error) {
      console.error(`Error fetching positions to update:`, error);
      return [];
    }

    return (data || []).map((item: any) => item.id);
  }
}
