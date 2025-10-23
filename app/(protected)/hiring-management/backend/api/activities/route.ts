
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import formatToISO from '@/lib/(utils)/date';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// GET: Lấy danh sách activities với thông tin chi tiết
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidate_id');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Lấy tất cả candidates (nếu không có filter theo candidate)
    let candidates = await prisma.candidate.findMany({
      select: {
        id: true,
        full_name: true,
        email: true, // Thêm email
        stage_id: true,
      },
    });

    // Filter candidates theo candidate_id nếu có
    if (candidateId) {
      candidates = candidates.filter(candidate => candidate.id === candidateId);
    }

    // Lấy candidate_activities với thông tin liên quan
    const candidateActivities = await prisma.candidate_activity.findMany({
      select: {
        id: true,
        task_id: true,
        candidate_id: true,
        stage_id: true,
        start_date: true,
        end_date: true,
        status: true,
        result: true, // Thêm result field
        noteresult: true, // Thêm noteresult field
        assignee: true,
        participants: true,
      },
    });

    // Lấy thông tin stage của candidates
    const candidateStageIds = [...new Set(candidates.map(c => c.stage_id).filter(Boolean))] as string[];
    const candidateStages = await prisma.stage.findMany({
      where: { id: { in: candidateStageIds } },
      select: {
        id: true,
        name: true,
      },
    });

    // Tạo mapping từ stage id sang stage name cho candidates
    const candidateStageMap = candidateStages.reduce((acc, stage) => {
      acc[stage.id] = stage.name;
      return acc;
    }, {} as Record<string, string>);

    // Filter candidates theo search query
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      candidates = candidates.filter(candidate =>
        candidate.full_name.toLowerCase().includes(searchTerm)
      );
    }

    // Filter candidate_activities chỉ lấy những cái có candidate thuộc job (nếu có filter)
    const filteredCandidateIds = candidates.map(c => c.id);
    const filteredCandidateActivities = candidateActivities.filter(ca =>
      filteredCandidateIds.includes(ca.candidate_id)
    );

    // Lấy thông tin interview liên quan
    const candidateActivityIds = filteredCandidateActivities.map(ca => ca.id);
    const interviews = await prisma.interview.findMany({
      where: {
        candidate_activity_id: { in: candidateActivityIds },
        isActive: true,
        ...(startDate && endDate && {
          ngay: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59.999Z'), // Include end of day
          }
        }),
        ...(startDate && !endDate && {
          ngay: {
            gte: new Date(startDate),
          }
        }),
        ...(endDate && !startDate && {
          ngay: {
            lte: new Date(endDate + 'T23:59:59.999Z'),
          }
        }),
      },
      select: {
        id: true,
        ngay: true,
        type: true,
        candidate_activity_id: true,
        linkInterview: true,
        location: true,
        confirmed: true,
        linkExam: true,
      },
    });

    // Tạo mapping từ candidate_activity_id sang interview
    const interviewMap = interviews.reduce((acc, interview) => {
      acc[interview.candidate_activity_id!] = interview;
      return acc;
    }, {} as Record<string, any>);

    // Lấy danh sách task_id duy nhất từ interviews (chỉ những activity có interview trong date range)
    const interviewTaskIds = [...new Set(interviews.map(i =>
      filteredCandidateActivities.find(ca => ca.id === i.candidate_activity_id)?.task_id
    ).filter(Boolean))] as string[];

    // Nếu có date filters, chỉ lấy activities có interview trong range
    let taskIds = (startDate || endDate) ? interviewTaskIds : [...new Set(filteredCandidateActivities.map(ca => ca.task_id).filter(Boolean))] as string[];

    // Lấy activities chỉ liên quan đến candidate_activity
    let activities = await prisma.activity.findMany({
      where: {
        id: { in: taskIds },
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        created_by: true,
        updated_by: true,
        created_at: true,
        updated_at: true,
        exam_id: true,
      },
    });

    // Filter activities theo search query (tên activity)
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      activities = activities.filter(activity =>
        (activity.name && activity.name.toLowerCase().includes(searchTerm)) ||
        (activity.description && activity.description.toLowerCase().includes(searchTerm))
      );

      // Cập nhật taskIds để chỉ include activities phù hợp
      const filteredActivityIds = activities.map(a => a.id);
      taskIds = taskIds.filter(id => filteredActivityIds.includes(id));
    }

    // Lấy thông tin exam nếu có activity có exam_id
    const examIds = [...new Set(activities.map(a => a.exam_id).filter(Boolean))] as string[];
    const exams = await prisma.examHR.findMany({
      where: {
        id: { in: examIds },
      },
      select: {
        id: true,
        title: true,
        code: true,
        duration: true,
        questionCount: true,
        startDate: true,
        endDate: true,
        settings: true,
      },
    });

    // Lấy thông tin kết quả thi từ BaiThiHR thông qua ExamAssignment
    const examAssignments = await prisma.examAssignment.findMany({
      where: {
        candidate_activity_id: { in: candidateActivityIds },
        baiThiHR_id: { not: null }, // Chỉ lấy những assignment đã có kết quả thi
      },
      select: {
        id: true,
        candidate_activity_id: true,
        baiThiHR: {
          select: {
            id: true,
            nhanVienId: true,
            idexam: true,
            diem: true,
            soCauDung: true,
            ngayVaoThi: true,
            ngaynop: true,
            solanthi: true,
          },
        },
      },
    });

    // Tạo mapping từ candidate_activity_id sang kết quả thi
    const examResultMap = examAssignments.reduce((acc, assignment) => {
      if (assignment.candidate_activity_id && assignment.baiThiHR) {
        acc[assignment.candidate_activity_id] = assignment.baiThiHR;
      }
      return acc;
    }, {} as Record<string, any>);

    // Tạo mapping từ exam id sang exam info
    const examMap = exams.reduce((acc, exam) => {
      acc[exam.id] = exam;
      return acc;
    }, {} as Record<string, any>);

    // Merge dữ liệu
    const merged = await Promise.all(
      activities.map(async (activity) => {
        const relatedCandidateActivities = filteredCandidateActivities.filter(
          ca => activity.id === ca.task_id
        );

        // Tạo relatedCandidates từ relatedCandidateActivities
        const relatedCandidates = relatedCandidateActivities.map(ca => {
          const candidate = candidates.find(c => c.id === ca.candidate_id);
          const interview = interviewMap[ca.id];
          return {
            candidate_id: ca.candidate_id,
            candidate_name: candidate ? candidate.full_name : null,
            candidate_email: candidate ? candidate.email : null, // Thêm email
            stage_name: (candidate && candidate.stage_id) ? candidateStageMap[candidate.stage_id] || 'Unknown' : 'Unknown',
            start_date: formatToISO(ca.start_date),
            end_date: formatToISO(ca.end_date),
            status: ca.status,
            result: ca.result, // Thêm result field
            candidate_activity_id: ca.id,
            noteresult: ca.noteresult, // Thêm noteresult field
            assignee: ca.assignee,
            interview_date: interview?.ngay ? formatToISO(interview.ngay) : null,
            interview_link: interview?.linkExam || null,
            interview_location: interview?.location || null,
            interview_id: interview?.id || null,
            interview_confirmed: interview?.confirmed || false,
            interview_type: interview?.type || null, // Thêm interview_type từ bảng Interview
          };
        });

        return {
          id: activity.id,
          name: activity.name,
          description: activity.description,
          type: activity.type,
          created_by: activity.created_by,
          updated_by: activity.updated_by,
          created_at: formatToISO(activity.created_at),
          updated_at: formatToISO(activity.updated_at),
          exam_id: activity.exam_id,
          participants: relatedCandidateActivities[0]?.participants || [], // Thêm participants từ candidate_activity
          exam: activity.exam_id ? examMap[activity.exam_id] : null,
          exam_result: activity.exam_id && relatedCandidateActivities[0] ? examResultMap[relatedCandidateActivities[0].id] || null : null,
          candidates: relatedCandidates,
        };
      })
    );

    return NextResponse.json({ success: true, data: merged, activities: merged });
  } catch (error: any) {
    return NextResponse.json(
      { status: 500 }
    );
  }
}

