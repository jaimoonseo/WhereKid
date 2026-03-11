-- ============================================================
-- Row Level Security (RLS) Setup - 나중에 인증 구현 시 사용
-- ============================================================
-- 주의: 현재는 RLS를 비활성화한 상태로 사용합니다.
-- 인증 시스템(NextAuth, Supabase Auth 등)을 구현한 후에
-- 이 스크립트를 실행하여 RLS를 활성화하세요.
-- ============================================================

-- Step 1: Enable RLS on all tables
-- ============================================================

ALTER TABLE "Child" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Academy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentHistory" ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies for authenticated users
-- ============================================================
-- 전제: Supabase Auth를 사용하고 있다고 가정
-- auth.uid()는 현재 로그인한 사용자의 ID를 반환합니다.

-- Child table policies
-- Users can only see and manage their own children
CREATE POLICY "Users can view their own children"
    ON "Child" FOR SELECT
    USING (auth.uid()::text = "userId"); -- userId 컬럼이 필요함

CREATE POLICY "Users can insert their own children"
    ON "Child" FOR INSERT
    WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own children"
    ON "Child" FOR UPDATE
    USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own children"
    ON "Child" FOR DELETE
    USING (auth.uid()::text = "userId");

-- Academy table policies
-- Users can manage academies for their own children
CREATE POLICY "Users can view academies of their children"
    ON "Academy" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Child"
            WHERE "Child"."id" = "Academy"."childId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert academies for their children"
    ON "Academy" FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Child"
            WHERE "Child"."id" = "Academy"."childId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can update academies of their children"
    ON "Academy" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "Child"
            WHERE "Child"."id" = "Academy"."childId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete academies of their children"
    ON "Academy" FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "Child"
            WHERE "Child"."id" = "Academy"."childId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

-- Schedule table policies
CREATE POLICY "Users can view schedules of their children's academies"
    ON "Schedule" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Academy"
            JOIN "Child" ON "Academy"."childId" = "Child"."id"
            WHERE "Academy"."id" = "Schedule"."academyId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage schedules of their children's academies"
    ON "Schedule" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Academy"
            JOIN "Child" ON "Academy"."childId" = "Child"."id"
            WHERE "Academy"."id" = "Schedule"."academyId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

-- PaymentPlan table policies
CREATE POLICY "Users can view payment plans of their children's academies"
    ON "PaymentPlan" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Academy"
            JOIN "Child" ON "Academy"."childId" = "Child"."id"
            WHERE "Academy"."id" = "PaymentPlan"."academyId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage payment plans of their children's academies"
    ON "PaymentPlan" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Academy"
            JOIN "Child" ON "Academy"."childId" = "Child"."id"
            WHERE "Academy"."id" = "PaymentPlan"."academyId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

-- PaymentHistory table policies
CREATE POLICY "Users can view payment history of their children's academies"
    ON "PaymentHistory" FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Academy"
            JOIN "Child" ON "Academy"."childId" = "Child"."id"
            WHERE "Academy"."id" = "PaymentHistory"."academyId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage payment history of their children's academies"
    ON "PaymentHistory" FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Academy"
            JOIN "Child" ON "Academy"."childId" = "Child"."id"
            WHERE "Academy"."id" = "PaymentHistory"."academyId"
            AND "Child"."userId" = auth.uid()::text
        )
    );

-- ============================================================
-- 참고 사항
-- ============================================================
-- 위 정책들을 적용하려면 Child 테이블에 userId 컬럼을 추가해야 합니다:
--
-- ALTER TABLE "Child" ADD COLUMN "userId" TEXT;
-- CREATE INDEX "Child_userId_idx" ON "Child"("userId");
--
-- Prisma 스키마도 업데이트:
-- model Child {
--   id        Int       @id @default(autoincrement())
--   userId    String    // 추가
--   name      String
--   ...
-- }
-- ============================================================
