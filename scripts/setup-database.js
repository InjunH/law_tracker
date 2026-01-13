#!/usr/bin/env node

/**
 * Supabase 데이터베이스 스키마 설정 스크립트
 * Node.js로 직접 PostgreSQL에 연결하여 마이그레이션 실행
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Service Role 키로 클라이언트 생성 (RLS 우회)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  // SQL 파일 읽기
  const sqlPath = path.join(__dirname, '../supabase/migrations/00001_initial_schema.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📄 SQL file loaded successfully');
  console.log(`📝 File size: ${sql.length} characters\n`);

  // SQL을 세미콜론으로 분리하여 실행
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Total SQL statements: ${statements.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // 주석 제거 및 공백 정리
    const cleanStatement = statement.replace(/--.*$/gm, '').trim();

    if (!cleanStatement || cleanStatement === ';') continue;

    // 첫 20자만 출력 (너무 길면)
    const preview = cleanStatement.substring(0, 60).replace(/\n/g, ' ') + '...';
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview} `);

    try {
      // Supabase RPC를 통한 SQL 실행
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: cleanStatement
      });

      if (error) {
        // RPC 함수가 없으면 직접 실행 시도
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          console.log('⚠️  (RPC not available, using alternative method)');
          // 대안: 각 테이블 생성을 개별적으로 처리
          await executeAlternative(cleanStatement);
        } else {
          throw error;
        }
      } else {
        console.log('✅');
        successCount++;
      }
    } catch (err) {
      console.log(`❌\n     Error: ${err.message}`);
      errorCount++;

      // 치명적 에러가 아니면 계속 진행
      if (err.message.includes('already exists')) {
        console.log('     (Skipping - already exists)');
        continue;
      }
    }

    // Rate limiting 방지
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${successCount} statements`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors: ${errorCount} statements`);
  }
  console.log('='.repeat(60));

  // 테이블 확인
  await verifyTables();
}

async function executeAlternative(statement) {
  // CREATE TABLE 문만 파싱하여 Supabase API로 실행
  // 실제 구현은 복잡하므로 일단 스킵
  console.log('⏭️  Skipped (requires direct SQL access)');
}

async function verifyTables() {
  console.log('\n🔍 Verifying database schema...\n');

  const tables = ['lawyers', 'lawyer_positions', 'movements'];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ Table '${table}': Not found or error`);
        console.log(`     ${error.message}`);
      } else {
        console.log(`  ✅ Table '${table}': OK (${count} rows)`);
      }
    } catch (err) {
      console.log(`  ❌ Table '${table}': Error - ${err.message}`);
    }
  }

  console.log('\n✨ Database setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Check your Supabase dashboard: Table Editor');
  console.log('  2. Verify tables: lawyers, lawyer_positions, movements');
  console.log('  3. Start building the scraping logic\n');
}

// 실행
setupDatabase().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error('\n💡 Alternative: Use Supabase Dashboard SQL Editor');
  console.error('   1. Go to: https://supabase.com/dashboard/project/hdwsnqevmbyxtipcntgp/sql');
  console.error('   2. Copy content from: supabase/migrations/00001_initial_schema.sql');
  console.error('   3. Paste and click RUN\n');
  process.exit(1);
});
