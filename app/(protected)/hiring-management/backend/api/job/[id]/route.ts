import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            candidates: true,
            cv_uploads: true,
          },
        }, 
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Add stage statistics for the job
    const stageStats = await prisma.candidate.groupBy({
      by: ['stage_id'],
      where: { job_id: params.id },
      _count: {
        stage_id: true,
      },
    });

    let stages: Array<{ id: string; name: string; settings: any; created_at: Date }> = [];
    let stageCounts: number[] = [];

    if (job.pipelineId) {
      // Get all stages for this job's pipeline
      stages = await prisma.stage.findMany({
        where: { hiring_pipeline_id: job.pipelineId },
        select: { id: true, name: true, settings: true, created_at: true },
      });

      // Sort stages by settings.order if available, otherwise by created_at
      stages.sort((a, b) => {
        const orderA = (a.settings as any)?.order ?? Infinity;
        const orderB = (b.settings as any)?.order ?? Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      // Create stage counts array for all stages in pipeline
      stageCounts = stages.map(stage => {
        const stat = stageStats.find(s => s.stage_id === stage.id);
        return stat ? stat._count.stage_id : 0;
      });
    } else {
      // If no pipeline, only include stages that have candidates
      const stageIds = stageStats
        .map(stat => stat.stage_id)
        .filter((id): id is string => id !== null);

      if (stageIds.length > 0) {
        stages = await prisma.stage.findMany({
          where: { id: { in: stageIds } },
          select: { id: true, name: true, settings: true, created_at: true },
          orderBy: { created_at: 'asc' }
        });

        stageCounts = stages.map(stage => {
          const stat = stageStats.find(s => s.stage_id === stage.id);
          return stat ? stat._count.stage_id : 0;
        });
      }
    }

    const jobWithStats = {
      ...job,
      stageCounts,
      totalCandidates: job._count.candidates,
    };

    return NextResponse.json(jobWithStats);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
