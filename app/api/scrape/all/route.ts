/**
 * 전체 로펌 스크래핑 API
 * POST /api/scrape/all
 * GET /api/scrape/all (Vercel Cron용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LawnbScraper, ScrapingProgress } from '@/services/lawnbScraper';
import { transformLawyersData, separateLawyerData, filterValidLawyers } from '@/services/dataTransformer';
import { HeadcountChecker, HeadcountComparison } from '@/services/headcountChecker';
import { MovementDetector } from '@/services/movementDetector';

// 13개 주요 로펌 목록 (규모순)
const MAJOR_FIRMS = [
  '김앤장',    // ~960명
  '광장',      // ~570명
  '세종',      // ~510명
  '태평양',    // ~500명
  '율촌',      // ~410명
  '화우',      // ~330명
  '바른',      // ~200명
  '지평',      // ~150명
  '와이케이',  // 50~150명
  '대륜',      // 50~150명
  '대륙아주',  // 50~150명
  '동인',      // 50~150명
  '로고스'     // 50~150명
];

interface FirmScrapingResult {
  firmName: string;
  success: boolean;
  scraped?: {
    total: number;
    valid: number;
    invalid: number;
  };
  saved?: {
    lawyers: number;
    positions: number;
  };
  error?: string;
  duration: number; // milliseconds
}

export async function POST(request: NextRequest) {
  // Supabase 클라이언트 생성 (런타임에만 실행)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startTime = Date.now();
  const results: FirmScrapingResult[] = [];
  let headcountChecks: HeadcountComparison[] = [];
  let changedFirms: HeadcountComparison[] = [];

  try {
    console.log('🚀 Starting smart scrape for all major law firms\n');
    console.log('📊 Phase 1: Headcount Check (fast)\n');

    const scraper = new LawnbScraper();
    await scraper.init();

    const headcountChecker = new HeadcountChecker(supabase);

    // Phase 1: 빠른 headcount 체크 (13개 로펌, 약 1-2분)
    headcountChecks = [];
    for (const firmName of MAJOR_FIRMS) {
      try {
        console.log(`🔍 Checking ${firmName}...`);
        const currentCount = await scraper.checkHeadcount(firmName);
        const comparison = await headcountChecker.compareHeadcount(firmName, currentCount);
        headcountChecker.logComparison(comparison);
        headcountChecks.push(comparison);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Headcount check failed for ${firmName}:`, error instanceof Error ? error.message : error);
        headcountChecks.push({
          firmName,
          currentCount: 0,
          previousCount: 0,
          hasChanged: true, // 오류 시 스크래핑 시도
          difference: 0
        });
      }
    }

    // Phase 2: 변동이 있는 로펌만 전체 스크래핑
    changedFirms = headcountChecker.filterChangedFirms(headcountChecks);
    headcountChecker.logSummary(headcountChecks);

    if (changedFirms.length === 0) {
      console.log('✅ No changes detected. Skipping full scrape.\n');
      await scraper.close();

      return NextResponse.json({
        success: true,
        summary: {
          totalFirms: MAJOR_FIRMS.length,
          checkedCount: headcountChecks.length,
          changedCount: 0,
          skippedCount: MAJOR_FIRMS.length,
          totalLawyers: 0,
          duration: Date.now() - startTime
        },
        headcountChecks,
        results: []
      });
    }

    console.log(`\n🏢 Phase 2: Full Scrape (${changedFirms.length} firms with changes)\n`);

    for (const comparison of changedFirms) {
      const firmName = comparison.firmName;
      const firmStartTime = Date.now();

      try {
        console.log(`\n🏢 Scraping: ${firmName} (${comparison.difference > 0 ? '+' : ''}${comparison.difference})`);
        console.log('─'.repeat(60));

        const scrapedAt = new Date();
        const rawLawyers = await scraper.scrapeFirm(firmName, (progress: ScrapingProgress) => {
          console.log(
            `   Page ${progress.currentPage}/${progress.totalPages} - ` +
            `${progress.lawyersScraped} lawyers`
          );
        });

        // 데이터 유효성 검증
        const { valid, invalid } = filterValidLawyers(rawLawyers);

        if (invalid.length > 0) {
          console.warn(`⚠️  ${invalid.length} invalid records`);
        }

        // 데이터 변환
        const transformed = transformLawyersData(valid, scrapedAt);
        const { lawyers, positions } = separateLawyerData(transformed);

        // 이동 감지
        const movementDetector = new MovementDetector(supabase);
        const movementResult = await movementDetector.detectMovements(firmName, valid);

        if (movementResult.movements.length > 0) {
          console.log(`📊 Detected movements for ${firmName}:`);
          console.log(`   - LEAVE: ${movementResult.leaves}`);
          console.log(`   - JOIN: ${movementResult.joins}`);
          console.log(`   - TRANSFER: ${movementResult.transfers}`);
        }

        // Supabase에 저장
        const { error: lawyersError } = await supabase
          .from('lawyers')
          .upsert(lawyers, {
            onConflict: 'sid',
            ignoreDuplicates: false
          });

        if (lawyersError) throw lawyersError;

        const { error: positionsError } = await supabase
          .from('lawyer_positions')
          .insert(positions);

        if (positionsError) throw positionsError;

        // 이동 기록 저장
        if (movementResult.movements.length > 0) {
          const { error: movementsError } = await supabase
            .from('movements')
            .insert(movementResult.movements);

          if (movementsError) throw movementsError;
        }

        // 퇴사자 is_current 플래그 업데이트
        if (movementResult.positionsToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from('lawyer_positions')
            .update({ is_current: false, end_date: scrapedAt })
            .in('id', movementResult.positionsToUpdate);

          if (updateError) throw updateError;
        }

        const duration = Date.now() - firmStartTime;

        results.push({
          firmName,
          success: true,
          scraped: {
            total: rawLawyers.length,
            valid: valid.length,
            invalid: invalid.length
          },
          saved: {
            lawyers: lawyers.length,
            positions: positions.length
          },
          duration
        });

        console.log(`✅ ${firmName}: ${lawyers.length} lawyers saved (${(duration / 1000).toFixed(1)}s)`);

        // Rate limiting between firms (2초 대기)
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        const duration = Date.now() - firmStartTime;

        results.push({
          firmName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        });

        console.error(`❌ ${firmName}: ${error instanceof Error ? error.message : error}`);
      }
    }

    await scraper.close();

    // 전체 통계
    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalScraped = results.reduce((sum, r) => sum + (r.scraped?.valid || 0), 0);

    console.log('\n' + '═'.repeat(60));
    console.log(`\n✅ Smart scraping complete!`);
    console.log(`   - Checked: ${MAJOR_FIRMS.length} firms`);
    console.log(`   - Changed: ${changedFirms.length} firms`);
    console.log(`   - Skipped: ${MAJOR_FIRMS.length - changedFirms.length} firms`);
    console.log(`   - Scraped successfully: ${successCount}/${changedFirms.length} changed firms`);
    console.log(`   - Total lawyers updated: ${totalScraped}`);
    console.log(`   - Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes\n`);

    return NextResponse.json({
      success: true,
      summary: {
        totalFirms: MAJOR_FIRMS.length,
        checkedCount: headcountChecks.length,
        changedCount: changedFirms.length,
        skippedCount: MAJOR_FIRMS.length - changedFirms.length,
        successCount,
        failureCount: changedFirms.length - successCount,
        totalLawyers: totalScraped,
        duration: totalDuration
      },
      headcountChecks,
      results
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);

    return NextResponse.json(
      {
        error: 'Scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        results
      },
      { status: 500 }
    );
  }
}

// Vercel Cron을 위한 GET 핸들러 (POST와 동일한 로직 실행)
export async function GET(request: NextRequest) {
  return POST(request);
}
