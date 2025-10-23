import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import formatToISO from '@/lib/(utils)/date';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// GET: Lấy tất cả stage hoặc stage cụ thể, bao gồm ứng viên và các hoạt động của họ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hiringPipelineId = searchParams.get('hiringPipelineId');
    const stageId = searchParams.get('stageId');

    if (stageId) {
      const stage = await prisma.stage.findUnique({
        where: { id: stageId },
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
          updated_at: true,
          created_by: true,
          settings: true,
          updated_by: true,
        },
      });

      if (!stage) {
        return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
      }

      const candidates = await prisma.candidate.findMany({
        where: { stage_id: stageId },
        select: {
          id: true,
          full_name: true,
          email: true,
          birthdate: true,
          gender: true,
          position: true,
          experience: true,
          source: true,
          note: true,
          strengths: true,
          weaknesses: true,
          skills: true,
          pipeline_status: true,
          reject_reason: true,
          cv_link: true,
          fit_score: true,
          created_at: true,
          updated_at: true,
          stage_id: true,
          job: {
            select: {
              id: true,
              title: true,
              descriptions: true,
              created_at: true,
              updated_at: true,
            },
          }, // Added job relation
        },
      });

      const candidatesWithActivities = await Promise.all(
        candidates.map(async (candidate) => {
          const candidateActivities = await prisma.candidate_activity.findMany({
            where: { candidate_id: candidate.id },
            select: {
              id: true,
              start_date: true,
              end_date: true,
              status: true,
              noteresult: true,
              assignee: true,
              task_id: true,
            },
          });

          const activities = await Promise.all(
            candidateActivities.map(async (ca) => {
              const activity = await prisma.activity.findUnique({
                where: { id: ca.task_id },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  type: true,
                  created_at: true,
                  updated_at: true,
                  created_by: true,
                  updated_by: true,
                },
              });
              return {
                ...activity,
                created_at: activity ? formatToISO(activity.created_at) : null,
                updated_at: activity ? formatToISO(activity.updated_at) : null,
                candidate_activity: {
                  id: ca.id,
                  start_date: formatToISO(ca.start_date),
                  end_date: formatToISO(ca.end_date),
                  status: ca.status,
                  noteresult: ca.noteresult,
                  assignee: ca.assignee,
                },
              };
            })
          );

          return {
            ...candidate,
            birthdate: candidate.birthdate ? formatToISO(candidate.birthdate) : null,
            created_at: formatToISO(candidate.created_at),
            updated_at: formatToISO(candidate.updated_at),
            job: candidate.job
              ? {
                  ...candidate.job,
                  created_at: candidate.job.created_at ? formatToISO(candidate.job.created_at) : null,
                  updated_at: candidate.job.updated_at ? formatToISO(candidate.job.updated_at) : null,
                }
              : null, // Format job dates
            activities: activities.filter(a => a !== null),
          };
        })
      );

      return NextResponse.json({
        stage: {
          ...stage,
          created_at: formatToISO(stage.created_at),
          updated_at: formatToISO(stage.updated_at),
        },
        candidates: candidatesWithActivities,
      });
    }

    if (hiringPipelineId) {
      const stages = await prisma.stage.findMany({
        where: { hiring_pipeline_id: hiringPipelineId },
        select: {
          id: true,
          name: true,
          description: true,
          settings: true,
          created_at: true,
          updated_at: true,
          created_by: true,
          updated_by: true,
        },
      });

      const stagesWithCandidates = await Promise.all(
        stages.map(async (stage) => {
          const candidates = await prisma.candidate.findMany({
            where: { stage_id: stage.id },
            select: {
              id: true,
              full_name: true,
              email: true,
              birthdate: true,
              gender: true,
              position: true,
              experience: true,
              source: true,
              note: true,
              strengths: true,
              weaknesses: true,
              skills: true,
              pipeline_status: true,
              reject_reason: true,
              cv_link: true,
              fit_score: true,
              created_at: true,
              updated_at: true,
              stage_id: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  descriptions: true,
                  created_at: true,
                  updated_at: true,
                },
              }, // Added job relation
            },
          });

          const candidatesWithActivities = await Promise.all(
            candidates.map(async (candidate) => {
              const candidateActivities = await prisma.candidate_activity.findMany({
                where: { candidate_id: candidate.id },
                select: {
                  id: true,
                  start_date: true,
                  end_date: true,
                  status: true,
                  noteresult: true,
                  assignee: true,
                  task_id: true,
                },
              });

              const activities = await Promise.all(
                candidateActivities.map(async (ca) => {
                  const activity = await prisma.activity.findUnique({
                    where: { id: ca.task_id },
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      type: true,
                      created_at: true,
                      updated_at: true,
                      created_by: true,
                      updated_by: true,
                    },
                  });
                  return {
                    ...activity,
                    created_at: activity ? formatToISO(activity.created_at) : null,
                    updated_at: activity ? formatToISO(activity.updated_at) : null,
                    candidate_activity: {
                      id: ca.id,
                      start_date: formatToISO(ca.start_date),
                      end_date: formatToISO(ca.end_date),
                      status: ca.status,
                      noteresult: ca.noteresult,
                      assignee: ca.assignee,
                    },
                  };
                })
              );

              return {
                ...candidate,
                birthdate: candidate.birthdate ? formatToISO(candidate.birthdate) : null,
                created_at: formatToISO(candidate.created_at),
                updated_at: formatToISO(candidate.updated_at),
                job: candidate.job
                  ? {
                      ...candidate.job,
                      created_at: candidate.job.created_at ? formatToISO(candidate.job.created_at) : null,
                      updated_at: candidate.job.updated_at ? formatToISO(candidate.job.updated_at) : null,
                    }
                  : null, // Format job dates
                activities: activities.filter(a => a !== null),
              };
            })
          );

          return {
            ...stage,
            created_at: formatToISO(stage.created_at),
            updated_at: formatToISO(stage.updated_at),
            candidates: candidatesWithActivities,
          };
        })
      );

      return NextResponse.json(stagesWithCandidates);
    }

    const stages = await prisma.stage.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        settings: true,
        created_at: true,
        updated_at: true,
        created_by: true,
        updated_by: true,
      },
    });

    const stagesWithCandidates = await Promise.all(
      stages.map(async (stage) => {
        const candidates = await prisma.candidate.findMany({
          where: { stage_id: stage.id },
          select: {
            id: true,
            full_name: true,
            email: true,
            birthdate: true,
            gender: true,
            position: true,
            experience: true,
            source: true,
            note: true,
            strengths: true,
            weaknesses: true,
            skills: true,
            pipeline_status: true,
            reject_reason: true,
            cv_link: true,
            fit_score: true,
            created_at: true,
            updated_at: true,
            stage_id: true,
            job: {
              select: {
                id: true,
                title: true,
                descriptions: true,
                created_at: true,
                updated_at: true,
              },
            }, 
          },
        });

        const candidatesWithActivities = await Promise.all(
          candidates.map(async (candidate) => {
            const candidateActivities = await prisma.candidate_activity.findMany({
              where: { candidate_id: candidate.id },
              select: {
                id: true,
                start_date: true,
                end_date: true,
                status: true,
                noteresult: true,
                assignee: true,
                task_id: true,
              },
            });

            const activities = await Promise.all(
              candidateActivities.map(async (ca) => {
                const activity = await prisma.activity.findUnique({
                  where: { id: ca.task_id },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    type: true,
                    created_at: true,
                    updated_at: true,
                    created_by: true,
                    updated_by: true,
                  },
                });
                return {
                  ...activity,
                  created_at: activity ? formatToISO(activity.created_at) : null,
                  updated_at: activity ? formatToISO(activity.updated_at) : null,
                  candidate_activity: {
                    id: ca.id,
                    start_date: formatToISO(ca.start_date),
                    end_date: formatToISO(ca.end_date),
                    status: ca.status,
                    noteresult: ca.noteresult,
                    assignee: ca.assignee,
                  },
                };
              })
            );

            return {
              ...candidate,
              birthdate: candidate.birthdate ? formatToISO(candidate.birthdate) : null,
              created_at: formatToISO(candidate.created_at),
              updated_at: formatToISO(candidate.updated_at),
              job: candidate.job
                ? {
                    ...candidate.job,
                    created_at: candidate.job.created_at ? formatToISO(candidate.job.created_at) : null,
                    updated_at: candidate.job.updated_at ? formatToISO(candidate.job.updated_at) : null,
                  }
                : null, // Format job dates
              activities: activities.filter(a => a !== null),
            };
          })
        );

        return {
          ...stage,
          created_at: formatToISO(stage.created_at),
          updated_at: formatToISO(stage.updated_at),
          candidates: candidatesWithActivities,
        };
      })
    );

    return NextResponse.json(stagesWithCandidates);
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



