import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/schedule - Get weekly schedule
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');

    const whereClause = academyId ? { academyId: parseInt(academyId) } : {};

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        academy: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json({
      schedules,
      count: schedules.length,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules', schedules: [] },
      { status: 500 }
    );
  }
}

// POST /api/schedule - Create a new schedule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { academyId, dayOfWeek, startTime, endTime } = body;

    if (!academyId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (dayOfWeek < 1 || dayOfWeek > 5) {
      return NextResponse.json(
        { error: 'Day of week must be between 1 (Monday) and 5 (Friday)' },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        academyId: parseInt(academyId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
      },
      include: {
        academy: true,
      },
    });

    return NextResponse.json({
      schedule,
      message: 'Schedule created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
