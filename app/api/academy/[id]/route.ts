import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE /api/academy/[id] - Delete academy (and related schedules/payments)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid academy ID' },
        { status: 400 }
      );
    }

    // Prisma will cascade delete related schedules and payments
    await prisma.academy.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Academy deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting academy:', error);
    return NextResponse.json(
      { error: 'Failed to delete academy' },
      { status: 500 }
    );
  }
}
