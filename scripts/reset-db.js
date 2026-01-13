#!/usr/bin/env node

/**
 * DB 초기화 스크립트
 * lawyers와 lawyer_positions 테이블의 모든 데이터 삭제
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 직접 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function resetDatabase() {
  console.log('🗑️  Starting database reset...\n');

  try {
    // 1. lawyer_positions 테이블 삭제
    console.log('🔄 Deleting lawyer_positions...');
    const { error: positionsError, count: positionsCount } = await supabase
      .from('lawyer_positions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제

    if (positionsError) {
      console.error('❌ Error deleting positions:', positionsError);
      throw positionsError;
    }
    console.log(`✅ Deleted ${positionsCount || 'all'} position records\n`);

    // 2. lawyers 테이블 삭제
    console.log('🔄 Deleting lawyers...');
    const { error: lawyersError, count: lawyersCount } = await supabase
      .from('lawyers')
      .delete()
      .neq('sid', ''); // 모든 행 삭제

    if (lawyersError) {
      console.error('❌ Error deleting lawyers:', lawyersError);
      throw lawyersError;
    }
    console.log(`✅ Deleted ${lawyersCount || 'all'} lawyer records\n`);

    console.log('🎉 Database reset complete!');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetDatabase();
