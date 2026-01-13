#!/usr/bin/env node

/**
 * Lawnb.com 세션 기반 스크래핑 테스트
 * 실제 브라우저 흐름을 완전히 재현
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function testSessionFlow() {
  console.log('🔐 Testing Session-Based Scraping\n');

  const baseUrl = 'https://www.lawnb.com';

  // 쿠키 자동 관리
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    baseURL: baseUrl,
    jar,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  }));

  try {
    // Step 1: 세션 초기화
    console.log('📍 Step 1: Initialize Session');
    console.log('─'.repeat(60));

    const sessionResp = await client.post('/Login/SessionPlus/');
    console.log(`✅ Session: ${sessionResp.status}`);

    // 쿠키 확인
    const cookies = await jar.getCookies(baseUrl);
    console.log(`🍪 Cookies: ${cookies.length} received`);
    cookies.forEach(c => console.log(`   - ${c.key}=${c.value.substring(0, 20)}...`));
    console.log('');

    // Step 2: 메인 페이지 방문
    console.log('📍 Step 2: Visit Main Page');
    console.log('─'.repeat(60));

    const mainResp = await client.get('/Info/ContentMain/Lawyer');
    console.log(`✅ Main Page: ${mainResp.status}`);
    console.log('');

    // Step 3: 검색 폼 제출 (POST)
    console.log('📍 Step 3: Submit Search Form');
    console.log('─'.repeat(60));

    const formData = new URLSearchParams();
    formData.append('sWork', '김앤장');
    formData.append('sName', '');
    formData.append('sGrade', '');
    formData.append('sArea', '');

    const searchResp = await client.post('/Info/ContentMain/Lawyer', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.lawnb.com/Info/ContentMain/Lawyer',
        'Origin': 'https://www.lawnb.com'
      },
      maxRedirects: 5
    });

    console.log(`✅ Search Submit: ${searchResp.status}`);
    console.log(`📍 Final URL: ${searchResp.request.path || searchResp.config.url}`);
    console.log('');

    // Step 4: HTML 파싱
    console.log('📍 Step 4: Parse Results');
    console.log('─'.repeat(60));

    const $ = cheerio.load(searchResp.data);

    // 결과 개수
    const resultText = $('.result_top, .search_result').first().text().trim();
    console.log(`📊 ${resultText || 'No result count found'}`);

    // 변호사 목록
    const lawyers = [];
    $('.result_list > li, .list_item').each((_, el) => {
      const $el = $(el);
      const nameText = $el.find('h3 a, .name a').text().trim();
      const profileUrl = $el.find('h3 a, .name a').attr('href');
      const birthInfo = $el.find('.birth, .info_text').text().trim();
      const currentInfo = $el.find('.current, .firm_info').text().trim();

      if (nameText) {
        const nameMatch = nameText.match(/^(.+?)\((.+?)\)$/);
        const sidMatch = profileUrl?.match(/sid=([A-Z0-9]+)/);

        lawyers.push({
          name: nameMatch ? nameMatch[1] : nameText,
          nameChina: nameMatch ? nameMatch[2] : null,
          sid: sidMatch ? sidMatch[1] : null,
          birthInfo,
          currentInfo,
          profileUrl
        });
      }
    });

    console.log(`✅ Parsed: ${lawyers.length} lawyers\n`);

    if (lawyers.length > 0) {
      console.log('Sample (첫 3명):');
      lawyers.slice(0, 3).forEach((l, i) => {
        console.log(`\n[${i + 1}] ${l.name} (${l.nameChina || 'N/A'})`);
        console.log(`    SID: ${l.sid || 'N/A'}`);
        console.log(`    Info: ${l.birthInfo}`);
        console.log(`    Firm: ${l.currentInfo}`);
      });
    } else {
      console.log('⚠️  No lawyers found. HTML structure may differ.');
      console.log('\nDebugging - Page title:', $('title').text());
      console.log('Debugging - H1:', $('h1').text());
      console.log('Debugging - Body classes:', $('body').attr('class'));
    }

    console.log('\n' + '═'.repeat(60));
    console.log(lawyers.length > 0 ? '\n✅ Success!' : '\n⚠️  Needs debugging');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

testSessionFlow().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
