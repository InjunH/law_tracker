#!/usr/bin/env node

/**
 * 검색 폼 구조 분석
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function inspectForm() {
  console.log('🔍 Inspecting Search Form Structure\n');

  try {
    const response = await axios.get('https://www.lawnb.com/Info/ContentMain/Lawyer');
    const $ = cheerio.load(response.data);

    // 모든 form 찾기
    console.log(`Total forms found: ${$('form').length}\n`);

    $('form').each((i, form) => {
      const $form = $(form);
      console.log(`\n📋 Form ${i + 1}:`);
      console.log('─'.repeat(60));
      console.log(`Action: ${$form.attr('action') || 'N/A'}`);
      console.log(`Method: ${$form.attr('method') || 'N/A'}`);
      console.log(`ID: ${$form.attr('id') || 'N/A'}`);
      console.log(`Class: ${$form.attr('class') || 'N/A'}`);

      // input 개수
      const inputs = $form.find('input').length;
      console.log(`Inputs: ${inputs}`);

      // sWork 필드가 있는지 확인
      const hasSWork = $form.find('#sWork, input[name="sWork"]').length > 0;
      if (hasSWork) {
        console.log('✅ THIS IS THE LAWYER SEARCH FORM!');
      }
    });

    // 변호사 검색 폼 (sWork 필드가 있는 폼)
    const $lawyerForm = $('form').has('#sWork, input[name="sWork"]').first();

    console.log('\n\n📋 Lawyer Search Form Details:');
    console.log('─'.repeat(60));
    console.log(`Action: ${$lawyerForm.attr('action') || 'N/A'}`);
    console.log(`Method: ${$lawyerForm.attr('method') || 'N/A'}`);
    console.log(`ID: ${$lawyerForm.attr('id') || 'N/A'}`);
    console.log('');

    // 모든 input 필드
    console.log('📝 Form Fields:');
    console.log('─'.repeat(60));

    $lawyerForm.find('input, select').each((_, el) => {
      const $el = $(el);
      const type = $el.attr('type') || $el.prop('tagName').toLowerCase();
      const name = $el.attr('name');
      const id = $el.attr('id');

      if (name) {
        console.log(`${name.padEnd(20)} | ${type.padEnd(10)} | ${id || '-'}`);
      }
    });

    console.log('\n' + '═'.repeat(60));

    // 검색 버튼
    const $button = $lawyerForm.find('button[type="submit"], button:contains("검색")');
    console.log('\n🔘 Submit Button:');
    console.log(`Text: ${$button.text().trim()}`);
    console.log(`Type: ${$button.attr('type')}`);
    console.log(`OnClick: ${$button.attr('onclick') || 'N/A'}`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

inspectForm();
