#!/usr/bin/env node

/**
 * Headcount 체크 기능 테스트
 * 단일 로펌의 headcount만 빠르게 확인
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3200';

async function testHeadcountCheck() {
  console.log('🧪 Testing Headcount Check (Smart Scraping)\n');
  console.log('─'.repeat(60));
  console.log('📊 This will check all 13 firms without full scraping');
  console.log('⏱️  Expected duration: 1-2 minutes\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/scrape/all`, {}, {
      timeout: 300000 // 5 minutes
    });

    const { summary, headcountChecks, results } = response.data;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 Summary');
    console.log('─'.repeat(60));
    console.log(`   Total firms checked: ${summary.checkedCount}`);
    console.log(`   Firms with changes: ${summary.changedCount}`);
    console.log(`   Firms skipped: ${summary.skippedCount}`);
    console.log(`   Duration: ${(summary.duration / 1000).toFixed(1)}s\n`);

    console.log('📋 Headcount Details:');
    console.log('─'.repeat(60));
    headcountChecks.forEach(check => {
      const status = check.hasChanged ? '📈' : '✅';
      const change = check.difference !== 0
        ? ` (${check.difference > 0 ? '+' : ''}${check.difference})`
        : '';
      console.log(`${status} ${check.firmName}: ${check.currentCount}${change}`);
    });

    if (results.length > 0) {
      console.log('\n📦 Full Scrape Results:');
      console.log('─'.repeat(60));
      results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        if (result.success) {
          console.log(`${status} ${result.firmName}: ${result.saved.lawyers} lawyers saved`);
        } else {
          console.log(`${status} ${result.firmName}: ${result.error}`);
        }
      });
    }

    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

testHeadcountCheck();
