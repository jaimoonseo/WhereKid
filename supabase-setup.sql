-- ============================================================
-- WhereKid Database Setup for Supabase
-- ============================================================
-- Instructions:
-- 1. Copy this entire script
-- 2. Open Supabase SQL Editor (https://app.supabase.com)
-- 3. Paste and execute this script
-- ============================================================

-- Step 1: Create all tables
-- ============================================================

-- Create Child table
CREATE TABLE IF NOT EXISTS "Child" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "birthdate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create Academy table
CREATE TABLE IF NOT EXISTS "Academy" (
    "id" SERIAL PRIMARY KEY,
    "childId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT "Academy_childId_fkey" FOREIGN KEY ("childId")
        REFERENCES "Child"("id") ON DELETE CASCADE
);

-- Create Schedule table
CREATE TABLE IF NOT EXISTS "Schedule" (
    "id" SERIAL PRIMARY KEY,
    "academyId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "Schedule_academyId_fkey" FOREIGN KEY ("academyId")
        REFERENCES "Academy"("id") ON DELETE CASCADE
);

-- Create PaymentPlan table
CREATE TABLE IF NOT EXISTS "PaymentPlan" (
    "id" SERIAL PRIMARY KEY,
    "academyId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentDay" INTEGER NOT NULL,
    "cycle" TEXT NOT NULL,
    CONSTRAINT "PaymentPlan_academyId_fkey" FOREIGN KEY ("academyId")
        REFERENCES "Academy"("id") ON DELETE CASCADE
);

-- Create PaymentHistory table
CREATE TABLE IF NOT EXISTS "PaymentHistory" (
    "id" SERIAL PRIMARY KEY,
    "academyId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidDate" TIMESTAMP NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "PaymentHistory_academyId_fkey" FOREIGN KEY ("academyId")
        REFERENCES "Academy"("id") ON DELETE CASCADE
);

-- Step 2: Create indexes for better performance
-- ============================================================

CREATE INDEX IF NOT EXISTS "Academy_childId_idx" ON "Academy"("childId");
CREATE INDEX IF NOT EXISTS "Schedule_academyId_idx" ON "Schedule"("academyId");
CREATE INDEX IF NOT EXISTS "PaymentPlan_academyId_idx" ON "PaymentPlan"("academyId");
CREATE INDEX IF NOT EXISTS "PaymentHistory_academyId_idx" ON "PaymentHistory"("academyId");
CREATE INDEX IF NOT EXISTS "PaymentHistory_paidDate_idx" ON "PaymentHistory"("paidDate");

-- Step 3: Disable RLS (Row Level Security) for all tables
-- ============================================================
-- Note: Enable RLS later when implementing authentication

ALTER TABLE "Child" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Academy" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Schedule" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentPlan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentHistory" DISABLE ROW LEVEL SECURITY;

-- Step 4: Insert sample data (Korean academy schedules)
-- ============================================================

-- Delete existing data first
DELETE FROM "PaymentHistory";
DELETE FROM "PaymentPlan";
DELETE FROM "Schedule";
DELETE FROM "Academy";
DELETE FROM "Child";

-- Insert sample child: 서혜원
INSERT INTO "Child" ("name", "birthdate", "createdAt") VALUES
('서혜원', '2018-01-09', NOW());

-- Insert academies for 서혜원 (childId = 1)
INSERT INTO "Academy" ("childId", "name", "category", "phone", "address", "memo", "createdAt") VALUES
(1, '줄넘기 교실', '체육', '', '', '방과후', NOW()),
(1, '영어학원', '영어', '', '', '', NOW()),
(1, '피아노 학원', '예술', '', '', '', NOW()),
(1, '미술학원', '미술', '', '', '', NOW()),
(1, '댄스 학원', '예술', '', '', '방과후', NOW()),
(1, '수학학원', '수학', '', '', '', NOW()),
(1, '축구교실', '체육', '', '', '', NOW()),
(1, '한자학원', '한자', '', '', '방과후', NOW()),
(1, '수학 교과', '수학', '', '', '', NOW());

-- Insert schedules for 서혜원
-- 줄넘기 (academyId = 1) - 월 12:55~14:20
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(1, 1, '12:55', '14:20');

-- 영어학원 (academyId = 2) - 월/수/금 16:10~17:37
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(2, 1, '16:10', '17:37'),
(2, 3, '16:10', '17:37'),
(2, 5, '16:10', '17:37');

-- 피아노 학원 (academyId = 3) - 화/목 14:00~15:00
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(3, 2, '14:00', '15:00'),
(3, 4, '14:00', '15:00');

-- 미술학원 (academyId = 4) - 화 14:40~16:10
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(4, 2, '14:40', '16:10');

-- 댄스 학원 (academyId = 5) - 수 14:00~15:15
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(5, 3, '14:00', '15:15');

-- 수학학원 (academyId = 6) - 목 15:00~16:50
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(6, 4, '15:00', '16:50');

-- 축구교실 (academyId = 7) - 목 17:10~18:10
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(7, 4, '17:10', '18:10');

-- 한자학원 (academyId = 8) - 금 12:55~14:20
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(8, 5, '12:55', '14:20');

-- 수학 교과 (academyId = 9) - 금 19:00~20:50
INSERT INTO "Schedule" ("academyId", "dayOfWeek", "startTime", "endTime") VALUES
(9, 5, '19:00', '20:50');

-- Insert payment plans
INSERT INTO "PaymentPlan" ("academyId", "amount", "paymentDay", "cycle") VALUES
(1, 0, 1, 'MONTH'),  -- 줄넘기
(2, 0, 1, 'MONTH'),  -- 영어
(3, 0, 1, 'MONTH'),  -- 피아노
(4, 0, 1, 'MONTH'),  -- 미술
(5, 0, 1, 'MONTH'),  -- 댄스
(6, 0, 1, 'MONTH'),  -- 수학
(7, 0, 1, 'MONTH'),  -- 축구
(8, 0, 1, 'MONTH'),  -- 한자
(9, 0, 1, 'MONTH');  -- 수학 교과

-- Insert payment history
INSERT INTO "PaymentHistory" ("academyId", "amount", "paidDate", "status") VALUES
(1, 0, '2026-03-01', 'PAID'),
(2, 0, '2026-03-01', 'PAID'),
(3, 0, '2026-03-01', 'PAID'),
(4, 0, '2026-03-01', 'PAID'),
(5, 0, '2026-03-01', 'PAID'),
(6, 0, '2026-03-01', 'PAID'),
(7, 0, '2026-03-01', 'PAID'),
(8, 0, '2026-03-01', 'PAID'),
(9, 0, '2026-03-01', 'PAID');

-- ============================================================
-- Setup Complete!
-- ============================================================
-- Next Steps:
-- 1. Verify tables created: Check Supabase Table Editor
-- 2. Update DATABASE_URL in Vercel environment variables
-- 3. Run: npx prisma generate
-- 4. Deploy to Vercel
-- ============================================================
