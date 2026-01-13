import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPositions() {
  console.log('📊 Checking lawyer_positions table...\n');

  // 1. 총 레코드 수
  const { count } = await supabase
    .from('lawyer_positions')
    .select('*', { count: 'exact', head: true });

  console.log(`Total records: ${count}\n`);

  // 2. 샘플 데이터 (최근 5개)
  const { data: samples } = await supabase
    .from('lawyer_positions')
    .select(`
      id,
      lawyer_sid,
      firm_name,
      position_title,
      start_date,
      end_date,
      is_current,
      scraped_at,
      lawyers:lawyer_sid (name, name_chinese)
    `)
    .order('scraped_at', { ascending: false })
    .limit(5);

  console.log('📝 Sample records (latest 5):');
  samples?.forEach(item => {
    console.log(`  - ${item.lawyers?.name} @ ${item.firm_name}`);
    console.log(`    position: ${item.position_title || 'N/A'}`);
    console.log(`    is_current: ${item.is_current}`);
    console.log(`    scraped_at: ${item.scraped_at}`);
    console.log('');
  });

  // 3. 로펌별 통계
  const { data: stats } = await supabase
    .from('lawyer_positions')
    .select('firm_name')
    .eq('is_current', true);

  const firmStats = {};
  stats?.forEach(item => {
    firmStats[item.firm_name] = (firmStats[item.firm_name] || 0) + 1;
  });

  console.log('\n📊 Current positions by firm:');
  Object.entries(firmStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([firm, count]) => {
      console.log(`  ${firm}: ${count}명`);
    });

  // 4. 데이터 구조 샘플
  console.log('\n📝 Full data structure:');
  console.log(JSON.stringify(samples?.[0], null, 2));
}

checkPositions().catch(console.error);
