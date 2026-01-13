#!/usr/bin/env node

/**
 * 정확한 폼 구조로 POST 요청
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testCorrectForm() {
  console.log('📮 Testing Correct Form Submission\n');

  const client = axios.create({
    baseURL: 'https://www.lawnb.com',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9'
    },
    maxRedirects: 5
  });

  try {
    // 모든 필드 포함 (hidden 필드도 모두)
    const formData = new URLSearchParams();
    formData.append('sPage', '1');
    formData.append('sList', '');
    formData.append('sCode', '');
    formData.append('sType', '');
    formData.append('sJobCode', '');
    formData.append('sTestCode', '');
    formData.append('sCat', '');
    formData.append('sTestS', '');
    formData.append('sTestE', '');
    formData.append('sTrainS', '');
    formData.append('sTrainE', '');
    formData.append('sBirthS', '');
    formData.append('sBirthE', '');
    formData.append('sName', '');
    formData.append('sWork', '김앤장');  // ← 검색어
    formData.append('sJob', '');
    formData.append('sWorkArea', '');
    formData.append('sTest', '');
    formData.append('cTestS', '');
    formData.append('cTestE', '');
    formData.append('cTrainS', '');
    formData.append('cTrainE', '');
    formData.append('sHighCode', '');
    formData.append('sHigh', '');
    formData.append('sHighS', '');
    formData.append('sHighE', '');
    formData.append('sUnivCode', '');
    formData.append('sUniv', '');
    formData.append('sUnivS', '');
    formData.append('sUnivE', '');
    formData.append('sLawSchCode', '');
    formData.append('sLawSch', '');
    formData.append('sLawSchS', '');
    formData.append('sLawSchE', '');
    formData.append('sCareerList', '');
    formData.append('cBirthS', '');
    formData.append('cBirthE', '');

    console.log('📍 Submitting form to /Info/ContentLawyerList');
    console.log('─'.repeat(60));

    const response = await client.post('/Info/ContentLawyerList', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.lawnb.com/Info/ContentMain/Lawyer',
        'Origin': 'https://www.lawnb.com'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📍 URL: ${response.request.path || response.config.url}\n`);

    // HTML 파싱
    const $ = cheerio.load(response.data);

    // 검색 결과 확인
    const resultText = $('.result_top').text().trim();
    console.log(`📊 Result: ${resultText}`);

    // 변호사 목록 파싱
    const lawyers = [];
    $('.result_list > li').each((_, el) => {
      const $el = $(el);
      const nameText = $el.find('h3 a').text().trim();
      const profileUrl = $el.find('h3 a').attr('href');

      if (nameText) {
        const nameMatch = nameText.match(/^(.+?)\((.+?)\)$/);
        const sidMatch = profileUrl?.match(/sid=([A-Z0-9]+)/);

        lawyers.push({
          name: nameMatch ? nameMatch[1] : nameText,
          nameChina: nameMatch ? nameMatch[2] : null,
          sid: sidMatch ? sidMatch[1] : null
        });
      }
    });

    console.log(`✅ Parsed: ${lawyers.length} lawyers\n`);

    if (lawyers.length > 0) {
      console.log('✨ Success! Sample:');
      lawyers.slice(0, 3).forEach((l, i) => {
        console.log(`  ${i + 1}. ${l.name} (${l.nameChina}) - ${l.sid}`);
      });
    } else {
      console.log('⚠️  No results. Debugging...');
      console.log(`Page title: ${$('title').text()}`);
      console.log(`Body text preview: ${$('body').text().substring(0, 200).trim()}...`);
    }

    console.log('\n' + '═'.repeat(60));

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

testCorrectForm();
