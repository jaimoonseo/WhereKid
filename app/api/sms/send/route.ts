import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSMS, sendBulkSMS, formatScheduleMessage } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// POST - SMS 전송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleId, message, contactIds, sendToDefault } = body;

    let recipients: string[] = [];

    // Option 1: Send to specific contacts
    if (contactIds && contactIds.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          id: { in: contactIds },
        },
        select: {
          phoneNumber: true,
        },
      });
      recipients = contacts.map((c) => c.phoneNumber);
    }

    // Option 2: Send to default contact
    else if (sendToDefault) {
      const defaultContacts = await prisma.contact.findMany({
        where: {
          isDefault: true,
        },
        select: {
          phoneNumber: true,
        },
      });
      recipients = defaultContacts.map((c) => c.phoneNumber);
    }

    // Option 3: If scheduleId provided, format schedule message
    let messageToSend = message;
    if (scheduleId) {
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          academy: true,
        },
      });

      if (!schedule) {
        return NextResponse.json(
          { error: 'Schedule not found' },
          { status: 404 }
        );
      }

      // Check if schedule is currently active
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const currentDayOfWeek = koreaTime.getDay() === 0 ? 7 : koreaTime.getDay();
      const currentTime = `${koreaTime.getHours().toString().padStart(2, '0')}:${koreaTime.getMinutes().toString().padStart(2, '0')}`;

      const isActive =
        schedule.dayOfWeek === currentDayOfWeek &&
        currentTime >= schedule.startTime &&
        currentTime <= schedule.endTime;

      messageToSend = formatScheduleMessage(
        schedule.academy.name,
        schedule.startTime,
        schedule.endTime,
        isActive
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: '수신자를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    if (!messageToSend) {
      return NextResponse.json(
        { error: '메시지 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // Send SMS
    const results = await sendBulkSMS(recipients, messageToSend);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
