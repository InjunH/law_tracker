/**
 * 단일 로펌 스크래핑 API
 * POST /api/scrape
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LawnbScraper, ScrapingProgress } from '@/services/lawnbScraper';
import { transformLawyersData, separateLawyerData, filterValidLawyers } from '@/services/dataTransformer';

export async function POST(request: NextRequest) {
  // Supabase 클라이언트 생성 (런타임에만 실행)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const logs: string[] = [];

  try {
    const { firmName, maxPages } = await request.json();

    if (!firmName) {
      return NextResponse.json(
        { error: 'firmName is required' },
        { status: 400 }
      );
    }

    const log = (message: string) => {
      console.log(message);
      logs.push(message);
    };

    log(`🏢 Starting scrape for: ${firmName}`);

    // 1. 스크래핑 시작
    const scraper = new LawnbScraper();
    await scraper.init();
    log('✅ Browser initialized');

    const scrapedAt = new Date();
    const rawLawyers = await scraper.scrapeFirm(
      firmName,
      (progress: ScrapingProgress) => {
        const message = `📊 Page ${progress.currentPage}/${progress.totalPages} - ${progress.lawyersScraped} lawyers scraped`;
        log(message);
      },
      maxPages  // 테스트용 페이지 제한
    );

    await scraper.close();
    log('🔒 Browser closed');

    log(`✅ Scraped ${rawLawyers.length} lawyers from ${firmName}`);

    // 2. 데이터 유효성 검증
    log('🔍 Validating data...');
    const { valid, invalid } = filterValidLawyers(rawLawyers);

    if (invalid.length > 0) {
      log(`⚠️  ${invalid.length} invalid records found`);
      invalid.slice(0, 3).forEach(({ data, errors }) => {
        log(`   - ${data.name || 'Unknown'}: ${errors.join(', ')}`);
      });
    } else {
      log('✅ All records valid');
    }

    // 3. 데이터 변환
    log('🔄 Transforming data...');
    const transformed = transformLawyersData(valid, scrapedAt);
    const { lawyers, positions } = separateLawyerData(transformed);
    log(`✅ Transformed ${lawyers.length} lawyers`);

    // 4. Supabase에 저장
    log(`💾 Saving ${lawyers.length} lawyers to database...`);

    // Upsert lawyers (sid 기준으로 중복 제거)
    const { error: lawyersError } = await supabase
      .from('lawyers')
      .upsert(lawyers, {
        onConflict: 'sid',
        ignoreDuplicates: false
      });

    if (lawyersError) {
      log('❌ Error saving lawyers: ' + lawyersError.message);
      throw lawyersError;
    }
    log(`✅ Saved ${lawyers.length} lawyers to database`);

    // Insert positions (항상 새로운 레코드로 추가)
    const { error: positionsError } = await supabase
      .from('lawyer_positions')
      .insert(positions);

    if (positionsError) {
      log('❌ Error saving positions: ' + positionsError.message);
      throw positionsError;
    }
    log(`✅ Saved ${positions.length} positions to database`);

    log('🎉 Scraping complete!');

    // 5. 응답 반환
    return NextResponse.json({
      success: true,
      firmName,
      scraped: {
        total: rawLawyers.length,
        valid: valid.length,
        invalid: invalid.length
      },
      saved: {
        lawyers: lawyers.length,
        positions: positions.length
      },
      scrapedAt: scrapedAt.toISOString(),
      invalidSample: invalid.slice(0, 3).map(({ data, errors }) => ({
        name: data.name,
        errors
      })),
      logs
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Scraping error:', errorMessage);
    logs.push(`❌ Error: ${errorMessage}`);

    return NextResponse.json(
      {
        error: 'Scraping failed',
        message: errorMessage,
        logs
      },
      { status: 500 }
    );
  }
}
