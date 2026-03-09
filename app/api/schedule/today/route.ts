import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDayOfWeek, getCurrentTime, getCurrentSchedule, getNextSchedule } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/schedule/today - Get today's schedule
export async function GET() {
  try {
    const currentDay = getCurrentDayOfWeek();

    // If weekend, return empty
    if (currentDay === 0) {
      return NextResponse.json({
        schedules: [],
        currentSchedule: null,
        nextSchedule: null,
        isWeekend: true,
      });
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        dayOfWeek: currentDay,
      },
      include: {
        academy: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const currentTime = getCurrentTime();
    const currentSchedule = getCurrentSchedule(schedules, currentTime);
    const nextSchedule = getNextSchedule(schedules, currentTime);

    return NextResponse.json({
      schedules,
      currentSchedule,
      nextSchedule,
      currentTime,
      isWeekend: false,
    });
  } catch (error) {
    console.error('Error fetching today schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today schedule', schedules: [] },
      { status: 500 }
    );
  }
}
