import prisma from '@/lib/prisma';
import formatToISO from '@/lib/(utils)/date';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

// ================== GET ==================
// Lấy 1 hoặc nhiều HiringPipeline (dùng query parameter id để lấy 1 pipeline)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const pipeline = await prisma.hiringPipeline.findUnique({
        where: { id },
        include: { stages: true },
      });
      return NextResponse.json(pipeline);
    }

    const pipelines = await prisma.hiringPipeline.findMany({
      include: { stages: true },
    });
    return NextResponse.json(pipelines);
  } catch (error) {
    console.error('GET HiringPipeline error:', error);
    return NextResponse.json({ error: 'Failed to fetch pipelines' }, { status: 500 });
  }
}

// ================== POST ==================
// Tạo mới HiringPipeline
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { name, descriptions } = body;

    const newPipeline = await prisma.hiringPipeline.create({
      data: {
        name,
        descriptions,
        created_by: session.user?.email ?? 'system',
        updated_by: session.user?.email ?? 'system',
        created_at: formatToISO(new Date()),
      },
    });

    return NextResponse.json(newPipeline);
  } catch (error) {
    console.error('POST HiringPipeline error:', error);
    return NextResponse.json({ error: 'Failed to create pipeline' }, { status: 500 });
  }
}

// ================== PUT ==================
// Cập nhật HiringPipeline (body phải có id)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { id, name, descriptions } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updatedPipeline = await prisma.hiringPipeline.update({
      where: { id },
      data: {
        name,
        descriptions,
        updated_by: session.user?.email ?? 'system',
        updated_at: formatToISO(new Date()),
      },
    });

    return NextResponse.json(updatedPipeline);
  } catch (error) {
    console.error('PUT HiringPipeline error:', error);
    return NextResponse.json({ error: 'Failed to update pipeline' }, { status: 500 });
  }
}

// ================== DELETE ==================
// Xoá HiringPipeline (body phải có id)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.hiringPipeline.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Pipeline deleted successfully' });
  } catch (error) {
    console.error('DELETE HiringPipeline error:', error);
    return NextResponse.json({ error: 'Failed to delete pipeline' }, { status: 500 });
  }
}
