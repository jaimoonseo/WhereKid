import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/payment - Get all payment plans
export async function GET() {
  try {
    const payments = await prisma.paymentPlan.findMany({
      include: {
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        paymentDay: 'asc',
      },
    });

    return NextResponse.json({
      payments,
      count: payments.length,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', payments: [] },
      { status: 500 }
    );
  }
}

// POST /api/payment - Create a new payment plan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { academyId, amount, paymentDay, cycle } = body;

    if (!academyId || !amount || !paymentDay || !cycle) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (cycle !== 'MONTH' && cycle !== 'WEEK') {
      return NextResponse.json(
        { error: 'Cycle must be MONTH or WEEK' },
        { status: 400 }
      );
    }

    const payment = await prisma.paymentPlan.create({
      data: {
        academyId: parseInt(academyId),
        amount: parseInt(amount),
        paymentDay: parseInt(paymentDay),
        cycle,
      },
      include: {
        academy: true,
      },
    });

    return NextResponse.json({
      payment,
      message: 'Payment plan created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
