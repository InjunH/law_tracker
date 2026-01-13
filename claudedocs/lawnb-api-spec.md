# Lawnb.com AJAX API 명세서

## 개요

Lawnb.com의 변호사 검색 시스템은 폼 제출(Form Submit) 방식으로 작동합니다.

## 검색 워크플로우

### 1단계: 검색 폼 제출

**URL**: `https://www.lawnb.com/Info/ContentMain/Lawyer`

**Method**: `POST` (Form Submit)

**Form Fields**:
```
sName: ""           # 이름
sWork: "김앤장"      # 현직소속 (로펌명)
sGrade: ""          # 현직 (직급)
sArea: ""           # 근무지역
sKindexam: ""       # 시험종류
sNumexam: ""        # 시험횟수
sTrainFrom: ""      # 연수원기수 (시작)
sTrainTo: ""        # 연수원기수 (끝)
sHighschool: ""     # 고등학교
sHighFrom: ""       # 고등학교 졸업연도 (시작)
sHighTo: ""         # 고등학교 졸업연도 (끝)
sUniv: ""           # 대학교
sUnivFrom: ""       # 대학교 졸업연도 (시작)
sUnivTo: ""         # 대학교 졸업연도 (끝)
sLawschool: ""      # 로스쿨
sLawFrom: ""        # 로스쿨 졸업연도 (시작)
sLawTo: ""          # 로스쿨 졸업연도 (끝)
sCareer: ""         # 경력소속
sBirth: ""          # 출생연도 (시작)
sBirthTo: ""        # 출생연도 (끝)
sGender: ""         # 성별
```

**동작**:
- Form Submit으로 `/Info/ContentLawyerList` 페이지로 이동
- 페이지 로드 시 AJAX로 실제 데이터 요청

### 2단계: AJAX 데이터 로드

**Endpoint**: `POST /AjaxInfo/ContentLawyerList`

**Request Headers**:
```
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
```

**Request Parameters** (추정):
```
sWork: "김앤장"
pageIndex: 1
sName: ""
sBirth: ""
sKindexam: ""
sNumexam: ""
sGender: ""
... (기타 검색 조건)
```

**Response** (추정):
```json
{
  "totalCount": 1241,
  "totalPages": 63,
  "currentPage": 1,
  "lawyers": [
    {
      "sid": "P00034AC3D86EF67",
      "name": "강검윤",
      "nameChina": "姜鈐允",
      "birthYear": 1978,
      "gender": "여자",
      "examType": "사법시험",
      "examNumber": 47,
      "currentFirm": "김앤장 법률사무소",
      "position": "변호사",
      "profileUrl": "/Info/ContentView?sid=P00034AC3D86EF67"
    }
    // ... 19 more entries (20 per page)
  ]
}
```

## 대체 접근 방법: 직접 URL 접근

검색 결과 페이지에 직접 GET으로 접근 가능 여부 확인 필요:

**가능성 1**: Query String 방식
```
GET /Info/ContentLawyerList?sWork=김앤장&pageIndex=1
```

**가능성 2**: RESTful API
```
POST /AjaxInfo/ContentLawyerList
Content-Type: application/x-www-form-urlencoded

sWork=김앤장&pageIndex=1&sName=&sBirth=
```

## 세션 관리

**Session Endpoint**: `POST /Login/SessionPlus/`

- 검색 전에 자동으로 호출됨
- 세션 쿠키 설정 (인증 불필요, 공개 데이터)

## 응답 데이터 구조 (HTML Parsing 필요)

현재 시점에서 AJAX 응답이 JSON인지 HTML인지 불명확. 실제 구현 시 확인 필요.

**HTML 구조** (현재 확인된 것):
```html
<li>
  <div class="num">1.</div>
  <img src="..." alt="사진" />
  <div class="info">
    <h3>
      <a href="/Info/ContentView?sid=P00034AC3D86EF67">
        강검윤(姜鈐允)
      </a>
    </h3>
    <div class="birth">1978년생 / 여자 / 사법시험 47</div>
    <div class="current">현직 : 변호사 / 김앤장 법률사무소</div>
  </div>
</li>
```

## 페이징

- 총 결과: 1241건
- 페이지당: 20명
- 총 페이지: 63페이지
- 페이지 파라미터: `pageIndex` (1-based)

## 필요한 추가 테스트

1. ✅ 세션 초기화 필요 여부 → 필요 (SessionPlus)
2. ⏳ AJAX 응답 형식 (JSON vs HTML)
3. ⏳ 정확한 POST 파라미터 구조
4. ⏳ GET 방식 접근 가능 여부
5. ⏳ Rate Limiting 정책
6. ⏳ User-Agent 요구사항

## 다음 단계

1. **실제 POST 데이터 캡처**: Playwright로 정확한 폼 데이터 확인
2. **axios 재현 테스트**: URLSearchParams로 재현 시도
3. **응답 파싱**: JSON인지 HTML인지 확인 후 파서 구현
4. **에러 처리**: 400 에러 원인 파악 및 해결

## 구현 노트

### 방법 1: Form Submit 후 HTML Parsing (안정적)
```typescript
// 1. 검색 폼 제출 (POST)
await axios.post('https://www.lawnb.com/Info/ContentMain/Lawyer', formData);

// 2. 결과 페이지 HTML 가져오기
const html = await axios.get('https://www.lawnb.com/Info/ContentLawyerList');

// 3. HTML 파싱 (cheerio 등 사용)
const $ = cheerio.load(html.data);
```

### 방법 2: AJAX API 직접 호출 (빠름, 불안정)
```typescript
// 세션 초기화
await axios.post('https://www.lawnb.com/Login/SessionPlus/');

// AJAX로 데이터 요청
const response = await axios.post(
  'https://www.lawnb.com/AjaxInfo/ContentLawyerList',
  params
);
```

현재 400 에러가 발생하므로 **방법 1**을 우선 구현 권장.
