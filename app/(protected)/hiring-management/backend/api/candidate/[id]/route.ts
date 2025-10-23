import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/candidate/[id] - Get single candidate
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            title: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },activities: {
          orderBy: {
            created_at: 'desc',
          },
          // take: 1,
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: candidate });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/candidate/[id] - Update candidate
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const candidate = await prisma.candidate.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ data: candidate });
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/candidate/[id] - Delete candidate
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await prisma.candidate.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

