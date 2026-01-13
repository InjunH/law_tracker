/**
 * Headcount 변동 감지 서비스
 * 로펌별 변호사 수 변동을 확인하여 전체 스크래핑 필요 여부 판단
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface HeadcountComparison {
  firmName: string;
  currentCount: number;  // 웹사이트에서 확인한 현재 인원수
  previousCount: number; // DB에 저장된 이전 인원수
  hasChanged: boolean;   // 변동 여부
  difference: number;    // 차이 (양수: 증가, 음수: 감소)
}

export class HeadcountChecker {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 특정 로펌의 현재 DB 인원수 조회
   */
  async getDbHeadcount(firmName: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('lawyer_positions')
      .select('*', { count: 'exact', head: true })
      .eq('firm_name', firmName)
      .eq('is_current', true);

    if (error) {
      console.error(`❌ DB 조회 오류 [${firmName}]:`, error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Headcount 비교 및 변동 감지
   */
  async compareHeadcount(
    firmName: string,
    currentCount: number
  ): Promise<HeadcountComparison> {
    const previousCount = await this.getDbHeadcount(firmName);
    const difference = currentCount - previousCount;
    const hasChanged = difference !== 0;

    return {
      firmName,
      currentCount,
      previousCount,
      hasChanged,
      difference
    };
  }

  /**
   * 여러 로펌의 headcount 비교 (병렬 처리)
   */
  async compareMultipleFirms(
    firms: Array<{ name: string; count: number }>
  ): Promise<HeadcountComparison[]> {
    const comparisons = await Promise.all(
      firms.map(firm => this.compareHeadcount(firm.name, firm.count))
    );

    return comparisons;
  }

  /**
   * 스크래핑이 필요한 로펌 목록 필터링
   */
  filterChangedFirms(comparisons: HeadcountComparison[]): HeadcountComparison[] {
    return comparisons.filter(c => c.hasChanged);
  }

  /**
   * 비교 결과 요약 로깅
   */
  logComparison(comparison: HeadcountComparison): void {
    const { firmName, currentCount, previousCount, hasChanged, difference } = comparison;

    if (!hasChanged) {
      console.log(`✅ [${firmName}] No change: ${currentCount} lawyers`);
    } else if (difference > 0) {
      console.log(`📈 [${firmName}] Increased: ${previousCount} → ${currentCount} (+${difference})`);
    } else {
      console.log(`📉 [${firmName}] Decreased: ${previousCount} → ${currentCount} (${difference})`);
    }
  }

  /**
   * 여러 로펌의 비교 결과 요약
   */
  logSummary(comparisons: HeadcountComparison[]): void {
    const changed = comparisons.filter(c => c.hasChanged);
    const unchanged = comparisons.filter(c => !c.hasChanged);
    const totalIncrease = changed
      .filter(c => c.difference > 0)
      .reduce((sum, c) => sum + c.difference, 0);
    const totalDecrease = changed
      .filter(c => c.difference < 0)
      .reduce((sum, c) => sum + Math.abs(c.difference), 0);

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Headcount Check Summary');
    console.log('─'.repeat(60));
    console.log(`   Total firms checked: ${comparisons.length}`);
    console.log(`   Unchanged: ${unchanged.length}`);
    console.log(`   Changed: ${changed.length}`);
    if (changed.length > 0) {
      console.log(`   Total increase: +${totalIncrease}`);
      console.log(`   Total decrease: -${totalDecrease}`);
      console.log(`   Net change: ${totalIncrease - totalDecrease > 0 ? '+' : ''}${totalIncrease - totalDecrease}`);
    }
    console.log('═'.repeat(60) + '\n');
  }
}
