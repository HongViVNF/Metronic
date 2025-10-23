import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/backend/lib/prisma';
import formatToISO from '@/app/elearning/backend/(utils)/date';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stageId = params.id;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    // Lấy stage với candidates
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        candidates: {
          where: jobId ? { job_id: jobId } : undefined,
          include: {
            job: {
              select: {
                id: true,
                title: true,
              },
            },
            stage: {
              select: {
                id: true,
                name: true,
              },
            },
            activities: {
              orderBy: {
                created_at: 'desc',
              },
              // take: 1,
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // Format dates
    const formattedStage = {
      ...stage,
      created_at: formatToISO(stage.created_at),
      updated_at: formatToISO(stage.updated_at),
      candidates: stage.candidates.map(candidate => ({
        ...candidate,
        created_at: formatToISO(candidate.created_at),
        updated_at: formatToISO(candidate.updated_at),
        activities: candidate.activities?.map(activity => ({
          ...activity,
          created_at: formatToISO(activity.created_at),
        })),
      })),
    };

    return NextResponse.json(formattedStage);
  } catch (error) {
    console.error('Error fetching stage candidates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
