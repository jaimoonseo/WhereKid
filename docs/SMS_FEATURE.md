# SMS 기능 가이드

## 개요

WhereKid 앱에 백엔드 SMS 전송 기능이 추가되었습니다. 연락처를 데이터베이스에 저장하고, 서버에서 자동으로 스케줄 정보를 SMS로 전송할 수 있습니다.

## 주요 기능

### 1. 연락처 관리
- **위치**: 설정 페이지 (⚙️ 설정)
- **기능**:
  - 연락처 추가 (이름, 전화번호)
  - 기본 연락처 설정 (자동 SMS 수신자)
  - 연락처 삭제
  - 전화번호 자동 포맷팅 (010-1234-5678)

### 2. SMS 전송
- **스케줄 카드에서 전송**: 각 스케줄 카드에 📧 SMS 버튼
- **기본 연락처로 자동 전송**: 기본으로 설정된 연락처에게 자동 전송
- **메시지 포맷**:
  - 진행 중: `[WhereKid] 우리 아이가 지금 영어학원(16:10-17:37)에 있어요 📚`
  - 일반: `[WhereKid] 영어학원 스케줄: 16:10-17:37 📚`

### 3. 테스트 기능
- **설정 > SMS 연락처 관리 > "📤 테스트 SMS 보내기"**
- 기본 연락처로 테스트 메시지 전송

## 데이터베이스 스키마

### Contact 테이블
```prisma
model Contact {
  id          Int      @id @default(autoincrement())
  childId     Int
  name        String   // e.g., "엄마", "아빠", "할머니"
  phoneNumber String   // e.g., "010-1234-5678"
  isDefault   Boolean  @default(false) // 기본 수신자
  createdAt   DateTime @default(now())

  child Child @relation(fields: [childId], references: [id], onDelete: Cascade)
}
```

## API 엔드포인트

### 1. 연락처 CRUD
```typescript
// GET /api/contact - 모든 연락처 조회
// POST /api/contact - 새 연락처 추가
{
  "childId": 1,
  "name": "엄마",
  "phoneNumber": "010-1234-5678",
  "isDefault": true
}

// PUT /api/contact/[id] - 연락처 수정
// DELETE /api/contact/[id] - 연락처 삭제
```

### 2. SMS 전송
```typescript
// POST /api/sms/send
{
  "scheduleId": 1,           // 옵션: 스케줄 ID (자동 메시지 생성)
  "message": "커스텀 메시지",  // 옵션: 직접 메시지 작성
  "contactIds": [1, 2],      // 옵션: 특정 연락처에게 전송
  "sendToDefault": true      // 옵션: 기본 연락처에게 전송
}
```

## SMS 서비스 연동

현재는 **개발 모드**로, 실제 SMS는 전송되지 않고 콘솔에 로그만 출력됩니다.

### 프로덕션 연동 방법

#### 1. Naver Cloud Platform SENS (추천)
```bash
npm install @naverpay/sens
```

```typescript
// lib/sms.ts
import { SENSClient } from '@naverpay/sens';

const sens = new SENSClient({
  serviceId: process.env.SENS_SERVICE_ID!,
  accessKey: process.env.SENS_ACCESS_KEY!,
  secretKey: process.env.SENS_SECRET_KEY!,
});

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  try {
    const response = await sens.sendSMS({
      type: 'SMS',
      from: process.env.SMS_SENDER_PHONE!,
      content: message,
      messages: [{ to }],
    });

    return {
      success: true,
      messageId: response.requestId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### 2. Aligo SMS
```bash
npm install node-fetch
```

```typescript
// lib/sms.ts
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const response = await fetch('https://apis.aligo.in/send/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      key: process.env.ALIGO_API_KEY!,
      user_id: process.env.ALIGO_USER_ID!,
      sender: process.env.SMS_SENDER_PHONE!,
      receiver: to,
      msg: message,
    }),
  });

  const data = await response.json();
  return {
    success: data.result_code === '1',
    messageId: data.msg_id,
  };
}
```

### 환경 변수 설정

`.env.local` 또는 Vercel 환경 변수에 추가:

```bash
# SENS
SENS_SERVICE_ID=your_service_id
SENS_ACCESS_KEY=your_access_key
SENS_SECRET_KEY=your_secret_key
SMS_SENDER_PHONE=01012345678

# Aligo
ALIGO_API_KEY=your_api_key
ALIGO_USER_ID=your_user_id
SMS_SENDER_PHONE=01012345678
```

## 마이그레이션

데이터베이스에 Contact 테이블을 추가하려면:

```bash
# 로컬
npx prisma migrate dev

# 프로덕션 (Supabase SQL Editor에서 실행)
# prisma/migrations/20260312000000_add_contact_model/migration.sql 파일 내용 복사
```

## 사용 시나리오

### 시나리오 1: 학원 시작 시 자동 알림
1. 부모가 설정에서 자신의 전화번호를 기본 연락처로 등록
2. 홈 화면에서 진행 중인 스케줄 카드의 📧 버튼 클릭
3. 자동으로 부모에게 SMS 전송: "우리 아이가 지금 영어학원(16:10-17:37)에 있어요 📚"

### 시나리오 2: 할머니에게 스케줄 공유
1. 설정에서 할머니 연락처 추가
2. 다음 스케줄 카드의 📧 버튼으로 SMS 전송
3. 할머니가 아이 위치 파악 가능

### 시나리오 3: 여러 보호자에게 동시 알림
1. 엄마, 아빠, 할머니 모두 연락처 등록
2. API를 통해 특정 contactIds 배열로 전송
3. 모든 보호자가 동시에 알림 수신

## Web Share API와의 차이점

| 기능 | Web Share API | SMS 백엔드 |
|------|---------------|------------|
| 수신자 선택 | 매번 수동 선택 | 자동 (기본 연락처) |
| 전송 방법 | 클라이언트 수동 | 서버 자동 |
| 비용 | 무료 | SMS 요금 발생 |
| 사용 사례 | 가끔 공유 | 정기적 알림 |

## 향후 개선 사항

1. **자동 스케줄 알림**: 스케줄 시작 10분 전 자동 SMS
2. **그룹 연락처**: 여러 연락처를 그룹으로 관리
3. **메시지 템플릿**: 커스텀 메시지 템플릿 저장
4. **전송 이력**: SMS 전송 내역 저장 및 조회
5. **LMS 지원**: 긴 메시지 (LMS/MMS) 지원
6. **예약 전송**: 특정 시간에 자동 전송
