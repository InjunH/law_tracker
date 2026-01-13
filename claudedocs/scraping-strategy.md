# Lawnb.com 스크래핑 전략 분석

## 1. 대상 사이트 분석

### 사이트 정보
- **URL**: https://www.lawnb.com/Info/ContentMain/Lawyer
- **검색 결과 URL**: https://www.lawnb.com/Info/ContentLawyerList
- **사이트 유형**: 동적 웹사이트 (Playwright 필요)

### 데이터 구조

#### 검색 방법
- 현직소속 필드에 로펌명 입력
- 예: "김앤장" 검색 → 1,241명 (63페이지)
- 페이지당 20명 표시

#### 추출 가능한 정보
```javascript
{
  name: "강검윤(姜鈐允)",
  url: "https://www.lawnb.com/Info/ContentView?sid=P00034AC3D86EF67",
  birthInfo: "1978년생 / 여자 / 사법시험 47",
  currentPosition: "현직 : 변호사 / 김앤장 법률사무소",
  firmName: "김앤장"
}
```

## 2. 스크래핑 구현 전략

### 기술 스택
- **브라우저 자동화**: Playwright (동적 콘텐츠 처리)
- **런타임**: Next.js API Routes
- **스케줄링**: Vercel Cron Jobs (매일 자정)
- **데이터베이스**: Supabase

### 스크래핑 로직

```typescript
// 의사 코드
async function scrapeLawFirm(firmName: string) {
  // 1. 브라우저 실행
  const browser = await playwright.chromium.launch()
  const page = await browser.newPage()

  // 2. 검색 페이지 이동
  await page.goto('https://www.lawnb.com/Info/ContentMain/Lawyer')

  // 3. 검색어 입력
  await page.fill('#sWork', firmName)
  await page.click('button:has-text("검색")')

  // 4. 모든 페이지 순회
  const totalPages = await getTotalPages(page)
  const allLawyers = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const lawyers = await extractLawyersFromPage(page)
    allLawyers.push(...lawyers)

    // 다음 페이지로 이동
    if (pageNum < totalPages) {
      await page.click(`a:has-text("${pageNum + 1}")`)
      await page.waitForLoadState('networkidle')
    }
  }

  // 5. 브라우저 종료
  await browser.close()

  return allLawyers
}

async function extractLawyersFromPage(page) {
  return await page.evaluate(() => {
    const headings = document.querySelectorAll('h3')
    const lawyers = []

    headings.forEach(h3 => {
      const link = h3.querySelector('a')
      if (link && link.href.includes('ContentView')) {
        const li = h3.closest('li')

        // 정보 추출
        const divs = li.querySelectorAll('.co_searchContent > div')
        let birthInfo = ''
        let currentPosition = ''

        divs.forEach(div => {
          const text = div.textContent.trim()
          if (text.includes('년생') || text.includes('시험')) {
            birthInfo = text
          }
          if (text.includes('현직')) {
            currentPosition = text
          }
        })

        lawyers.push({
          name: h3.textContent.trim(),
          url: link.href,
          birthInfo,
          currentPosition,
          sid: link.href.match(/sid=([^&]+)/)?.[1]
        })
      }
    })

    return lawyers
  })
}
```

## 3. 대상 로펌 목록

MAJOR_FIRMS 상수에서 13개 로펌:
1. 김앤장 (Kim & Chang)
2. 광장 (Gwangiang)
3. 태평양 (Taepyeongyang)
4. 율촌 (Yulchon)
5. 화우 (Hwawoo)
6. 세종 (Sejong)
7. 바른 (Brun)
8. 지평 (Jipyeong)
9. 클라스 (Klaas)
10. 동인 (Dong-in)
11. 원 (Won)
12. 해담 (Haedam)
13. 케이엘 (KL Partners)

## 4. 데이터베이스 스키마 (Supabase)

### lawyers 테이블
```sql
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sid VARCHAR(50) UNIQUE NOT NULL,  -- Lawnb 고유 식별자
  name VARCHAR(100) NOT NULL,
  name_chinese VARCHAR(100),        -- 한자명
  birth_year INT,
  gender VARCHAR(10),
  exam_type VARCHAR(50),             -- 사법시험/변호사시험
  exam_number INT,
  profile_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lawyers_sid ON lawyers(sid);
CREATE INDEX idx_lawyers_name ON lawyers(name);
```

