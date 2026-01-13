#!/usr/bin/env node

/**
 * Lawnb.com AJAX API 분석 스크립트
 * Playwright로 네트워크 요청을 캡처하여 AJAX 엔드포인트를 분석합니다
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeLawnbAPI() {
  console.log('🔍 Starting Lawnb.com API analysis...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 네트워크 요청 캡처
  const requests = [];
  const responses = [];

  page.on('request', request => {
    if (request.url().includes('lawnb.com')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('Ajax') || response.url().includes('List')) {
      try {
        const body = await response.text();
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: body.substring(0, 1000) // 처음 1000자만
        });
      } catch (err) {
        // 바이너리 응답은 무시
      }
    }
  });

  // 1. 메인 페이지 로드
  console.log('📄 Loading main page...');
  await page.goto('https://www.lawnb.com/Info/ContentMain/Lawyer');
  await page.waitForLoadState('networkidle');

  // 2. 검색 폼 찾기
  console.log('🔎 Finding search form...');
  await page.waitForSelector('#sWork', { timeout: 10000 });

  // 3. "김앤장" 검색
  console.log('⌨️  Typing "김앤장"...');
  await page.fill('#sWork', '김앤장');

  //4. 검색 버튼 클릭
  console.log('🖱️  Clicking search button...');
  await page.click('button:has-text("검색")');

  // 5. 결과 로드 대기
  console.log('⏳ Waiting for results...');
  await page.waitForTimeout(3000);

  // 6. AJAX 요청 찾기
  console.log('\n📊 Analyzing captured requests...\n');

  const ajaxRequests = requests.filter(req =>
    req.url().includes('Ajax') || req.url().includes('List')
  );

  console.log(`Found ${ajaxRequests.length} AJAX requests:`);
  ajaxRequests.forEach((req, index) => {
    console.log(`\n[${index + 1}] ${req.method} ${req.url}`);
    if (req.postData) {
      console.log(`   POST Data: ${req.postData.substring(0, 200)}`);
    }
  });

  // 7. 응답 분석
  console.log('\n\n📥 Analyzing responses...\n');
  const ajaxResponses = responses.filter(res =>
    res.url.includes('Ajax') || res.url.includes('List')
  );

  console.log(`Found ${ajaxResponses.length} AJAX responses:`);
  ajaxResponses.forEach((res, index) => {
    console.log(`\n[${index + 1}] ${res.status} ${res.url}`);
    console.log(`   Body preview: ${res.body.substring(0, 200)}...`);
  });

  // 8. 결과 저장
  const output = {
    timestamp: new Date().toISOString(),
    searchTerm: '김앤장',
    requests: ajaxRequests,
    responses: ajaxResponses.map(r => ({
      ...r,
      body: r.body.substring(0, 500) // 저장 시에는 500자만
    }))
  };

  const outputPath = path.join(__dirname, '../claudedocs/lawnb-api-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n\n✅ Analysis complete!`);
  console.log(`📁 Results saved to: ${outputPath}`);

  // 9. 브라우저 종료
  await page.waitForTimeout(2000);
  await browser.close();

  // 10. 분석 요약 출력
  console.log('\n' + '='.repeat(60));
  console.log('📋 Summary:');
  console.log('='.repeat(60));
  console.log(`Total AJAX requests: ${ajaxRequests.length}`);
  console.log(`Total AJAX responses: ${ajaxResponses.length}`);

  if (ajaxRequests.length > 0) {
    console.log('\n🎯 Primary API Endpoint:');
    const mainRequest = ajaxRequests[0];
    console.log(`   URL: ${mainRequest.url}`);
    console.log(`   Method: ${mainRequest.method}`);

    if (mainRequest.postData) {
      console.log('\n   POST Parameters:');
      try {
        const params = new URLSearchParams(mainRequest.postData);
        for (const [key, value] of params.entries()) {
          console.log(`     - ${key}: ${value}`);
        }
      } catch (err) {
        console.log(`     Raw: ${mainRequest.postData}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Next steps:');
  console.log('   1. Review the JSON file for detailed request/response data');
  console.log('   2. Implement axios-based scraper using the discovered endpoint');
  console.log('   3. Test with different search terms\n');
}

// 실행
analyzeLawnbAPI().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
