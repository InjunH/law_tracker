#!/usr/bin/env node

/**
 * Lawnb.com HTML 파싱 스크래퍼 테스트
 * Form Submit → HTML Parsing 방식
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testHTMLScraper() {
  console.log('🧪 Testing Lawnb.com HTML Scraper\n');

  const baseUrl = 'https://www.lawnb.com';

  // 1. axios 인스턴스 생성 (쿠키 관리)
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9'
    },
    maxRedirects: 5,
    validateStatus: () => true // 모든 상태 코드 허용
  });

  console.log('📍 Step 1: 검색 결과 페이지 로드 (GET 방식)');
  console.log('─'.repeat(60));

  try {
    // Query string으로 파라미터 전달 시도
    const response = await client.get('/Info/ContentLawyerList', {
      params: {
        sWork: '김앤장',
        sName: '',
        pageIndex: 1
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📍 Redirected to: ${response.request.path || response.config.url}`);

    // HTML 파싱
    const $ = cheerio.load(response.data);

    // 검색 결과 개수 추출
    const resultText = $('.result_top').text();
    console.log(`📊 Result: ${resultText.trim()}\n`);

    // 변호사 목록 추출
    const lawyers = [];
    $('.result_list > li').each((index, element) => {
      const $el = $(element);

      // 이름 및 한자명
      const nameText = $el.find('h3 a').text().trim();
      const nameMatch = nameText.match(/^(.+?)\((.+?)\)$/);

      // 프로필 URL
      const profileUrl = $el.find('h3 a').attr('href');
      const sidMatch = profileUrl?.match(/sid=([A-Z0-9]+)/);

      // 출생정보 파싱: "1978년생 / 여자 / 사법시험 47"
      const birthInfo = $el.find('.birth').text().trim();
      const birthMatch = birthInfo.match(/(\d{4})년생?\s*\/\s*(남자|여자)\s*\/\s*(.+)/);

      // 현직정보: "현직 : 변호사 / 김앤장 법률사무소"
      const currentInfo = $el.find('.current').text().trim();
      const currentMatch = currentInfo.match(/현직\s*:\s*(.+?)\s*\/\s*(.+)/);

      lawyers.push({
        sid: sidMatch ? sidMatch[1] : null,
        name: nameMatch ? nameMatch[1] : nameText,
        nameChina: nameMatch ? nameMatch[2] : null,
        birthYear: birthMatch ? parseInt(birthMatch[1]) : null,
        gender: birthMatch ? birthMatch[2] : null,
        examInfo: birthMatch ? birthMatch[3] : null,
        position: currentMatch ? currentMatch[1] : null,
        firmName: currentMatch ? currentMatch[2] : null,
        profileUrl: profileUrl
      });
    });

    console.log('📍 Step 2: 변호사 데이터 파싱');
    console.log('─'.repeat(60));
    console.log(`✅ Parsed ${lawyers.length} lawyers\n`);

    // 첫 5명 출력
    console.log('Sample data (첫 5명):');
    lawyers.slice(0, 5).forEach((lawyer, i) => {
      console.log(`\n[${i + 1}] ${lawyer.name} (${lawyer.nameChina || 'N/A'})`);
      console.log(`    SID: ${lawyer.sid}`);
      console.log(`    생년: ${lawyer.birthYear} / 성별: ${lawyer.gender}`);
      console.log(`    시험: ${lawyer.examInfo}`);
      console.log(`    현직: ${lawyer.position} / ${lawyer.firmName}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ HTML Scraping 성공!');
    console.log(`\n📊 Summary:`);
    console.log(`   - 총 파싱: ${lawyers.length}명`);
    console.log(`   - SID 있음: ${lawyers.filter(l => l.sid).length}명`);
    console.log(`   - 한자명 있음: ${lawyers.filter(l => l.nameChina).length}명\n`);

    console.log('💡 Next steps:');
    console.log('   1. 페이지네이션 구현 (63페이지)');
    console.log('   2. LawnbScraper 서비스 클래스 생성');
    console.log('   3. Supabase 저장 로직 구현\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
    }
  }
}

testHTMLScraper().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