### lawyer_positions 테이블 (이력 추적)
```sql
CREATE TABLE lawyer_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_sid VARCHAR(50) REFERENCES lawyers(sid),
  firm_name VARCHAR(100) NOT NULL,
  position_title VARCHAR(100),       -- 변호사, 파트너 등
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_positions_lawyer ON lawyer_positions(lawyer_sid);
CREATE INDEX idx_positions_firm ON lawyer_positions(firm_name);
CREATE INDEX idx_positions_current ON lawyer_positions(is_current);
```

### movements 테이블 (이동 감지)
```sql
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_sid VARCHAR(50) REFERENCES lawyers(sid),
  lawyer_name VARCHAR(100) NOT NULL,
  from_firm VARCHAR(100),
  to_firm VARCHAR(100) NOT NULL,
  movement_type VARCHAR(20),         -- 'join', 'leave', 'transfer'
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_movements_lawyer ON movements(lawyer_sid);
CREATE INDEX idx_movements_date ON movements(detected_at);
CREATE INDEX idx_movements_firm ON movements(to_firm);
```

## 5. 이동 감지 알고리즘

```typescript
async function detectMovements(newData: Lawyer[], firmName: string) {
  // 1. 기존 데이터 조회
  const existingLawyers = await supabase
    .from('lawyer_positions')
    .select('*')
    .eq('firm_name', firmName)
    .eq('is_current', true)

  // 2. 신규 입사자 감지 (새로운 sid)
  const existingSids = new Set(existingLawyers.map(l => l.lawyer_sid))
  const newJoins = newData.filter(l => !existingSids.has(l.sid))

  // 3. 퇴사자 감지 (기존에는 있었으나 새 데이터에 없음)
  const newSids = new Set(newData.map(l => l.sid))
  const departures = existingLawyers.filter(l => !newSids.has(l.lawyer_sid))

  // 4. 이동 기록 생성
  for (const join of newJoins) {
    await createMovementRecord({
      lawyer_sid: join.sid,
      lawyer_name: join.name,
      to_firm: firmName,
      movement_type: 'join'
    })
  }

  for (const departure of departures) {
    await createMovementRecord({
      lawyer_sid: departure.lawyer_sid,
      lawyer_name: departure.lawyer_name,
      from_firm: firmName,
      movement_type: 'leave'
    })

    // is_current를 false로 업데이트
    await supabase
      .from('lawyer_positions')
      .update({ is_current: false, end_date: new Date() })
      .eq('lawyer_sid', departure.lawyer_sid)
      .eq('firm_name', firmName)
  }
}
```

## 6. Next.js API Routes 구조

```
app/api/
├── scrape/
│   ├── route.ts              # POST /api/scrape - 수동 스크래핑
│   └── [firmName]/route.ts   # POST /api/scrape/김앤장
├── cron/
│   └── daily/route.ts        # GET /api/cron/daily - Vercel Cron
└── movements/
    ├── route.ts              # GET /api/movements - 이동 목록
    └── latest/route.ts       # GET /api/movements/latest
```

## 7. Vercel Cron 설정

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/daily",
    "schedule": "0 0 * * *"  // 매일 자정 (UTC)
  }]
}
```

## 8. 구현 우선순위

1. ✅ **완료**: 스크래핑 전략 수립 및 HTML 구조 분석
2. **다음**: Supabase 데이터베이스 스키마 생성
3. **다음**: Next.js API Route - 기본 스크래핑 로직
4. **다음**: Playwright 스크래핑 함수 구현
5. **다음**: 이동 감지 알고리즘 구현
6. **다음**: Vercel Cron Job 설정
7. **다음**: 대시보드에서 실시간 데이터 연동

## 9. 주의사항

### 법적 고려사항
- robots.txt 확인 필요
- 요청 간격 설정 (rate limiting)
- 데이터 사용 목적 명확화

### 기술적 고려사항
- Playwright 실행 환경: Vercel에서는 제한적 → AWS Lambda 고려
- 대안: Vercel Serverless Functions + Browserless.io
- 또는 별도 서버에서 스크래핑 후 API로 데이터 전송

### 성능 최적화
- 13개 로펌 * 평균 50페이지 = 650+ 페이지
- 병렬 처리 고려 (동시에 3-5개 로펌)
- 변경된 데이터만 업데이트
