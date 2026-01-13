# Law Firm Movement Tracker

대한민국 주요 13개 로펌의 변호사 이동(입사/퇴사/이직)을 실시간으로 추적하고 분석하는 지능형 대시보드

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI**: Google Gemini API
- **Backend**: Supabase
- **Icons**: Lucide React

## 프로젝트 구조

```
law_tracker/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 메인 페이지
│   ├── globals.css         # 전역 스타일
│   └── api/                # API 라우트
│       └── scrape/         # 스크래핑 API
│           ├── route.ts    # 단일 로펌 스크래핑
│           └── all/
│               └── route.ts # 전체 로펌 스크래핑 (Cron)
├── components/             # UI 컴포넌트
│   ├── Layout.tsx          # 메인 레이아웃
│   ├── StatsCards.tsx      # 통계 카드
│   ├── MovementChart.tsx   # 시계열 차트
│   ├── MovementTable.tsx   # 이동 내역 테이블
│   ├── MovementsPage.tsx   # 이직 히스토리 페이지
│   ├── FirmAnalysisPage.tsx # 법인별 분석 페이지
│   ├── DirectoryPage.tsx   # 법조인 명부 페이지
│   ├── FirmMovementSummary.tsx  # 법인별 현황
│   ├── AIAssistant.tsx     # AI 분석 리포트
│   └── SystemMonitor.tsx   # 시스템 모니터링
├── services/               # 비즈니스 로직
│   ├── lawnbScraper.ts     # Lawnb.com 스크래퍼 (Puppeteer)
│   ├── movementDetector.ts # 변호사 이동 감지 로직
│   ├── headcountChecker.ts # 스마트 스크래핑 (인원수 체크)
│   ├── dataTransformer.ts  # 데이터 변환
│   ├── gemini.ts           # Gemini AI 통합
│   └── supabaseService.ts  # Supabase 연동
├── scripts/                # 유틸리티 스크립트
│   ├── test-api.js         # API 테스트
│   └── check-positions.js  # Position 데이터 확인
├── lib/                    # 유틸리티
│   └── supabase.ts         # Supabase 클라이언트
├── types.ts                # 타입 정의
├── constants.tsx           # 상수 (13개 법인 데이터)
└── vercel.json             # Vercel Cron 설정
```

## 주요 기능

### 1. 실시간 이동 추적 ✅
- 변호사 JOIN/LEAVE/TRANSFER 자동 감지
- 일일 통계 및 트렌드 분석
- 30일 이내 이직 자동 판단

### 2. 스마트 스크래핑 시스템 ✅
- **2단계 스크래핑**: Headcount 체크 → 변동 있는 로펌만 Full Scrape
- Puppeteer 기반 Lawnb.com 크롤러
- 효율적인 리소스 사용 (평균 1-2분 → 변동 시에만 전체 스크래핑)

### 3. 자동 스케줄러 ✅
- **Vercel Cron**: 매일 자정(UTC 00:00 = 한국시간 오전 9시) 자동 실행
- 13개 주요 로펌 자동 스크래핑
- movements 테이블 자동 업데이트
- is_current 플래그 자동 관리

### 4. 시장 분석 대시보드 ✅
- 법인별 인력 수급 현황
- 실시간 인력 수급 랭킹
- 시계열 차트 시각화
- 이직 히스토리 (필터링/검색/페이지네이션)
- 법인별 분석 페이지

### 5. AI 인텔리전스 ✅
- Google Gemini 기반 시장 트렌드 분석
- 자동 인사이트 생성

### 6. 시스템 모니터링 ✅
- 크롤러/DB 상태 확인
- 성능 메트릭 모니터링
- 실시간 로그 추적

## 대상 법인 (13개)

| Tier | 법인 | 변호사 수 |
|------|------|----------|
| **Tier 1** | 김앤장, 광장, 태평양, 세종, 율촌 | 410-960명 |
| **Tier 2** | 화우, 바른, 지평 | 150-330명 |
| **Tier 3** | 와이케이, 대륙아주, 대륜, 동인, 로고스 | 70-100명 |

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Base URL (optional, for testing)
BASE_URL=http://localhost:3200
```

### 3. 개발 서버 실행
```bash
npm run dev
```

서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 스케줄러 테스트

### 수동 API 호출
```bash
# 단일 로펌 스크래핑 (테스트용)
node scripts/test-api.js single 김앤장 2

# 전체 로펌 스크래핑 (실제 운영과 동일)
node scripts/test-api.js all
```

### Vercel Cron 설정
`vercel.json` 파일에 다음 설정이 있습니다:
```json
{
  "crons": [{
    "path": "/api/scrape/all",
    "schedule": "0 0 * * *"
  }]
}
```

- **실행 시간**: 매일 UTC 00:00 (한국시간 오전 9시)
- **동작 방식**:
  1. 13개 로펌 headcount 체크 (1-2분)
  2. 변동 있는 로펌만 전체 스크래핑
  3. 이동 감지 및 movements 테이블 업데이트
  4. is_current 플래그 자동 업데이트

## 개발 상태

### ✅ 구현 완료
- **UI 컴포넌트**: 대시보드, 차트, 테이블, 필터링, 페이지네이션
- **스크래핑 시스템**: Puppeteer 기반 Lawnb.com 크롤러
- **이동 감지 로직**: JOIN/LEAVE/TRANSFER 자동 판단
- **스마트 스크래핑**: Headcount 기반 2단계 스크래핑
- **자동 스케줄러**: Vercel Cron (매일 자정)
- **Supabase 연동**: lawyers, lawyer_positions, movements 테이블
- **Google Gemini AI 통합**: 시장 분석 리포트
- **Next.js App Router 구조**: 최신 Next.js 15 기반

### 🔄 향후 개선 사항
- 알림 시스템 (중요 이동 발생 시 알림)
- 고급 필터링 (직위별, 전문분야별)
- 데이터 export 기능 (CSV, Excel)
- 커스텀 리포트 생성

## 라이선스

Private

## 기여

이 프로젝트는 비공개 프로젝트입니다.