// POST: Tạo activity mới và liên kết nhiều ứng viên
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const {
      name,
      description,
      type,
      created_by,
      updated_by,
      candidates = [], // [{ candidate_id, stage_id, start_date, end_date, status, assignee, check_list?, activity_status?, result? }]
      exam_id, // Optional exam ID to create exam assignments
      participants = [], // Danh sách user IDs tham gia
      // Thêm activity_status và result cho tất cả candidates
      activity_status,
      result,
    } = body;

    // Require at least one candidate since Activity model has required candidateId
    if (candidates.length === 0) {
      return NextResponse.json({ error: 'At least one candidate is required to create an activity' }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        name,
        description,
        type,
        created_by: session.user.id || "",
        updated_by: session.user.id || "",
        created_at: new Date(),
        updated_at: new Date(),
        candidateId: candidates[0].candidate_id, // Use first candidate as the primary candidate
        exam_id: exam_id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        created_at: true,
        updated_at: true,
        created_by: true,
        updated_by: true,
        exam_id: true, // Thêm exam_id để trả về thông tin đề thi
      },
    });

    // Tạo bản ghi trong candidate_activity nếu có candidates
    if (candidates.length > 0) {
      const candidateActivityData = candidates.map((candidate: any) => ({
        candidate_id: candidate.candidate_id,
        stage_id: candidate.stage_id,
        task_id: activity.id,
        start_date: new Date(candidate.start_date),
        end_date: new Date(candidate.end_date),
        status: candidate.activity_status || activity_status || 'in_progress', // Sử dụng activity_status từ candidate hoặc global
        assignee: candidate.assignee ?? created_by,
        participants: participants, // Thêm participants vào candidate_activity
        check_list: candidate.check_list ?? undefined,
        result: candidate.result || result, // Sử dụng result từ candidate hoặc global
      }));

      const createdCandidateActivities = await prisma.candidate_activity.createMany({
        data: candidateActivityData,
      });

      // Fetch the created candidate_activity records to get their IDs
      const candidateActivities = await prisma.candidate_activity.findMany({
        where: {
          task_id: activity.id,
        },
        select: {
          id: true,
          candidate_id: true,
        },
      });

      // Create ExamAssignment records if exam_id is provided
      if (exam_id) {
        const examAssignmentData = candidateActivities.map((ca) => ({
          candidate_id: ca.candidate_id,
          exam_id: exam_id,
          candidate_activity_id: ca.id,
          created_by: session.user.id || "",
        }));

        await prisma.examAssignment.createMany({
          data: examAssignmentData,
        });
      }

      return NextResponse.json({
        activity: {
          ...activity,
          created_at: formatToISO(activity.created_at),
          updated_at: formatToISO(activity.updated_at),
        },
        candidates: candidates.map((candidate: any) => {
          const activityRecord = candidateActivities.find(ca => ca.candidate_id === candidate.candidate_id);
          return {
            ...candidate,
            candidate_activity_id: activityRecord?.id || null,
          };
        }),
      }, { status: 201 });
    }

    return NextResponse.json({
      activity: {
        ...activity,
        created_at: formatToISO(activity.created_at),
        updated_at: formatToISO(activity.updated_at),
      },
      candidates: candidates.length > 0 ? candidates : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Cập nhật activity và danh sách ứng viên liên quan
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      type,
      updated_by,
      check_list,
      exam_id, // Thêm exam_id parameter
      participants = [], // Thêm participants parameter
      candidates = [], // [{ candidate_id, stage_id, start_date, end_date, status, assignee, check_list?, activity_status?, result? }]
      // Thêm interview parameters
      interview_date,
      interview_link,
      interview_location,
      interview_confirmed,
      // Thêm activity_status và result cho tất cả candidates
      activity_status,
      result,
    } = body;

    if (!id || !updated_by) {
      return NextResponse.json({ error: 'Missing required fields: id, updated_by' }, { status: 400 });
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        name,
        description,
        type,
        exam_id, // Thêm exam_id vào update
        updated_by,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        created_at: true,
        updated_at: true,
        created_by: true,
        updated_by: true,
        exam_id: true, // Thêm exam_id để trả về thông tin đề thi
      },
    });

    // Xóa candidate_activity cũ và tạo mới
    if (candidates.length > 0) {
      await prisma.candidate_activity.deleteMany({
        where: { task_id: id },
      });

      const candidateActivityData = candidates.map((candidate: any) => ({
        candidate_id: candidate.candidate_id,
        stage_id: candidate.stage_id,
        task_id: id,
        start_date: new Date(candidate.start_date),
        end_date: new Date(candidate.end_date),
        status: candidate.activity_status || activity_status || 'in_progress', // Sử dụng activity_status từ candidate hoặc global
        assignee: candidate.assignee ?? updated_by,
        participants: participants, // Thêm participants vào candidate_activity
        check_list: candidate.check_list ?? undefined,
        result: candidate.result || result, // Sử dụng result từ candidate hoặc global
      }));

      await prisma.candidate_activity.createMany({
        data: candidateActivityData,
      });
    }

    // Handle interview update - chỉ update nếu có candidate đầu tiên
    if (candidates.length > 0) {
      const firstCandidateId = candidates[0].candidate_id;

      // Tìm candidate_activity mới được tạo
      const newCandidateActivity = await prisma.candidate_activity.findFirst({
        where: {
          task_id: id,
          candidate_id: firstCandidateId,
        },
        select: { id: true },
      });

      if (newCandidateActivity) {
        // Kiểm tra xem đã có interview chưa
        const existingInterview = await prisma.interview.findFirst({
          where: {
            candidate_activity_id: newCandidateActivity.id,
            isActive: true,
          },
        });

        if (existingInterview) {
          // Update interview existing
          await prisma.interview.update({
            where: { id: existingInterview.id },
            data: {
              ngay: interview_date ? new Date(interview_date) : undefined,
              linkExam: interview_link || undefined,
              location: interview_location || undefined,
              confirmed: interview_confirmed ?? undefined,
              updatedOn: new Date(),
            },
          });
        } else if (interview_date || interview_link || interview_location) {
          // Create new interview nếu có dữ liệu
          await prisma.interview.create({
            data: {
              candidate_activity_id: newCandidateActivity.id,
              ngay: interview_date ? new Date(interview_date) : new Date(),
              type: type === 'interview' ? 'online' : 'offline',
              linkExam: interview_link || undefined,
              location: interview_location || undefined,
              confirmed: interview_confirmed ?? false,
              isActive: true,
              createdOn: new Date(),
              updatedOn: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      activity: {
        ...activity,
        created_at: formatToISO(activity.created_at),
        updated_at: formatToISO(activity.updated_at),
      },
      candidates: candidates.length > 0 ? candidates : undefined,
    });
  } catch (error) {
    console.error('Error updating activity result:', error);
    return NextResponse.json({ error: 'Failed to update activity result' }, { status: 500 });
  }
}

// PATCH: Cập nhật result, noteresult hoặc status của candidate_activity
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { candidate_activity_id, result, noteresult, status, updated_by } = body;

    if (!candidate_activity_id || !updated_by) {
      return NextResponse.json({ error: 'Missing required fields: candidate_activity_id, updated_by' }, { status: 400 });
    }

    // Validate result values if provided
    if (result) {
      const validResults = ['pending', 'pass', 'fail'];
      if (!validResults.includes(result)) {
        return NextResponse.json({ error: 'Invalid result value. Must be: pending, pass, or fail' }, { status: 400 });
      }
    }

    // Validate status values if provided
    if (status !== undefined) {
      const validStatuses = ['in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value. Must be: in_progress, completed, or cancelled' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (result) {
      updateData.result = result; // Enable result field
    }
    if (noteresult !== undefined) {
      updateData.noteresult = noteresult;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedCandidateActivity = await prisma.candidate_activity.update({
      where: { id: candidate_activity_id },
      data: updateData,
      select: {
        id: true,
        task_id: true,
        candidate_id: true,
        status: true,
        result: true, // Enable result field
        noteresult: true,
      },
    });

    return NextResponse.json({
      success: true,
      candidate_activity: updatedCandidateActivity,
    });
  } catch (error) {
    console.error('Error updating candidate activity:', error);
    return NextResponse.json({ error: 'Failed to update candidate activity' }, { status: 500 });
  }
}

// DELETE: Xóa activity và tất cả bản ghi liên quan
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing activity ID' }, { status: 400 });
    }

    // Lấy danh sách candidate_activity liên quan để xóa các bản ghi phụ thuộc
    const candidateActivities = await prisma.candidate_activity.findMany({
      where: { task_id: id },
      select: { id: true },
    });

    const candidateActivityIds = candidateActivities.map(ca => ca.id);

    if (candidateActivityIds.length > 0) {
      // Lấy danh sách BaiThiHR IDs để xóa
      const baiThiHRIds = await prisma.examAssignment.findMany({
        where: {
          candidate_activity_id: { in: candidateActivityIds },
          baiThiHR_id: { not: null },
        },
        select: {
          baiThiHR_id: true,
        },
      });

      const baiThiIds = baiThiHRIds.map(assignment => assignment.baiThiHR_id).filter(Boolean) as string[];

      // Xóa BaiThiHR records
      if (baiThiIds.length > 0) {
        await prisma.baiThiHR.deleteMany({
          where: { id: { in: baiThiIds } },
        });
      }

      // Xóa exam assignments (sẽ cascade xóa BaiThiHR nếu còn)
      await prisma.examAssignment.deleteMany({
        where: { candidate_activity_id: { in: candidateActivityIds } },
      });

      // Xóa interview records (cascade delete sẽ tự động xóa)
      await prisma.interview.deleteMany({
        where: { candidate_activity_id: { in: candidateActivityIds } },
      });
    }

    // Xóa tất cả bản ghi trong candidate_activity liên quan đến activity
    await prisma.candidate_activity.deleteMany({
      where: { task_id: id },
    });

    // Xóa activity
    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Activity and all related records deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Activity not found or internal server error' }, { status: 500 });
  }
}
