#!/usr/bin/env node

/**
 * API 테스트 스크립트
 * 로컬 Next.js 서버에서 스크래핑 API 테스트
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3200';

async function testSingleFirmScrape(firmName = '김앤장', maxPages = undefined) {
  console.log('🧪 Testing Single Firm Scrape API\n');
  console.log('─'.repeat(60));

  try {
    const response = await axios.post(`${BASE_URL}/api/scrape`, {
      firmName,
      maxPages  // undefined면 전체 페이지 스크래핑
    }, {
      timeout: 300000 // 5 minutes
    });

    const { scraped, saved, logs } = response.data;

    console.log('\n📋 Execution Logs:');
    console.log('─'.repeat(60));
    logs.forEach(log => console.log(log));

    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Total scraped: ${scraped.total}`);
    console.log(`   - Valid: ${scraped.valid}`);
    console.log(`   - Invalid: ${scraped.invalid}`);
    console.log(`   - Lawyers saved: ${saved.lawyers}`);
    console.log(`   - Positions saved: ${saved.positions}\n`);

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);

      if (error.response.data.logs) {
        console.log('\n📋 Execution Logs:');
        console.log('─'.repeat(60));
        error.response.data.logs.forEach(log => console.log(log));
      }

      console.error(`\n   Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

async function testAllFirmsScrape() {
  console.log('🧪 Testing All Firms Scrape API\n');
  console.log('─'.repeat(60));
  console.log('⚠️  This will take approximately 30-60 minutes\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/scrape/all`, {}, {
      timeout: 3600000 // 1 hour
    });

    console.log('✅ Response received:\n');
    console.log(JSON.stringify(response.data.summary, null, 2));

    console.log('\n📋 Individual Results:');
    console.log('─'.repeat(60));

    response.data.results.forEach((result) => {
      const status = result.success ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(1);

      if (result.success) {
        console.log(`${status} ${result.firmName}: ${result.saved.lawyers} lawyers (${duration}s)`);
      } else {
        console.log(`${status} ${result.firmName}: ${result.error} (${duration}s)`);
      }
    });

    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Success: ${response.data.summary.successCount}/${response.data.summary.totalFirms}`);
    console.log(`   - Total lawyers: ${response.data.summary.totalLawyers}`);
    console.log(`   - Duration: ${(response.data.summary.duration / 1000 / 60).toFixed(1)} minutes\n`);

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);

      if (error.response.data.logs) {
        console.log('\n📋 Execution Logs:');
        console.log('─'.repeat(60));
        error.response.data.logs.forEach(log => console.log(log));
      }

      console.error(`\n   Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'single';
  const firmName = args[1];
  const maxPages = args[2] ? parseInt(args[2]) : undefined;

  console.log('🚀 Lawnb API Test Suite');
  console.log(`📍 Server: ${BASE_URL}\n`);

  if (testType === 'single') {
    await testSingleFirmScrape(firmName, maxPages);
  } else if (testType === 'all') {
    await testAllFirmsScrape();
  } else {
    console.error('❌ Invalid test type. Use "single" or "all"');
    console.log('\nUsage:');
    console.log('  node scripts/test-api.js single [firmName] [maxPages]  # Test single firm');
    console.log('  node scripts/test-api.js single 세종                    # Test 세종 (all pages)');
    console.log('  node scripts/test-api.js single 김앤장 2                # Test 김앤장 (2 pages only)');
    console.log('  node scripts/test-api.js all                           # Test all 13 firms\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
