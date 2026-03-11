# Vercel 환경변수 설정 가이드

## ✅ 확인된 연결 문자열 (정상 작동)

```
postgresql://postgres.ldgdptisetpxrzkntprd:g0eI2xbnwCPVwa7d@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

## 🔧 Vercel 설정 방법

### 1. Vercel 대시보드 접속
https://vercel.com/jaimoonseo/wherekid

### 2. Settings → Environment Variables

### 3. DATABASE_URL 추가/수정
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres.ldgdptisetpxrzkntprd:g0eI2xbnwCPVwa7d@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
- **Environment**: 
  - ✅ Production
  - ✅ Preview
  - ✅ Development

### 4. 저장 후 *Redeploy*
- Deployments 탭으로 이동
- 최신 배포의 ⋮ 메뉴 클릭
- "Redeploy" 선택

## ✅ 테스트 완료

로컬에서 Prisma 연결 테스트 성공:
- 👶 아이: 1명 (우리 아이)
- 🏫 학원: 10개
- 📅 스케줄: 15개
- 💰 납부 플랜: 2개

## 📱 배포 후 테스트

https://wherekid.vercel.app/settings
"🔌 연결 테스트" 버튼 클릭하여 확인
