# LAW TRACK 🏛️

> 대한민국 주요 로펌의 변호사 인력 이동을 실시간으로 추적하는 Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

---

## 📋 프로젝트 개요

LAW TRACK은 대한민국 13개 주요 로펌(Tier 1~3)의 변호사 영입 및 이직 데이터를 자동으로 수집하고 분석하는 웹 애플리케이션입니다. [lawnb.com](https://www.lawnb.com)을 크롤링하여 변호사 인력 변동을 감지하고, 이를 시각화하여 법률 시장의 인력 트렌드를 파악할 수 있습니다.

### 주요 특징

- 🤖 **자동 스마트 크롤링**: Puppeteer 기반 2단계 스크래핑 (헤드카운트 체크 → 변동 감지 시 상세 크롤링)
- 📊 **실시간 대시보드**: 일별/주별/월별 인력 이동 통계 및 차트
- 🏢 **법인별 분석**: 13개 로펌의 비교 분석 및 상세 통계
- 📈 **추세 시각화**: Recharts 기반 인터랙티브 차트
- 👥 **변호사 명부**: 현재 활동 중인 변호사 검색 및 필터링
- 🔍 **이동 히스토리**: 입사/퇴사/이직 내역 추적
- 🤖 **AI 인사이트**: Google Gemini 기반 시장 분석
- ⏰ **자동 스케줄러**: Vercel Cron으로 매일 자동 실행

---

## 🎯 주요 기능

### 1️⃣ 시장 요약 (Dashboard)
- 최근 30일 인력 이동 통계 카드
  - 신규 임용, 퇴사/휴업, 로펌 이직, 시장 활성도
  - 전일 대비 증감 표시
- 시계열 차트 (Recruitment/Resignation/Transfer)
- 실시간 인력 수급 랭킹 (Top 5 로펌)
- 법인별 인력 수급 현황 테이블

### 2️⃣ 이직 히스토리 (Movements)
- 전체 이동 내역 타임라인
- 이동 유형별 필터링 (JOIN/LEAVE/TRANSFER)
- 로펌별 필터링
- 검색 기능 (변호사명)
- 페이지네이션 (50건/페이지)

### 3️⃣ 법인별 분석 (Firm Analysis) ⭐ NEW
- **13개 로펌 비교 카드 그리드**
  - 현재 변호사 수
  - 30일 순변동 (▲/▼)
  - Tier 정보
- **정렬 옵션**
  - 변동순 (순변동 많은 순)
  - 인원순 (변호사 수 많은 순)
  - 이름순 (가나다순)
- **로펌 선택 시 상세 통계**
  - 4개 통계 카드: 현재 인원, 30일 입사, 30일 퇴사, 순변동
  - 30일 인력 변화 추세 차트 (Area Chart)
  - 일별 변호사 수 시각화

### 4️⃣ 법조인 명부 (Directory)
- 전체 변호사 목록 (현재 활동 중)
- 로펌별 필터링 (13개 로펌)
- 검색 기능 (이름, 한자명)
- 상세 정보
  - 이름, 한자명, 출생년도, 성별
  - 시험 정보 (변호사시험/사법시험, 회차)
  - 소속 로펌, 직위
- 무한 스크롤 (50명/페이지)

### 5️⃣ 데이터 관제 (System Monitor) 🔧
- 크롤러 상태 모니터링
- 시스템 성능 메트릭 (CPU, 메모리)
- 실시간 로그 확인
- 개발 모드에서만 접근 가능

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase Client
- **Scraping**: Puppeteer
- **AI**: Google Gemini API

### DevOps
- **Hosting**: Vercel
- **Scheduler**: Vercel Cron Jobs
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript Compiler

---

## 🗄️ 데이터베이스 스키마

### 주요 테이블

#### 1. `lawyers` (변호사 기본 정보)
```sql
CREATE TABLE lawyers (
  sid TEXT PRIMARY KEY,           -- 시스템 고유 ID
  name TEXT NOT NULL,             -- 이름
  name_chinese TEXT,              -- 한자명
  birth_year INTEGER,             -- 출생년도
  gender TEXT,                    -- 성별
  exam_type TEXT,                 -- 시험 유형
  exam_number TEXT                -- 시험 회차
);
```

#### 2. `lawyer_positions` (변호사 소속 정보)
```sql
CREATE TABLE lawyer_positions (
  id SERIAL PRIMARY KEY,
  lawyer_sid TEXT REFERENCES lawyers(sid),
  firm_name TEXT NOT NULL,        -- 로펌명
  position_title TEXT,            -- 직위
  start_date DATE,                -- 시작일
  end_date DATE,                  -- 종료일
  is_current BOOLEAN DEFAULT true, -- 현재 재직 여부
  scraped_at TIMESTAMP            -- 수집 시각
);
```

#### 3. `movements` (인력 이동 내역)
```sql
CREATE TABLE movements (
  id TEXT PRIMARY KEY,
  lawyer_sid TEXT,                -- 변호사 SID
  lawyer_name TEXT NOT NULL,      -- 변호사 이름
  movement_type TEXT NOT NULL,    -- join/leave/transfer
  from_firm TEXT,                 -- 이전 로펌
  to_firm TEXT,                   -- 이동 로펌
  detected_at TIMESTAMP           -- 감지 시각
);
```

### 뷰

#### `firm_headcount` (로펌별 현재 인원)
```sql
CREATE VIEW firm_headcount AS
SELECT
  firm_name,
  COUNT(DISTINCT lawyer_sid) as lawyer_count
FROM lawyer_positions
WHERE is_current = true
GROUP BY firm_name;
```

---

## 📁 프로젝트 구조

```
law_tracker/
├── app/
│   ├── page.tsx                 # 메인 페이지 (라우팅 허브)
│   ├── layout.tsx               # 루트 레이아웃
│   ├── globals.css              # 글로벌 스타일
│   └── api/                     # API 라우트
│       └── scrape/
│           ├── route.ts         # 단일 로펌 스크래핑
│           └── all/
│               └── route.ts     # 전체 로펌 스크래핑 (Cron)
├── components/
│   ├── Layout.tsx               # 사이드바 & 헤더
│   ├── StatsCards.tsx           # 통계 카드
│   ├── MovementTable.tsx        # 이동 내역 테이블
│   ├── MovementChart.tsx        # 시계열 차트
│   ├── FirmMovementSummary.tsx  # 법인별 요약 테이블
│   ├── DirectoryPage.tsx        # 변호사 명부 페이지
│   ├── MovementsPage.tsx        # 이직 히스토리 페이지
│   ├── SystemMonitor.tsx        # 시스템 모니터
│   ├── FirmAnalysisPage.tsx    # 법인별 분석 메인
│   ├── FirmComparisonGrid.tsx   # 로펌 비교 그리드
│   ├── FirmCard.tsx             # 개별 로펌 카드
│   ├── FirmDetailSection.tsx    # 로펌 상세 섹션
│   ├── FirmStatsCards.tsx       # 로펌 통계 카드
│   └── FirmTrendChart.tsx       # 로펌 추세 차트
├── services/
│   ├── lawnbScraper.ts          # Lawnb 크롤링
│   ├── movementDetector.ts      # 이동 감지
│   ├── headcountChecker.ts      # 헤드카운트 체크
│   ├── dataTransformer.ts       # 데이터 변환
│   ├── gemini.ts                # Gemini AI
│   └── supabaseService.ts       # Supabase API
├── scripts/
│   ├── scrape-all-firms.js      # 전체 로펌 스크래핑
│   ├── detect-movements.js      # 변동 감지
│   ├── check-duplicates.js      # 중복 체크
│   └── test-api.js              # API 테스트
├── constants.tsx                # 상수 (13개 로펌)
├── types.ts                     # TypeScript 타입
└── vercel.json                  # Vercel Cron 설정
```

---

## 🤖 스크래핑 로직

### 2단계 Smart Scraping

#### Phase 1: 헤드카운트 체크 (1-2분)
```javascript
// 각 로펌의 현재 변호사 수만 확인
for (const firm of MAJOR_FIRMS) {
  const currentCount = await getHeadcountFromWeb(firm);
  const dbCount = await getDbHeadcount(firm);

  if (currentCount !== dbCount) {
    // 변동 감지 → Phase 2로 진행
    firmsToScrape.push(firm);
  }
}
```

#### Phase 2: 전체 스크래핑 (변동 감지된 로펌만)
```javascript
// 변동이 감지된 로펌만 상세 크롤링
for (const firm of firmsToScrape) {
  const lawyers = await scrapeFirmLawyers(firm);
  await updateDatabase(lawyers);
  await detectMovements(firm);
}
```

### 자동 스케줄러 (Vercel Cron)
```json
{
  "crons": [{
    "path": "/api/scrape/all",
    "schedule": "0 0 * * *"
  }]
}
```
- **실행 시간**: 매일 UTC 00:00 (한국시간 오전 9시)
- **소요 시간**: 평균 1-2분 (변동 없을 시), 변동 시 5-10분

---

## 🏢 대상 법인 (13개)

### Tier 1 (5개)
- **김앤장** (Kim & Chang) - 960명
- **광장** (Kwang Jang) - 570명
- **세종** (Sejong) - 510명
- **태평양** (Yulchon) - 500명
- **화우** (Hwawoo) - 410명

### Tier 2 (3개)
- **율촌** (Yulchon LLC) - 330명
- **지평** (Jipyong) - 200명
- **바른** (Barun Law) - 150명

### Tier 3 (5개)
- **한국** (HanKook) - 100명
- **동인** (Dongin) - 90명
- **대륙아주** (Daeryook) - 85명
- **원** (WonLaw) - 80명
- **덕수** (Deoksu) - 70명

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- Supabase 프로젝트
- Google Gemini API Key (AI 기능 사용 시)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd law_tracker

# 의존성 설치
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Base URL (Optional)
BASE_URL=http://localhost:3000
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

### 빌드 및 프로덕션

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

---

## 📊 API 엔드포인트

### Supabase Service Functions

```typescript
// 이동 내역 조회
fetchMovements(limit?: number): Promise<Movement[]>

// 로펌별 현재 인원
fetchFirmHeadcounts(): Promise<Record<string, number>>

// 현재 활동 중인 변호사 목록
fetchCurrentLawyers(limit, firmName?, offset): Promise<LawyerPosition[]>

// 일별 통계 계산
calculateDailyStats(movements: Movement[]): DailyStats[]

// 로펌별 이동 통계 (30일)
fetchFirmMovementStats(days?: number): Promise<Record<string, MovementStats>>

// 로펌 인력 추세 (30일)
fetchFirmHeadcountHistory(firmName: string, days?: number): Promise<TrendData[]>
```

### 스크래핑 API

```typescript
// 단일 로펌 스크래핑
POST /api/scrape
{
  "firmName": "김앤장",
  "maxPages": 5
}

// 전체 로펌 스크래핑 (Cron)
GET /api/scrape/all
```

---

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: Slate (50-950) - 메인 UI
- **Accent**: Amber (500-600) - 강조 요소
- **Success**: Emerald (50, 600) - 긍정 지표
- **Danger**: Rose (50, 600) - 부정 지표
- **Background**: Slate 50/100 - 배경

### 타이포그래피
- **Headings**: font-bold, tracking-tight
- **Body**: font-medium
- **Labels**: font-black, uppercase, tracking-widest
- **Numbers**: text-3xl, font-bold, tracking-tighter

### 컴포넌트 패턴
- **Cards**: rounded-xl, border, shadow-sm, hover:shadow-md
- **Buttons**: rounded-lg, transition-all
- **Badges**: text-[10px], font-black, uppercase, tracking-[0.2em]

---

## 🧪 테스트

### 수동 API 테스트

```bash
# 단일 로펌 테스트
node scripts/test-api.js single 김앤장 2

# 전체 로펌 테스트
node scripts/test-api.js all
```

### 중복 체크

```bash
node scripts/check-duplicates.js
```

---

## 📈 향후 개선 사항

### 단기
- [ ] 기간 선택 기능 (7일/30일/90일)
- [ ] 엑셀/CSV 내보내기
- [ ] 로펌별 전문 분야 분포
- [ ] 직급별 분포 분석

### 중기
- [ ] 이메일/슬랙 알림
- [ ] 로펌 간 이동 매트릭스 (Sankey diagram)
- [ ] AI 인사이트 강화 (GPT-4)
- [ ] 비교 모드 (2-3개 로펌 동시 비교)

### 장기
- [ ] 모바일 앱 (React Native)
- [ ] Public API (REST/GraphQL)
- [ ] 실시간 알림 (WebSocket)
- [ ] ML 기반 인력 예측 모델

---

## 🔒 보안 고려사항

1. **환경 변수**: Supabase 키는 반드시 `.env.local`에 저장
2. **Row Level Security**: Supabase RLS 정책 활성화 권장
3. **Rate Limiting**: 크롤링 시 적절한 딜레이 설정
4. **에러 핸들링**: 모든 API 호출에 try-catch 적용
5. **Service Role Key**: 서버 사이드에서만 사용

---

## 🐛 알려진 이슈

- ESLint 설정 필요 (`next lint` deprecated in Next.js 16)
- 크롤링 시 간헐적 타임아웃 (네트워크 불안정)
- 일부 변호사 중복 데이터 (SID 기반 병합 필요)

---

## 📝 개발 상태

### ✅ 구현 완료
- [x] UI 컴포넌트 (대시보드, 차트, 테이블)
- [x] Puppeteer 스크래핑 시스템
- [x] 이동 감지 로직 (JOIN/LEAVE/TRANSFER)
- [x] 스마트 스크래핑 (헤드카운트 체크)
- [x] Vercel Cron 자동 스케줄러
- [x] Supabase 연동 (lawyers, lawyer_positions, movements)
- [x] Google Gemini AI 통합
- [x] **법인별 분석 페이지** (2026-01-13 추가)

### 🚧 진행 중
- [ ] 데이터 정합성 검증
- [ ] 성능 최적화

---

## 🤝 기여 가이드

이 프로젝트는 비공개 프로젝트입니다.

---

## 📝 라이선스

Private

---

## 👤 작성자

**황인준** - 법률 인력 시장 분석 플랫폼

---

## 🙏 감사의 말

- [lawnb.com](https://www.lawnb.com) - 변호사 데이터 출처
- [Supabase](https://supabase.com) - 백엔드 인프라
- [Vercel](https://vercel.com) - Next.js 호스팅
- [Recharts](https://recharts.org) - 차트 라이브러리
- [Google Gemini](https://ai.google.dev/) - AI 분석

---

**Made with ⚖️ by LAW TRACK Team**
