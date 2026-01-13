#!/usr/bin/env node

/**
 * Lawnb.com AJAX API 테스트 스크립트
 * axios로 직접 API를 호출하여 파라미터와 응답 구조 확인
 */

const axios = require('axios');

async function testLawnbAPI() {
  console.log('🧪 Testing Lawnb.com AJAX API\n');

  const baseUrl = 'https://www.lawnb.com';

  // Step 0: Initialize session
  console.log('📍 Step 0: Initialize session (SessionPlus)');
  console.log('─'.repeat(60));

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  try {
    const sessionResponse = await axiosInstance.post('/Login/SessionPlus/');
    console.log(`✅ Session initialized: ${sessionResponse.status}\n`);
  } catch (error) {
    console.log(`⚠️  Session init warning: ${error.message}\n`);
  }

  // Test 1: ContentBottomList (검색 결과 목록)
  console.log('📍 Test 1: POST /AjaxInfo/ContentBottomList');
  console.log('─'.repeat(60));

  try {
    const params1 = new URLSearchParams();
    params1.append('sWork', '김앤장');

    const response1 = await axiosInstance.post('/AjaxInfo/ContentBottomList', params1, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    console.log(`✅ Status: ${response1.status}`);
    console.log(`📦 Response type: ${typeof response1.data}`);
    console.log(`📏 Response length: ${JSON.stringify(response1.data).length} chars\n`);
    console.log('Sample data:');
    console.log(JSON.stringify(response1.data, null, 2).substring(0, 500));
    console.log('\n');

  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 2: ContentLawyerList (변호사 목록)
  console.log('📍 Test 2: POST /AjaxInfo/ContentLawyerList');
  console.log('─'.repeat(60));

  try {
    const params2 = new URLSearchParams();
    params2.append('sWork', '김앤장');
    params2.append('pageIndex', '1');
    params2.append('sName', '');
    params2.append('sBirth', '');
    params2.append('sKindexam', '');
    params2.append('sNumexam', '');
    params2.append('sGender', '');

    const response2 = await axiosInstance.post('/AjaxInfo/ContentLawyerList', params2, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    console.log(`✅ Status: ${response2.status}`);
    console.log(`📦 Response type: ${typeof response2.data}`);
    console.log(`📏 Response length: ${JSON.stringify(response2.data).length} chars\n`);
    console.log('Sample data:');
    console.log(JSON.stringify(response2.data, null, 2).substring(0, 1000));
    console.log('\n');

  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  console.log('═'.repeat(60));
  console.log('\n✨ Test complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Parse the JSON response structure');
  console.log('   2. Extract lawyer data fields');
  console.log('   3. Implement LawnbScraper service\n');
}

testLawnbAPI().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
