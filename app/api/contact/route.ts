import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// GET - 모든 연락처 조회
export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        child: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' }, // 기본 연락처 먼저
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST - 새 연락처 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, name, phoneNumber, isDefault } = body;

    // Validation
    if (!childId || !name || !phoneNumber) {
      return NextResponse.json(
        { error: 'childId, name, phoneNumber는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: '유효하지 않은 전화번호 형식입니다.' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.contact.updateMany({
        where: { childId },
        data: { isDefault: false },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        childId,
        name,
        phoneNumber: formattedPhone,
        isDefault: isDefault || false,
      },
      include: {
        child: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Failed to create contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
