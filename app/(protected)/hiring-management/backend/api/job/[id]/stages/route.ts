import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/backend/lib/prisma';
import formatToISO from '@/app/elearning/backend/(utils)/date';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        pipelineId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.pipelineId) {
      return NextResponse.json({ stages: [] });
    }

    const stages = await prisma.stage.findMany({
      where: { hiring_pipeline_id: job.pipelineId },
      include: {
        candidates: {
          where: { job_id: jobId }, 
          include: {
            job: {
              select: { id: true, title: true },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    const candidateIds = stages.flatMap(stage => stage.candidates.map(c => c.id));
    const candidateActivities = candidateIds.length
      ? await prisma.candidate_activity.findMany({
          where: { candidate_id: { in: candidateIds } },
          orderBy: { start_date: 'desc' },
        })
      : [];

    const taskIds = candidateActivities
      .map((ca) => ca.task_id)
      .filter((id): id is string => id !== null && id !== undefined);
    const activities = taskIds.length
      ? await prisma.activity.findMany({
          where: { id: { in: taskIds } },
        })
      : [];

    const formattedStages = stages
      .map(stage => ({
        ...stage,
        created_at: formatToISO(stage.created_at),
        updated_at: formatToISO(stage.updated_at),
        candidates: stage.candidates.map(candidate => {
          const relatedActivities = candidateActivities.filter(
            (ca: any) => ca.candidate_id === candidate.id
          );

          const latestActivity = relatedActivities.length
            ? relatedActivities.reduce((latest, current) =>
                !latest || (current.start_date > latest.start_date ? current : latest)
              )
            : null;

          const activity = latestActivity
            ? activities.find((act: any) => act.id === latestActivity.task_id) || null
            : null;

          return {
            ...candidate,
            created_at: formatToISO(candidate.created_at),
            updated_at: formatToISO(candidate.updated_at),
            stage_name: stage.name || null,
            active_status: latestActivity ? latestActivity.status : null,
            activity_note: latestActivity ? latestActivity.noteresult : null,
            activity_name: activity ? activity.name : null,
            activities: candidateActivities
              .filter((ca: any) => ca.candidate_id === candidate.id)
              .map((ca: any) => {
                const activityDetail = activities.find((act: any) => act.id === ca.task_id);
                return {
                  id: ca.task_id,
                  name: activityDetail?.name || `Activity ${ca.task_id}`,
                  status: ca.status,
                  start_date: ca.start_date,
                  end_date: ca.end_date,
                  note: ca.note,
                };
              })
              .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
          };
        }),
      }))
      .sort((a, b) => {
        const orderA = (a.settings as any)?.order || 0;
        const orderB = (b.settings as any)?.order || 0;
        return orderA - orderB;
      });

    return NextResponse.json({ stages: formattedStages });
  } catch (error) {
    console.error('Error fetching job stages with candidates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
