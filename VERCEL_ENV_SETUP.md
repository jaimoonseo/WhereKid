# Vercel 환경변수 설정 가이드

## 1. Supabase 연결 정보 확인

Supabase 프로젝트에서 다음 정보를 확인하세요:

1. Supabase 대시보드 접속: https://app.supabase.com
2. 프로젝트 선택
3. **Settings** > **Database** 메뉴로 이동
4. **Connection String** 섹션에서 **URI** 확인

## 2. DATABASE_URL 형식

Supabase의 DATABASE_URL은 다음 형식입니다:

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

예시:
```
postgresql://postgres.abcdefghijklmnop:your-password@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

## 3. Vercel 환경변수 설정

### 방법 1: Vercel 웹 대시보드에서 설정

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. `wherekid` 프로젝트 선택
3. **Settings** 탭 클릭
4. 왼쪽 메뉴에서 **Environment Variables** 선택
5. 다음 변수 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | (Supabase Connection String) | Production, Preview, Development |

6. **Save** 버튼 클릭

### 방법 2: Vercel CLI로 설정

```bash
# Vercel CLI 설치 (아직 설치 안 했다면)
npm i -g vercel

# 프로젝트 디렉토리로 이동
cd /workspace/group/wherekid

# 환경변수 추가
vercel env add DATABASE_URL

# 프롬프트에 따라 입력:
# - Value: (Supabase CONNECTION_URL 붙여넣기)
# - Environment: Production, Preview, Development 모두 선택
```

## 4. 연결 풀링 설정 (권장)

Supabase는 두 가지 연결 URL을 제공합니다:

### Direct Connection (직접 연결)
- 포트: 5432
- 최대 연결 수 제한 있음
- 개발 환경에 적합

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Connection Pooling (연결 풀링) - *권장*
- 포트: 6543
- Serverless 환경에 최적화
- Vercel 배포에 권장

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Vercel 배포용으로는 Connection Pooling URL 사용을 권장합니다.**

## 5. Prisma 설정 확인

`prisma/schema.prisma` 파일에 다음 설정이 있는지 확인:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 6. 재배포

환경변수를 추가한 후 Vercel 재배포:

```bash
# Vercel CLI 사용
vercel --prod

# 또는 GitHub에 푸시하면 자동 배포됨
git add .
git commit -m "Add Supabase database connection"
git push origin main
```

## 7. 연결 테스트

배포 후 다음 엔드포인트로 데이터베이스 연결 테스트:

```
https://wherekid.vercel.app/api/children
```

정상적으로 샘플 데이터가 반환되면 설정 완료입니다.

## 8. 트러블슈팅

### 오류: "Can't reach database server"
- DATABASE_URL이 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 포트 번호 확인 (5432 또는 6543)

### 오류: "Connection pool timeout"
- Connection Pooling URL(포트 6543) 사용
- `?pgbouncer=true` 파라미터 추가 확인

### 오류: "Password authentication failed"
- Supabase 비밀번호 재확인
- URL에 특수문자가 있다면 URL 인코딩 필요

## 9. 보안 체크리스트

- ✅ DATABASE_URL을 `.env.local` 파일에 저장하고 `.gitignore`에 추가
- ✅ GitHub에 DATABASE_URL 푸시하지 않기
- ✅ Vercel 환경변수로만 관리
- ✅ Supabase RLS(Row Level Security)는 나중에 인증 구현 시 활성화 예정

## 10. 다음 단계

1. ✅ Supabase SQL 실행 (`supabase-setup.sql`)
2. ✅ Vercel 환경변수 설정 (이 가이드)
3. ⬜ Vercel 재배포
4. ⬜ API 엔드포인트 테스트
5. ⬜ 프론트엔드 UI 연결 확인

---

**참고 문서**:
- Supabase 연결 가이드: https://supabase.com/docs/guides/database/connecting-to-postgres
- Vercel 환경변수: https://vercel.com/docs/concepts/projects/environment-variables
- Prisma with Supabase: https://www.prisma.io/docs/guides/database/supabase
