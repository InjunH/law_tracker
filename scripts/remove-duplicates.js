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

async function removeDuplicates() {
  console.log('🧹 태평양 로펌 변호사 중복 제거 시작...\n');

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
    .order('lawyer_sid')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching positions:', error);
    return;
  }

  console.log(`📋 총 ${positions.length}건의 레코드를 찾았습니다.\n`);

  // lawyer_sid 기준으로 그룹화
  const sidGroups = {};

  positions.forEach(pos => {
    const sid = pos.lawyer_sid;
    if (!sidGroups[sid]) {
      sidGroups[sid] = [];
    }
    sidGroups[sid].push(pos);
  });

  // 중복된 레코드 찾기 (2개 이상인 것)
  const duplicates = Object.entries(sidGroups)
    .filter(([sid, records]) => records.length > 1);

  console.log(`🔍 중복된 변호사: ${duplicates.length}명`);
  console.log(`🗑️  삭제할 레코드: ${duplicates.reduce((sum, [_, records]) => sum + (records.length - 1), 0)}건\n`);

  if (duplicates.length === 0) {
    console.log('✅ 중복 없음!');
    return;
  }

  // 삭제할 position ID 수집
  const idsToDelete = [];

  duplicates.forEach(([sid, records]) => {
    // 첫 번째 레코드(가장 오래된 것)는 유지하고 나머지는 삭제
    const toDelete = records.slice(1);
    toDelete.forEach(rec => {
      idsToDelete.push(rec.id);
    });
  });

  console.log(`📊 삭제 대상: ${idsToDelete.length}건\n`);

  // 확인 메시지
  console.log('⚠️  다음 작업을 수행합니다:');
  console.log(`   - 각 lawyer_sid의 첫 번째 레코드는 유지`);
  console.log(`   - 나머지 ${idsToDelete.length}개의 중복 레코드는 삭제`);
  console.log('\n🚀 삭제 시작...\n');

  // 배치 삭제 (100개씩)
  const batchSize = 100;
  let deletedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);

    const { error: deleteError } = await supabase
      .from('lawyer_positions')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} 삭제 실패:`, deleteError);
      errorCount += batch.length;
    } else {
      deletedCount += batch.length;
      console.log(`✅ Progress: ${deletedCount}/${idsToDelete.length} 삭제 완료`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과:');
  console.log(`   ✅ 삭제 성공: ${deletedCount}건`);
  if (errorCount > 0) {
    console.log(`   ❌ 삭제 실패: ${errorCount}건`);
  }
  console.log('='.repeat(60));

  // 최종 확인
  console.log('\n🔍 최종 검증 중...\n');

  const { data: finalPositions } = await supabase
    .from('lawyer_positions')
    .select('lawyer_sid')
    .eq('firm_name', '태평양');

  const uniqueCount = new Set(finalPositions?.map(p => p.lawyer_sid)).size;

  console.log(`✅ 최종 결과:`);
  console.log(`   총 레코드: ${finalPositions?.length || 0}건`);
  console.log(`   고유 변호사: ${uniqueCount}명`);
  console.log(`   목표: 689명 (차이: ${Math.abs(uniqueCount - 689)}명)\n`);

  if (uniqueCount === 689) {
    console.log('🎉 완벽! 정확히 689명입니다!');
  } else if (uniqueCount < 689) {
    console.log(`⚠️  ${689 - uniqueCount}명이 부족합니다. 스크래핑을 다시 해야 할 수 있습니다.`);
  }
}

removeDuplicates().catch(console.error);
