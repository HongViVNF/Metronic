import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// ================== PUT ==================
// Cập nhật pipelineId cho một công việc và cập nhật stage cho candidates
export async function PUT(request: Request, { params }: { params: { jobId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;
    const body = await request.json();
    const { pipelineId } = body;

    // Kiểm tra jobId
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid jobId' }, { status: 400 });
    }

    // Kiểm tra pipelineId (có thể là null để xóa pipeline)
    if (pipelineId !== null && (typeof pipelineId !== 'string' || pipelineId === '')) {
      return NextResponse.json({ error: 'Invalid pipelineId format' }, { status: 400 });
    }

    // Kiểm tra job tồn tại
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Kiểm tra pipeline tồn tại (nếu pipelineId không null)
    if (pipelineId) {
      const pipeline = await prisma.hiringPipeline.findUnique({ where: { id: pipelineId } });
      if (!pipeline) {
        return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
      }
    }

    // Cập nhật pipelineId cho job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        pipelineId: pipelineId || null, // Cho phép xóa pipeline bằng cách gửi null
        updated_by: session.user?.email ?? 'system',
        updated_at: new Date(),
      },
      include: {
        pipeline: true, // Bao gồm thông tin pipeline để trả về
      },
    });

    // Nếu có pipelineId mới, cập nhật stage cho tất cả candidates của job
    if (pipelineId) {
      // Lấy stage đầu tiên của pipeline mới
      const stages = await prisma.stage.findMany({
        where: { hiring_pipeline_id: pipelineId },
        select: {
          id: true,
          name: true,
          settings: true,
          created_at: true,
        },
      });

      // Sắp xếp theo settings.order, nếu không có thì theo created_at
      const sortedStages = stages.sort((a, b) => {
        const orderA = (a.settings as any)?.order ?? Infinity;
        const orderB = (b.settings as any)?.order ?? Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const firstStage = sortedStages[0];

      if (firstStage) {
        // Cập nhật tất cả candidates chưa có stage của job này với stage mới
        await prisma.candidate.updateMany({
          where: {
            job_id: jobId,
            stage_id: null, // Chỉ cập nhật candidates chưa có stage
          },
          data: {
            stage_id: firstStage.id,
            updated_at: new Date(),
          },
        });

        // Phát sự kiện realtime cho client
        (globalThis as any)._io?.emit("candidates:stageUpdated", {
          jobId,
          stageId: firstStage.id,
          stageName: firstStage.name,
          updatedAt: new Date(),
        });
      }
    } else {
      // Nếu pipelineId là null (xóa pipeline), có thể xóa stage_id của candidates
      await prisma.candidate.updateMany({
        where: { job_id: jobId },
        data: {
          stage_id: null,
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json(updatedJob, { status: 200 });
  } catch (error) {
    console.error('PUT Job Pipeline error:', error);
    return NextResponse.json({ error: 'Failed to update job pipeline' }, { status: 500 });
  }
}