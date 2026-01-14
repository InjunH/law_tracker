#!/usr/bin/env node

/**
 * 전체 로펌 스크래핑 스크립트
 * GitHub Actions Cron용 독립 실행 스크립트
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { LawnbScraper } = require('../services/lawnbScraper');
const { transformLawyersData, separateLawyerData, filterValidLawyers } = require('../services/dataTransformer');
const { HeadcountChecker } = require('../services/headcountChecker');
const { MovementDetector } = require('../services/movementDetector');

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

async function scrapeAllFirms() {
  // 환경변수 확인
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const startTime = Date.now();
  const results = [];
  let headcountChecks = [];
  let changedFirms = [];

  try {
    console.log('🚀 Starting smart scrape for all major law firms\n');
    console.log('📊 Phase 1: Headcount Check (fast)\n');

    const scraper = new LawnbScraper();
    await scraper.init();

    const headcountChecker = new HeadcountChecker(supabase);

    // Phase 1: 빠른 headcount 체크
    for (const firmName of MAJOR_FIRMS) {
      try {
        console.log(`🔍 Checking ${firmName}...`);
        const currentCount = await scraper.checkHeadcount(firmName);
        const comparison = await headcountChecker.compareHeadcount(firmName, currentCount);
        headcountChecker.logComparison(comparison);
        headcountChecks.push(comparison);

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Headcount check failed for ${firmName}:`, error.message);
        headcountChecks.push({
          firmName,
          currentCount: 0,
          previousCount: 0,
          hasChanged: true,
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

      console.log('\n' + '═'.repeat(60));
      console.log('✅ Smart scraping complete! No changes detected.');
      console.log(`   Duration: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutes\n`);
      return;
    }

    console.log(`\n🏢 Phase 2: Full Scrape (${changedFirms.length} firms with changes)\n`);

    for (const comparison of changedFirms) {
      const firmName = comparison.firmName;
      const firmStartTime = Date.now();

      try {
        console.log(`\n🏢 Scraping: ${firmName} (${comparison.difference > 0 ? '+' : ''}${comparison.difference})`);
        console.log('─'.repeat(60));

        const scrapedAt = new Date();
        const rawLawyers = await scraper.scrapeFirm(firmName, (progress) => {
          console.log(
            `   Page ${progress.currentPage}/${progress.totalPages} - ` +
            `${progress.lawyersScraped} lawyers`
          );
        });

        const { valid, invalid } = filterValidLawyers(rawLawyers);

        if (invalid.length > 0) {
          console.warn(`⚠️  ${invalid.length} invalid records`);
        }

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

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        const duration = Date.now() - firmStartTime;

        results.push({
          firmName,
          success: false,
          error: error.message,
          duration
        });

        console.error(`❌ ${firmName}: ${error.message}`);
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

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

scrapeAllFirms().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
