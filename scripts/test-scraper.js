#!/usr/bin/env node

/**
 * Lawnb Scraper 테스트
 * Puppeteer 기반 스크래핑 검증
 */

const { LawnbScraper } = require('../services/lawnbScraper');

async function testScraper() {
  console.log('🧪 Testing Lawnb Scraper with Puppeteer\n');

  const scraper = new LawnbScraper();

  try {
    // 브라우저 초기화
    console.log('📍 Step 1: Initialize Browser');
    console.log('─'.repeat(60));
    await scraper.init();
    console.log('✅ Browser initialized\n');

    // 김앤장 로펌 스크래핑 (테스트를 위해 1페이지만)
    console.log('📍 Step 2: Scrape 김앤장 Law Firm (1 page for testing)');
    console.log('─'.repeat(60));

    const lawyers = await scraper.scrapeFirm('김앤장', (progress) => {
      console.log(
        `📊 Progress: Page ${progress.currentPage}/${progress.totalPages} - ` +
        `${progress.lawyersScraped} lawyers scraped`
      );
    });

    console.log('\n' + '═'.repeat(60));
    console.log(`\n✅ Scraping Complete!`);
    console.log(`📊 Total lawyers scraped: ${lawyers.length}\n`);

    // 샘플 데이터 출력 (첫 5명)
    console.log('Sample data (첫 5명):');
    lawyers.slice(0, 5).forEach((lawyer, i) => {
      console.log(`\n[${i + 1}] ${lawyer.name} (${lawyer.nameChina || 'N/A'})`);
      console.log(`    SID: ${lawyer.sid}`);
      console.log(`    생년: ${lawyer.birthYear} / 성별: ${lawyer.gender}`);
      console.log(`    시험: ${lawyer.examType} ${lawyer.examNumber || ''}`);
      console.log(`    현직: ${lawyer.position} / ${lawyer.firmName}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('\n📈 Statistics:');
    console.log(`   - 총 변호사: ${lawyers.length}명`);
    console.log(`   - SID 있음: ${lawyers.filter(l => l.sid).length}명`);
    console.log(`   - 한자명 있음: ${lawyers.filter(l => l.nameChina).length}명`);
    console.log(`   - 생년 있음: ${lawyers.filter(l => l.birthYear).length}명`);
    console.log(`   - 성별 있음: ${lawyers.filter(l => l.gender).length}명`);
    console.log(`   - 시험정보 있음: ${lawyers.filter(l => l.examType).length}명\n`);

    console.log('💡 Next steps:');
    console.log('   1. ✅ Puppeteer 스크래핑 동작 확인');
    console.log('   2. 데이터 변환 유틸리티 구현 (dataTransformer.ts)');
    console.log('   3. Supabase 저장 로직 구현');
    console.log('   4. 이동 감지 알고리즘 구현 (movementDetector.ts)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // 브라우저 종료
    await scraper.close();
    console.log('🔒 Browser closed');
  }
}

testScraper().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
