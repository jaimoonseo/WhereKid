import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUpcomingPayments } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/payment/upcoming - Get upcoming payments
export async function GET() {
  try {
    const paymentPlans = await prisma.paymentPlan.findMany({
      include: {
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const upcomingPayments = getUpcomingPayments(paymentPlans);

    return NextResponse.json({
      payments: upcomingPayments,
      count: upcomingPayments.length,
    });
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming payments', payments: [] },
      { status: 500 }
    );
  }
}
