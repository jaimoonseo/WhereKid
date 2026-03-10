import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();

    // Get database info
    const childCount = await prisma.child.count();
    const academyCount = await prisma.academy.count();
    const scheduleCount = await prisma.schedule.count();
    const paymentCount = await prisma.paymentPlan.count();

    // Get database metadata
    const dbInfo = {
      status: 'connected',
      provider: 'postgresql',
      counts: {
        children: childCount,
        academies: academyCount,
        schedules: scheduleCount,
        paymentPlans: paymentCount,
      },
      timestamp: new Date().toISOString(),
    };

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: '데이터베이스 연결 성공!',
      data: dbInfo,
    });
  } catch (error) {
    console.error('Database connection error:', error);

    const errorInfo = error instanceof Error ? {
      name: error.name || 'Unknown Error',
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      code: (error as { code?: string }).code || 'N/A',
    } : {
      name: 'Unknown Error',
      message: '알 수 없는 오류가 발생했습니다.',
      code: 'N/A',
    };

    return NextResponse.json({
      success: false,
      message: '데이터베이스 연결 실패',
      error: errorInfo,
    }, { status: 500 });
  }
}
