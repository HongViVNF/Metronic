import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = params.id;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    const total = await prisma.candidate.count({
      where: { job_id: jobId },
    });

    const candidates = await prisma.candidate.findMany({
      where: { job_id: jobId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            descriptions: true,
            requirements: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    });

    const stageIds = candidates
      .map((c) => c.stage_id)
      .filter((id): id is string => id !== null && id !== undefined);
    const stages = stageIds.length
      ? await prisma.stage.findMany({
          where: { id: { in: stageIds } },
        })
      : [];

    const candidateIds = candidates.map((c) => c.id);
    const candidateActivities = candidateIds.length
      ? await prisma.candidate_activity.findMany({
          where: { candidate_id: { in: candidateIds } },
        })
      : [];

    const taskIds = candidateActivities
      .map((a) => a.task_id)
      .filter((id): id is string => id !== null && id !== undefined);
    const activities = taskIds.length
      ? await prisma.activity.findMany({
          where: { id: { in: taskIds } },
        })
      : [];

    const merged = candidates.map((c) => {
      const stage = stages.find((s) => s.id === c.stage_id) || null;

      const relatedActivities = candidateActivities.filter(
        (a) => a.candidate_id === c.id
      );

      const latestActivity = relatedActivities.length
        ? relatedActivities.reduce((latest, current) =>
            !latest || (current.start_date > latest.start_date ? current : latest)
          )
        : null;

      // Find the activity details for the latest activity's task_id
      const activity = latestActivity
        ? activities.find((act) => act.id === latestActivity.task_id) || null
        : null;

      return {
        ...c,
        stage_name: stage ? stage.name : null,
        active_status: latestActivity ? latestActivity.status : null,
        activity_note: latestActivity ? latestActivity.noteresult : null,
        activity_name: activity ? activity.name : null,
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: merged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error: any) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi khi lấy danh sách ứng viên" },
      { status: 500 }
    );
  }
}