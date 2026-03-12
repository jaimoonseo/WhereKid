import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ical from 'ical-generator';

export const dynamic = 'force-dynamic';

/**
 * iCalendar Feed for WhereKid Schedules
 *
 * 사용법:
 * 1. 이 URL을 복사: https://yourdomain.com/api/calendar/feed?childId=1
 * 2. 아이폰 설정 > 캘린더 > 계정 > 계정 추가 > 기타
 * 3. "CalDAV 계정 추가" 대신 "구독 캘린더 추가" 선택
 * 4. URL 붙여넣기
 *
 * 캘린더가 자동으로 주기적으로 업데이트됩니다.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    // Default to first child if not specified
    const childIdNum = childId ? parseInt(childId) : 1;

    // Fetch child and schedules
    const child = await prisma.child.findUnique({
      where: { id: childIdNum },
      include: {
        academies: {
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Create calendar
    const calendar = ical({
      name: `${child.name} 학원 스케줄`,
      description: `${child.name}의 학원 일정 (WhereKid)`,
      timezone: 'Asia/Seoul',
      prodId: {
        company: 'WhereKid',
        product: 'Schedule Calendar',
      },
      url: request.url,
      // Refresh interval: 1 hour
      ttl: 3600,
    });

    // Generate recurring events for each schedule
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

    // Get current day of week (Monday=1, Sunday=7)
    let currentDayOfWeek = koreaTime.getDay();
    if (currentDayOfWeek === 0) currentDayOfWeek = 7;

    // Start from current week
    const startOfWeek = new Date(koreaTime);
    startOfWeek.setDate(koreaTime.getDate() - currentDayOfWeek + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    // Generate events for next 12 weeks (3 months)
    for (const academy of child.academies) {
      for (const schedule of academy.schedules) {
        // Calculate the date for this schedule in the current week
        const scheduleDate = new Date(startOfWeek);
        scheduleDate.setDate(startOfWeek.getDate() + schedule.dayOfWeek - 1);

        // Parse time (format: "HH:MM")
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

        // Set start time
        const eventStart = new Date(scheduleDate);
        eventStart.setHours(startHour, startMinute, 0, 0);

        // Set end time
        const eventEnd = new Date(scheduleDate);
        eventEnd.setHours(endHour, endMinute, 0, 0);

        // Day of week mapping for iCal (SU, MO, TU, WE, TH, FR, SA)
        const daysMap = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
        const byDay = daysMap[schedule.dayOfWeek];

        // Create recurring event
        calendar.createEvent({
          start: eventStart,
          end: eventEnd,
          summary: academy.name,
          description: `${child.name} - ${academy.name}\n${academy.category || ''}\n${academy.memo || ''}`.trim(),
          location: academy.address || undefined,
          url: academy.phone ? `tel:${academy.phone}` : undefined,
          repeating: {
            freq: 'WEEKLY',
            byDay: [byDay],
            // Repeat for 1 year
            until: new Date(startOfWeek.getFullYear() + 1, startOfWeek.getMonth(), startOfWeek.getDate()),
          },
          // Alarm: 10 minutes before
          alarms: [
            {
              type: 'display',
              trigger: 600, // 10 minutes (in seconds)
              description: `${academy.name} 10분 전`,
            },
          ],
          // Metadata
          uid: `schedule-${schedule.id}@wherekid.app`,
          sequence: 0,
          created: new Date(academy.createdAt),
          lastModified: new Date(academy.createdAt),
        });
      }
    }

    // Return iCalendar format
    const calendarString = calendar.toString();

    return new NextResponse(calendarString, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${child.name}-schedule.ics"`,
        // Cache for 1 hour
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Failed to generate calendar feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar feed' },
      { status: 500 }
    );
  }
}
