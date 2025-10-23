import { PrismaClient, JobStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

const prisma = new PrismaClient();

type JobData = {
  title: string;
  descriptions?: string | null;
  requirements?: string | null;
  status: JobStatus;
  created_by?: string | null;
  updated_by?: string | null;
  jobCode: string;
  startDate?: Date | null;
  endDate?: Date | null;
  pipelineId?: string | null;
};

// POST: Tạo mới job
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userId = session.user.id;

    console.log("Backend - Session user ID:", userId);
    console.log("Backend - Received body:", body);

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create job with validated data
    const jobData: JobData = {
      title: body.title,
      descriptions: body.descriptions || null,
      requirements: body.requirements || null,
      status: body.status ?? JobStatus.DRAFT,
      pipelineId: body.pipelineId || null,
      created_by: userId,
      updated_by: userId,
      jobCode: body.jobCode,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    };

    console.log("Backend - Job data to be saved:", jobData);

    const job = await prisma.job.create({
      data: jobData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
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

    // Add stage statistics for the newly created job
    const stageStats = await prisma.candidate.groupBy({
      by: ['stage_id'],
      where: { job_id: job.id },
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

    return NextResponse.json(jobWithStats, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

// GET: Lấy danh sách jobs
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
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
      orderBy: {
        created_at: 'desc',
      },
    });

    // Get stage statistics for each job
    const jobsWithStageStats = await Promise.all(
      jobs.map(async (job) => {
        // Get candidates grouped by stage for this job
        const stageStats = await prisma.candidate.groupBy({
          by: ['stage_id'],
          where: { job_id: job.id },
          _count: {
            stage_id: true,
          },
        });

        let stages: any[] = [];
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

        return {
          ...job,
          stageCounts,
          totalCandidates: job._count.candidates,
        };
      })
    );

    return NextResponse.json(jobsWithStageStats, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật job
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userId = session.user.id;

    console.log("Backend PUT - Session user ID:", userId);
    console.log("Backend PUT - Received body:", body);

    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Lấy job hiện tại để kiểm tra pipelineId cũ
    const currentJob = await prisma.job.findUnique({
      where: { id: body.id },
      select: { pipelineId: true }
    });

    if (!currentJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Update job with user info
    const jobData: Partial<JobData> = {
      title: body.title,
      descriptions: body.descriptions || null,
      requirements: body.requirements || null,
      status: body.status ?? JobStatus.DRAFT,
      pipelineId: body.pipelineId || null,
      updated_by: userId,
      jobCode: body.jobCode,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    };

    console.log("Backend PUT - Job data to be updated:", jobData);

    const job = await prisma.job.update({
      where: { id: body.id },
      data: jobData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
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

    // Add stage statistics for the updated job
    const stageStats = await prisma.candidate.groupBy({
      by: ['stage_id'],
      where: { job_id: job.id },
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

    return NextResponse.json(jobWithStats, { status: 200 });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa job
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userId = session.user.id;

    console.log("Backend DELETE - Session user ID:", userId);
    console.log("Backend DELETE - Received body:", body);

    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id: body.id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Delete job with cascading deletes for related records
    await prisma.$transaction([
      // Delete related candidates first
      prisma.candidate.deleteMany({
        where: { job_id: body.id },
      }),
      // Delete related CV uploads
      prisma.cVUpload.deleteMany({
        where: { job_id: body.id },
      }),
      // Finally delete the job
      prisma.job.delete({
        where: { id: body.id },
      }),
    ]);

    console.log("Backend DELETE - Job deleted successfully:", body.id);

    return NextResponse.json({ message: 'Job deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}