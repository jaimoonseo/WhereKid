# 캘린더 구독 기능 가이드

## 개요

WhereKid의 학원 스케줄을 아이폰, 맥, 구글 캘린더 등에서 자동으로 동기화할 수 있는 iCalendar 구독 기능입니다.

## 주요 기능

### ✨ 특징
- **자동 동기화**: 1시간마다 자동으로 스케줄 업데이트
- **반복 일정**: 매주 반복되는 학원 스케줄 자동 생성
- **알림**: 각 일정 10분 전 자동 알림
- **상세 정보**: 학원 이름, 시간, 주소, 전화번호, 메모 포함
- **멀티 플랫폼**: 아이폰, 맥, 구글 캘린더, 아웃룩 등 지원

## 설정 방법

### 🍎 아이폰/아이패드

1. WhereKid 앱 → 설정 → 캘린더 구독
2. "📋 복사" 버튼으로 URL 복사
3. **설정** 앱 열기
4. **캘린더** → **계정** → **계정 추가**
5. **기타** 선택
6. **캘린더 구독** 선택 (CalDAV 아님!)
7. 복사한 URL 붙여넣기
8. **다음** → **저장**

### 💻 맥(Mac)

1. URL 복사
2. **캘린더** 앱 열기
3. **파일** → **새로운 캘린더 구독**
4. URL 붙여넣기
5. **구독** 클릭
6. 이름 및 색상 설정 (옵션)
7. **확인** 클릭

### 🌐 구글 캘린더

