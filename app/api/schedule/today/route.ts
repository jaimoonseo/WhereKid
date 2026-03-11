import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getCurrentDayOfWeek,
  getCurrentTime,
  getCurrentSchedule,
  getNextScheduleAcrossDays,
  groupSchedulesByDay
} from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/schedule/today - Get today's schedule
export async function GET() {
  try {
    const currentDay = getCurrentDayOfWeek();

    // If weekend, get next week's first schedule
    if (currentDay === 0) {
      const allSchedules = await prisma.schedule.findMany({
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

      const grouped = groupSchedulesByDay(allSchedules);
      // Find Monday's first schedule
      const mondaySchedules = grouped[1] || [];
      const nextSchedule = mondaySchedules.length > 0 ? { ...mondaySchedules[0], dayOfWeek: 1 } : null;

      return NextResponse.json({
        schedules: [],
        currentSchedule: null,
        nextSchedule,
        isWeekend: true,
      });
    }

    // Get all schedules for the week
    const allSchedules = await prisma.schedule.findMany({
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

    const grouped = groupSchedulesByDay(allSchedules);
    const todaySchedules = grouped[currentDay] || [];

    const currentTime = getCurrentTime();
    const currentSchedule = getCurrentSchedule(todaySchedules, currentTime);
    const nextSchedule = getNextScheduleAcrossDays(grouped, currentDay, currentTime);

    return NextResponse.json({
      schedules: todaySchedules,
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
