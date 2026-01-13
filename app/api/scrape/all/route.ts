/**
 * 전체 로펌 스크래핑 API
 * POST /api/scrape/all
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LawnbScraper, ScrapingProgress } from '@/services/lawnbScraper';
import { transformLawyersData, separateLawyerData, filterValidLawyers } from '@/services/dataTransformer';

// Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 13개 주요 로펌 목록
const MAJOR_FIRMS = [
  '김앤장',
  '광장',
  '태평양',
  '율촌',
  '화우',
  '세종',
  '바른',
  '지평',
  '클라스',
  '동인',
  '원',
  '해담',
  '케이엘'
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
  const startTime = Date.now();
  const results: FirmScrapingResult[] = [];

  try {
    console.log('🚀 Starting full scrape for all major law firms\n');

    const scraper = new LawnbScraper();
    await scraper.init();

    for (const firmName of MAJOR_FIRMS) {
      const firmStartTime = Date.now();

      try {
        console.log(`\n🏢 Scraping: ${firmName}`);
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
    console.log(`\n✅ Scraping complete!`);
    console.log(`   - Success: ${successCount}/${MAJOR_FIRMS.length} firms`);
    console.log(`   - Total lawyers: ${totalScraped}`);
    console.log(`   - Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes\n`);

    return NextResponse.json({
      success: true,
      summary: {
        totalFirms: MAJOR_FIRMS.length,
        successCount,
        failureCount: MAJOR_FIRMS.length - successCount,
        totalLawyers: totalScraped,
        duration: totalDuration
      },
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
