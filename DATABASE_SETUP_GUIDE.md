# WhereKid - Supabase 데이터베이스 설정 가이드

## 개요

이 가이드는 WhereKid 프로젝트를 Supabase PostgreSQL 데이터베이스에 연결하는 전체 과정을 설명합니다.

## 파일 구조

```
wherekid/
├── prisma/
│   └── schema.prisma              # Prisma 스키마 정의
├── supabase-setup.sql             # 데이터베이스 초기 설정 SQL
├── RLS_SETUP.sql                  # RLS 설정 (추후 사용)
├── VERCEL_ENV_SETUP.md            # Vercel 환경변수 설정 가이드
└── DATABASE_SETUP_GUIDE.md        # 이 파일
```

## 단계별 설정 가이드

### 1단계: Supabase 프로젝트 준비

1. Supabase 대시보드 접속: https://app.supabase.com
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **SQL Editor** 메뉴로 이동

### 2단계: 데이터베이스 테이블 생성

1. `supabase-setup.sql` 파일 열기
2. 전체 내용 복사
3. Supabase SQL Editor에 붙여넣기
4. **Run** 버튼 클릭하여 실행

이 스크립트는 다음을 수행합니다:
- ✅ 5개 테이블 생성 (Child, Academy, Schedule, PaymentPlan, PaymentHistory)
- ✅ 외래 키 제약조건 설정
- ✅ 인덱스 생성 (성능 최적화)
- ✅ RLS 비활성화 (개발 단계)
- ✅ 샘플 데이터 삽입 (한국 학원 스케줄 예시)

### 3단계: 테이블 생성 확인

1. Supabase 대시보드의 **Table Editor** 메뉴로 이동
2. 다음 테이블들이 생성되었는지 확인:
   - Child (3개 샘플 레코드)
   - Academy (7개 샘플 레코드)
   - Schedule (14개 샘플 레코드)
   - PaymentPlan (7개 샘플 레코드)
   - PaymentHistory (21개 샘플 레코드)

### 4단계: DATABASE_URL 확인

1. Supabase 대시보드에서 **Settings** > **Database** 이동
2. **Connection String** 섹션에서 **URI** 복사
3. Connection Pooling URL 사용 권장 (포트 6543):

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 5단계: Vercel 환경변수 설정

자세한 내용은 `VERCEL_ENV_SETUP.md` 파일을 참고하세요.

**간단 버전:**

1. Vercel 대시보드: https://vercel.com/dashboard
2. `wherekid` 프로젝트 선택
3. **Settings** > **Environment Variables**
4. 변수 추가:
   - Name: `DATABASE_URL`
   - Value: (위에서 복사한 Supabase Connection String)
   - Environment: Production, Preview, Development 모두 선택

### 6단계: 로컬 개발 환경 설정

프로젝트 디렉토리에 `.env.local` 파일 생성:

```bash
# /workspace/group/wherekid/.env.local
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

### 7단계: Prisma Client 생성

```bash
cd /workspace/group/wherekid
npx prisma generate
```

### 8단계: 데이터베이스 연결 테스트 (로컬)

```bash
# Prisma Studio 실행
npx prisma studio

# 또는 Next.js 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000/api/children` 접속하여 샘플 데이터 확인

### 9단계: Vercel 재배포

```bash
# 변경사항 커밋
git add .
git commit -m "Connect to Supabase database"
git push origin main

# 또는 Vercel CLI 사용
vercel --prod
```

### 10단계: 프로덕션 테스트

배포 완료 후 다음 URL 접속:
```
https://wherekid.vercel.app/api/children
```

샘플 데이터가 정상적으로 반환되면 설정 완료입니다.

## 데이터베이스 스키마 정보

### 테이블 관계

```
Child (아이)
  └── Academy (학원)
       ├── Schedule (수업 일정)
       ├── PaymentPlan (납부 계획)
       └── PaymentHistory (납부 이력)
```

### 주요 필드

**Child (아이)**
- id: 고유 ID
- name: 이름
- birthdate: 생년월일
- createdAt: 등록일

**Academy (학원)**
- id: 고유 ID
- childId: 아이 ID (외래 키)
- name: 학원명
- category: 카테고리 (영어, 수학, 체육 등)
- phone: 전화번호
- address: 주소
- memo: 메모

