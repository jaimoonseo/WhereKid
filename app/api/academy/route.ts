import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/academy - Get all academies
export async function GET() {
  try {
    const academies = await prisma.academy.findMany({
      include: {
        schedules: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      academies,
      count: academies.length,
    });
  } catch (error) {
    console.error('Error fetching academies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academies', academies: [] },
      { status: 500 }
    );
  }
}

// POST /api/academy - Create a new academy
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, phone, address, memo } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Academy name is required' },
        { status: 400 }
      );
    }

    // For MVP, assume single child with id=1
    // Will be created by seed data
    const academy = await prisma.academy.create({
      data: {
        childId: 1,
        name,
        category: category || null,
        phone: phone || null,
        address: address || null,
        memo: memo || null,
      },
    });

    return NextResponse.json({
      academy,
      message: 'Academy created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating academy:', error);
    return NextResponse.json(
      { error: 'Failed to create academy' },
      { status: 500 }
    );
  }
}
