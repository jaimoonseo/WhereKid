import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// DELETE - 연락처 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}

// PUT - 연락처 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, phoneNumber, isDefault } = body;

    // Validation
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: '유효하지 않은 전화번호 형식입니다.' },
        { status: 400 }
      );
    }

    // Get current contact to find childId
    const currentContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!currentContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.contact.updateMany({
        where: { childId: currentContact.childId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber: formatPhoneNumber(phoneNumber) }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: {
        child: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Failed to update contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}