// POST: Tạo một stage mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description,settings,hiring_pipeline_id} = body;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!name || !description ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stage = await prisma.stage.create({
      data: {
        name,
        description,
        settings:settings ,
        hiring_pipeline_id,
        created_by:session.user.id,
        updated_by:session.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
        created_by: true,
        updated_by: true,
      },
    });

    (globalThis as any)._io?.emit("stage:created", {
      stageId: stage.id,
      stageName: stage.name,
      description: stage.description,
      createdAt: stage.created_at,
    });

    return NextResponse.json({
      ...stage,
      created_at: formatToISO(stage.created_at),
      updated_at: formatToISO(stage.updated_at),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Cập nhật một stage
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, updated_by,settings } = body;

    if (!id || !name || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stage = await prisma.stage.update({
      where: { id },
      data: {
        name,
        description,
        settings: settings,
        updated_by,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
        created_by: true,
        updated_by: true,
      },
    });

    (globalThis as any)._io?.emit("stage:updated", {
      stageId: stage.id,
      stageName: stage.name,
      description: stage.description,
      updatedAt: stage.updated_at,
    });

    return NextResponse.json({
      ...stage,
      created_at: formatToISO(stage.created_at),
      updated_at: formatToISO(stage.updated_at),
    });
  } catch (error) {
    console.error('Error updating stage:', error);
    return NextResponse.json({ error: 'Stage not found or internal server error' }, { status: 500 });
  }
}

// DELETE: Xóa một stage
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing stage ID' }, { status: 400 });
    }

    await prisma.stage.delete({
      where: { id },
    });

    (globalThis as any)._io?.emit("stage:deleted", {
      stageId: id,
      deletedAt: new Date(),
    });

    return NextResponse.json({ message: 'Stage deleted successfully' });
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json({ error: 'Stage not found or internal server error' }, { status: 500 });
  }
}