**Schedule (수업 일정)**
- id: 고유 ID
- academyId: 학원 ID (외래 키)
- dayOfWeek: 요일 (1=월요일, 5=금요일)
- startTime: 시작 시간 (HH:MM)
- endTime: 종료 시간 (HH:MM)

**PaymentPlan (납부 계획)**
- id: 고유 ID
- academyId: 학원 ID (외래 키)
- amount: 금액 (원)
- paymentDay: 납부일 (1-31)
- cycle: 주기 (MONTH 또는 WEEK)

**PaymentHistory (납부 이력)**
- id: 고유 ID
- academyId: 학원 ID (외래 키)
- amount: 금액 (원)
- paidDate: 납부일
- status: 상태 (PAID 또는 PENDING)

## 샘플 데이터 설명

설정 스크립트는 3명의 아이와 7개의 학원 샘플 데이터를 생성합니다:

**김민준 (childId: 1)**
- 영어나라 학원 (월/수/금 15:00-16:30)
- 수학의 달인 (화/목 16:00-17:30)
- 태권도장 강남점 (월/수/금 17:00-18:00)

**이서연 (childId: 2)**
- 피아노 아카데미 (화/금 14:00-15:00)
- 코딩키즈 (목 15:00-17:00)

**박지호 (childId: 3)**
- 축구교실 FC (토 10:00-12:00)
- 과학탐구교실 (수 16:00-18:00)

각 학원에는 납부 계획과 최근 3개월 납부 이력이 포함되어 있습니다.

## 트러블슈팅

### 문제: "Can't reach database server"

**해결책:**
1. DATABASE_URL이 올바른지 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 방화벽이나 VPN이 연결을 차단하지 않는지 확인

### 문제: "Connection pool timeout"

**해결책:**
1. Connection Pooling URL 사용 (포트 6543)
2. URL에 `?pgbouncer=true` 파라미터 추가
3. Supabase 대시보드에서 **Connection Pooling** 활성화 확인

### 문제: "Password authentication failed"

**해결책:**
1. Supabase 비밀번호 재확인
2. URL의 특수문자를 URL 인코딩
3. Supabase에서 비밀번호 재설정

### 문제: "Table already exists"

**해결책:**
1. 이미 테이블이 생성된 경우 정상입니다
2. 데이터를 초기화하려면 Supabase SQL Editor에서 다음 실행:

```sql
DROP TABLE IF EXISTS "PaymentHistory" CASCADE;
DROP TABLE IF EXISTS "PaymentPlan" CASCADE;
DROP TABLE IF EXISTS "Schedule" CASCADE;
DROP TABLE IF EXISTS "Academy" CASCADE;
DROP TABLE IF EXISTS "Child" CASCADE;
```

그 후 `supabase-setup.sql`을 다시 실행하세요.

## 보안 고려사항

### 현재 상태 (개발 단계)
- ✅ RLS 비활성화: 누구나 데이터 접근 가능
- ⚠️ 프로토타입 단계에만 적합
- ⚠️ 공개 배포 전 인증 필수

### 프로덕션 전 해야 할 작업
1. 인증 시스템 구현 (NextAuth, Supabase Auth 등)
2. Child 테이블에 userId 컬럼 추가
3. `RLS_SETUP.sql` 실행하여 RLS 활성화
4. 정책 테스트 및 검증

## 다음 단계

데이터베이스 설정이 완료되었습니다. 이제 다음 단계로 진행하세요:

1. ✅ 프론트엔드 UI 개발
2. ✅ API 엔드포인트 구현
3. ⬜ 사용자 인증 추가
4. ⬜ RLS 활성화
5. ⬜ 프로덕션 배포

## 유용한 명령어

```bash
# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio

# Prisma Client 재생성
npx prisma generate

# 스키마 푸시 (변경사항 적용)
npx prisma db push

# 데이터베이스 마이그레이션
npx prisma migrate dev --name init
```

## 참고 문서

- Supabase 가이드: https://supabase.com/docs/guides/database
- Prisma 문서: https://www.prisma.io/docs
- Vercel 환경변수: https://vercel.com/docs/concepts/projects/environment-variables
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction

## 지원

문제가 발생하면 다음을 확인하세요:
1. Supabase 대시보드 로그
2. Vercel 배포 로그
3. 브라우저 개발자 콘솔

---

작성일: 2026-03-10
버전: 1.0
프로젝트: WhereKid
