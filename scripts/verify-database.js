#!/usr/bin/env node

/**
 * Supabase 데이터베이스 스키마 검증 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 직접 읽기
const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase Database Schema\n');
  console.log('='.repeat(60));

  const tables = [
    { name: 'lawyers', description: '변호사 기본 정보' },
    { name: 'lawyer_positions', description: '변호사 이력' },
    { name: 'movements', description: '이동 감지 기록' }
  ];

  let allSuccess = true;

  // 테이블 확인
  console.log('\n📊 Tables:\n');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${table.name.padEnd(20)} - Error: ${error.message}`);
        allSuccess = false;
      } else {
        console.log(`  ✅ ${table.name.padEnd(20)} - OK (${count || 0} rows) - ${table.description}`);
      }
    } catch (err) {
      console.log(`  ❌ ${table.name.padEnd(20)} - ${err.message}`);
      allSuccess = false;
    }
  }

  // 뷰 확인
  console.log('\n👁️  Views:\n');
  const views = [
    { name: 'current_lawyers', description: '현재 활동 중인 변호사' },
    { name: 'recent_movements', description: '최근 30일 이동 내역' },
    { name: 'firm_headcount', description: '법인별 인원수' }
  ];

  for (const view of views) {
    try {
      const { count, error } = await supabase
        .from(view.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${view.name.padEnd(20)} - Error: ${error.message}`);
        allSuccess = false;
      } else {
        console.log(`  ✅ ${view.name.padEnd(20)} - OK (${count || 0} rows) - ${view.description}`);
      }
    } catch (err) {
      console.log(`  ❌ ${view.name.padEnd(20)} - ${err.message}`);
      allSuccess = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allSuccess) {
    console.log('\n✨ Database schema verification successful!\n');
    console.log('Next steps:');
    console.log('  1. ✅ Supabase database setup complete');
    console.log('  2. 🚀 Ready to implement scraping logic');
    console.log('  3. 📝 Create API routes for data collection\n');
  } else {
    console.log('\n⚠️  Some issues detected. Please check the errors above.\n');
  }
}

verifyDatabase().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});
