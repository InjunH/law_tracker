# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

### 1.1 계정 생성 및 프로젝트 시작
1. [Supabase](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 또는 이메일로 가입
4. "New Project" 클릭

### 1.2 프로젝트 정보 입력
```
Name: law-tracker (또는 원하는 이름)
Database Password: 강력한 비밀번호 생성 (잘 기록해두세요!)
Region: Northeast Asia (Seoul) 선택 (한국 서버)
Pricing Plan: Free (시작용)
```

5. "Create new project" 클릭 → 약 2분 대기

## 2. 환경 변수 설정

### 2.1 Supabase API 키 확인
프로젝트 대시보드에서:
1. 좌측 메뉴 **Settings** (⚙️) 클릭
2. **API** 클릭
3. 다음 정보 복사:
   - **Project URL** (예: `https://abcdefgh.supabase.co`)
   - **anon public** 키 (예: `eyJhbGciOi...`)

### 2.2 .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용 입력:

```env
# Google Gemini API (이미 설정되어 있으면 유지)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**중요**:
- `your-project-id`를 실제 프로젝트 URL로 교체
- `your_anon_key_here`를 실제 anon public 키로 교체

## 3. 데이터베이스 스키마 실행

### 3.1 SQL Editor 접속
1. Supabase 대시보드 좌측 메뉴에서 **SQL Editor** 클릭
2. "New query" 클릭

### 3.2 스키마 실행
1. [supabase/migrations/00001_initial_schema.sql](../supabase/migrations/00001_initial_schema.sql) 파일 내용 전체 복사
2. SQL Editor에 붙여넣기
3. 우측 하단 **RUN** 버튼 클릭 (또는 Cmd/Ctrl + Enter)

### 3.3 실행 결과 확인
성공 메시지가 나타나면:
```
Success. No rows returned
```

## 4. 테이블 확인

### 4.1 Table Editor에서 확인
1. 좌측 메뉴 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `lawyers` (변호사 기본 정보)
   - ✅ `lawyer_positions` (변호사 이력)
   - ✅ `movements` (이동 감지 기록)

### 4.2 뷰(Views) 확인
1. 좌측 메뉴 **Database** → **Views** 클릭
2. 다음 뷰들이 생성되었는지 확인:
   - ✅ `current_lawyers` (현재 활동 중인 변호사)
   - ✅ `recent_movements` (최근 30일 이동 내역)
   - ✅ `firm_headcount` (법인별 인원수)

## 5. 로컬 개발 서버 재시작

환경 변수 변경사항을 반영하기 위해:

```bash
# 개발 서버가 실행 중이면 중지 (Ctrl + C)
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속하여 정상 작동 확인

## 6. 데이터베이스 구조

### 6.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│    lawyers      │ (마스터 테이블)
├─────────────────┤
│ id (UUID) PK    │
│ sid (unique)    │ ← Lawnb.com 고유 ID
│ name            │
│ name_chinese    │
│ birth_year      │
│ gender          │
│ exam_type       │
│ exam_number     │
│ profile_url     │
│ created_at      │
│ updated_at      │
└─────────────────┘
        ↓ 1:N
┌─────────────────────┐
│ lawyer_positions    │ (이력 테이블)
├─────────────────────┤
│ id (UUID) PK        │
│ lawyer_sid FK       │ → lawyers.sid
│ firm_name           │
│ position_title      │
│ start_date          │
│ end_date            │
│ is_current (bool)   │ ← 현재 재직 여부
│ scraped_at          │
│ created_at          │
└─────────────────────┘
        ↓ 이동 감지 시
┌─────────────────────┐
│    movements        │ (이동 이벤트 테이블)
├─────────────────────┤
│ id (UUID) PK        │
│ lawyer_sid FK       │ → lawyers.sid
│ lawyer_name         │
│ from_firm           │
│ to_firm             │
│ movement_type       │ ← 'join'|'leave'|'transfer'
│ detected_at         │
│ created_at          │
└─────────────────────┘
```

### 6.2 데이터 흐름

```
스크래핑 → lawyers 테이블 업데이트
         ↓
    lawyer_positions 테이블에 현재 소속 기록
         ↓
    이전 데이터와 비교 → 변경사항 감지
         ↓
    movements 테이블에 이동 이벤트 기록
```

## 7. Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있으며, 읽기 권한은 모든 사용자에게 공개됩니다.

### 쓰기 권한 추가 (필요 시)

스크래핑 API에서 데이터를 쓰려면 추가 정책이 필요합니다:

```sql
-- Service Role로 실행 (Supabase Dashboard의 SQL Editor에서)
CREATE POLICY "Enable insert for service role" ON lawyers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON lawyers
  FOR UPDATE
  USING (true);

-- lawyer_positions, movements 테이블도 동일하게 적용
```

또는 **API Routes에서 Service Role Key 사용** (권장):

```typescript
// app/api/scrape/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // RLS 우회
);
```

Service Role Key는 Supabase Dashboard → **Settings** → **API** → **service_role key**에서 확인

## 8. 다음 단계

✅ Supabase 데이터베이스 설정 완료!

이제 다음 작업을 진행할 수 있습니다:

1. **스크래핑 로직 구현** ([scraping-strategy.md](./scraping-strategy.md) 참고)
   - `app/api/scrape/route.ts` 생성
   - Playwright 스크래핑 함수 구현

2. **이동 감지 알고리즘 구현**
   - 신규 데이터와 기존 데이터 비교
   - `movements` 테이블에 이벤트 기록

3. **Vercel Cron Job 설정**
   - `vercel.json` 생성
   - 매일 자정 자동 스크래핑

## 9. 트러블슈팅

### 문제: "Invalid API key" 에러
**해결**:
- `.env.local` 파일의 API 키가 올바른지 확인
- 개발 서버 재시작 (`npm run dev`)

### 문제: RLS 정책으로 인한 접근 거부
**해결**:
- Service Role Key 사용 (API Routes에서만)
- 또는 적절한 RLS 정책 추가

### 문제: 테이블이 보이지 않음
**해결**:
- SQL Editor에서 스키마 파일을 다시 실행
- 에러 메시지 확인 후 수정

## 10. 유용한 쿼리 예제

### 10.1 특정 로펌의 현재 인원 조회
```sql
SELECT * FROM current_lawyers
WHERE firm_name = '김앤장'
ORDER BY name;
```

### 10.2 최근 1주일 이동 내역
```sql
SELECT * FROM movements
WHERE detected_at >= NOW() - INTERVAL '7 days'
ORDER BY detected_at DESC;
```

### 10.3 법인별 인원수 랭킹
```sql
SELECT * FROM firm_headcount;
```

### 10.4 특정 변호사의 이력 조회
```sql
SELECT
  l.name,
  lp.firm_name,
  lp.position_title,
  lp.start_date,
  lp.end_date,
  lp.is_current
FROM lawyers l
JOIN lawyer_positions lp ON l.sid = lp.lawyer_sid
WHERE l.name LIKE '%홍길동%'
ORDER BY lp.start_date DESC;
```