1. URL 복사
2. [구글 캘린더](https://calendar.google.com) 웹 접속
3. 좌측 "**다른 캘린더**" 옆 **+** 버튼
4. **URL로 추가** 선택
5. URL 붙여넣기
6. **캘린더 추가** 클릭

### 📧 아웃룩(Outlook)

1. URL 복사
2. 아웃룩 웹 또는 앱 열기
3. **캘린더** → **캘린더 추가**
4. **인터넷에서 구독** 선택
5. URL 붙여넣기
6. 이름 설정 후 **가져오기** 클릭

## 기술 사양

### iCalendar 형식 (.ics)

표준 iCalendar(RFC 5545) 형식으로 제공됩니다.

### API 엔드포인트

```
GET /api/calendar/feed?childId={childId}
```

**파라미터**:
- `childId` (옵션): 자녀 ID (기본값: 1)

**응답**:
- Content-Type: `text/calendar; charset=utf-8`
- Cache-Control: `public, max-age=3600` (1시간)

### 포함 정보

각 일정에 포함되는 정보:

```
SUMMARY: 학원 이름
DTSTART: 시작 시간 (Asia/Seoul 타임존)
DTEND: 종료 시간
LOCATION: 학원 주소
DESCRIPTION: 아이 이름, 학원 카테고리, 메모
URL: 학원 전화번호 (tel: 링크)
RRULE: 주간 반복 설정 (매주 특정 요일)
VALARM: 10분 전 알림
```

### 반복 설정

- **빈도**: 매주 (WEEKLY)
- **요일**: 각 스케줄의 요일 (MO, TU, WE, TH, FR, SA, SU)
- **기간**: 1년 (자동 갱신)

## 구현 상세

### 데이터 흐름

```
WhereKid DB (Schedules)
    ↓
API Route (/api/calendar/feed)
    ↓
ical-generator (라이브러리)
    ↓
iCalendar (.ics) 파일
    ↓
캘린더 앱 (아이폰/맥/구글 등)
```

### 코드 구조

```typescript
// app/api/calendar/feed/route.ts
export async function GET(request: NextRequest) {
  // 1. childId 파라미터 추출
  // 2. DB에서 자녀 및 스케줄 조회
  // 3. iCalendar 객체 생성
  // 4. 각 스케줄을 반복 일정으로 변환
  // 5. .ics 형식으로 반환
}
```

### 타임존 처리

모든 일정은 `Asia/Seoul` 타임존으로 생성됩니다:

```typescript
calendar.timezone = 'Asia/Seoul';

const eventStart = new Date(scheduleDate);
eventStart.setHours(startHour, startMinute, 0, 0);
```

### 고유 식별자 (UID)

각 일정은 고유한 UID를 가집니다:

```
schedule-{scheduleId}@wherekid.app
```

이를 통해 스케줄 변경 시 캘린더 앱에서 자동으로 업데이트됩니다.

## 동기화 주기

### 캘린더 앱별 동기화 주기

| 앱 | 기본 동기화 주기 | 수동 동기화 |
|-----|-----------------|------------|
| 아이폰 캘린더 | 15분~1시간 | 당겨서 새로고침 |
| 맥 캘린더 | 15분~1시간 | Cmd+R |
| 구글 캘린더 | 최대 24시간 | 불가능 |
| 아웃룩 | 3시간 | 새로고침 버튼 |

### TTL 설정

iCalendar 파일에 TTL(Time To Live)을 1시간으로 설정:

```typescript
calendar.ttl = 3600; // 1 hour in seconds
```

캘린더 앱은 이 값을 참고하여 동기화 주기를 결정합니다.

## 보안 고려사항

### URL 보안

현재 구현은 공개 URL입니다. 개선 방안:

1. **토큰 기반 인증**:
```
/api/calendar/feed?token={secureToken}
```

2. **사용자별 고유 URL**:
```typescript
// 사용자별 UUID 생성
const token = uuidv4();
// DB에 저장
await prisma.calendarToken.create({
  data: { childId, token }
});
```

3. **만료 시간 설정**:
```typescript
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 365); // 1년 후
```

### 권장사항

- URL을 타인과 공유하지 마세요
- 필요 시 새 URL 생성 기능 추가
- HTTPS 필수 (Vercel은 자동 지원)

## 문제 해결

### 캘린더가 동기화되지 않아요

1. **인터넷 연결 확인**
2. **수동 새로고침**:
   - 아이폰: 당겨서 새로고침
   - 맥: Cmd+R
3. **캘린더 앱 재시작**
4. **구독 재등록**:
   - 기존 구독 삭제
   - 새로 추가

### 일정이 중복으로 표시돼요

- **원인**: 같은 URL을 여러 번 구독
- **해결**: 설정 > 캘린더 > 계정에서 중복 구독 삭제

### 시간이 안 맞아요

- **원인**: 타임존 설정 문제
- **해결**:
  1. 아이폰 설정 > 일반 > 날짜 및 시간
  2. "자동 설정" 켜기
  3. 타임존 "서울" 확인

### 알림이 안 와요

- **원인**: 캘린더 알림 권한 없음
- **해결**:
  1. 설정 > 알림 > 캘린더
  2. "알림 허용" 켜기

## 향후 개선 사항

### 1. 보안 강화
- [ ] 토큰 기반 인증 구현
- [ ] 사용자별 고유 URL 생성
- [ ] URL 재생성 기능

### 2. 커스터마이제이션
- [ ] 캘린더 색상 선택
- [ ] 알림 시간 설정 (10분, 30분, 1시간 전)
- [ ] 포함할 스케줄 선택 (특정 학원만)

### 3. 추가 기능
- [ ] 월별 이벤트 생성 (납부 예정일)
- [ ] 학원 휴무일 반영
- [ ] 공휴일 자동 제외

### 4. 분석 및 모니터링
- [ ] 구독 활성 사용자 수 추적
- [ ] 동기화 에러 로깅
- [ ] 사용 통계 대시보드

## 사용 시나리오

### 시나리오 1: 부모가 아이 일정 확인

1. WhereKid 앱에서 캘린더 URL 복사
2. 아이폰 캘린더에 구독 추가
3. 아이폰 캘린더에서 이번 주 학원 일정 확인
4. 10분 전 알림으로 픽업 시간 리마인더

### 시나리오 2: 가족 간 일정 공유

1. 엄마가 캘린더 구독 설정
2. 아빠도 같은 URL로 구독 설정
3. 할머니는 구글 캘린더에 추가
4. 모두가 동일한 아이 스케줄 확인 가능

### 시나리오 3: 스케줄 변경 시

1. WhereKid 앱에서 학원 시간 변경 (16:00 → 17:00)
2. 1시간 내 자동으로 모든 캘린더 앱에 반영
3. 변경된 시간으로 알림 재설정

## 참고 자료

- [RFC 5545 - iCalendar](https://tools.ietf.org/html/rfc5545)
- [ical-generator 라이브러리](https://github.com/sebbo2002/ical-generator)
- [Apple Calendar 구독 가이드](https://support.apple.com/ko-kr/guide/calendar/icl1022/mac)
- [Google Calendar 구독 가이드](https://support.google.com/calendar/answer/37100)
