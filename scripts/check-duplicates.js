const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경변수 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  console.log('태평양 로펌 변호사 중복 확인 중...\n');

  // 태평양 소속 변호사 position 데이터 가져오기
  const { data: positions, error } = await supabase
    .from('lawyer_positions')
    .select(`
      id,
      lawyer_sid,
      firm_name,
      is_current,
      created_at,
      lawyers:lawyer_sid (
        sid,
        name
      )
    `)
    .eq('firm_name', '태평양')
    .order('lawyer_sid');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const totalCount = positions.length;
  console.log(`✅ 태평양 총 포지션 레코드 수: ${totalCount}건`);
  console.log(`📋 예상 변호사 수: 689명`);
  console.log(`❌ 차이: ${totalCount - 689}건\n`);

  // is_current=true인 것만 필터링
  const currentPositions = positions.filter(p => p.is_current);
  console.log(`📌 현재 재직 중 (is_current=true): ${currentPositions.length}건\n`);

  // lawyer_sid 기준으로 그룹화 (중복 확인)
  const sidCounts = {};
  const sidRecords = {};

  positions.forEach(pos => {
    const sid = pos.lawyer_sid;
    if (!sidCounts[sid]) {
      sidCounts[sid] = 0;
      sidRecords[sid] = [];
    }
    sidCounts[sid]++;
    sidRecords[sid].push(pos);
  });

  // 중복된 lawyer_sid 찾기 (같은 변호사가 여러 번 등록됨)
  const duplicateSids = Object.entries(sidCounts)
    .filter(([sid, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  console.log('🔍 중복된 변호사 분석 (같은 lawyer_sid가 여러 번):');
  console.log(`총 중복된 변호사 수: ${duplicateSids.length}명`);

  if (duplicateSids.length > 0) {
    console.log('\n📊 상위 20개 중복:');
    duplicateSids.slice(0, 20).forEach(([sid, count]) => {
      const records = sidRecords[sid];
      const lawyerName = records[0].lawyers?.name || '알 수 없음';
      console.log(`  ${lawyerName} (SID: ${sid.substring(0, 8)}...): ${count}건`);

      // 각 레코드 상세 정보
      records.forEach((rec, idx) => {
        console.log(`    [${idx + 1}] Position ID: ${rec.id.substring(0, 8)}... | is_current: ${rec.is_current} | 생성일: ${rec.created_at}`);
      });
    });

    // 총 중복 레코드 수
    const totalDuplicates = duplicateSids.reduce((sum, [_, count]) => sum + (count - 1), 0);

    // 고유한 변호사 수 계산
    const uniqueLawyerCount = Object.keys(sidCounts).length;

    console.log(`\n📈 통계:`);
    console.log(`  총 포지션 레코드: ${totalCount}건`);
    console.log(`  중복 레코드 수: ${totalDuplicates}건`);
    console.log(`  실제 고유 변호사 수: ${uniqueLawyerCount}명`);
    console.log(`\n✅ 결과: ${uniqueLawyerCount}명 (목표: 689명, 차이: ${Math.abs(uniqueLawyerCount - 689)}명)`);

    if (uniqueLawyerCount === 689) {
      console.log('\n🎉 정확히 689명입니다! 중복 레코드만 제거하면 됩니다.');
    } else if (totalDuplicates > 0) {
      console.log(`\n⚠️  중복 레코드 ${totalDuplicates}건을 제거해야 합니다.`);
    }
  } else {
    console.log('\n✅ 중복 없음!');
    const uniqueLawyerCount = Object.keys(sidCounts).length;
    console.log(`실제 고유 변호사 수: ${uniqueLawyerCount}명`);
  }
}

checkDuplicates().catch(console.error);
