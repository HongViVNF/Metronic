import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


// GET: Lấy danh sách ứng viên, có thể lọc theo job_id
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    
    // Build the query options
    const queryOptions: any = {
      include: {
        job: {
          select: {
            id: true,
            title: true,
            descriptions: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    };

    // Add job filter if jobId is provided
    if (jobId) {
      queryOptions.where = {
        job_id: jobId,
      };
    }

    // Fetch candidates with optional job filtering
    const candidates = await prisma.candidate.findMany(queryOptions);

    // Fetch stages for candidates that have a stage_id
    const stageIds = candidates
      .map((c) => c.stage_id)
      .filter((id): id is string => id !== null && id !== undefined);
    const stages = stageIds.length
      ? await prisma.stage.findMany({
          where: { id: { in: stageIds } },
        })
      : [];

    // Fetch candidate activities
    const candidateIds = candidates.map((c) => c.id);
    const candidateActivities = candidateIds.length
      ? await prisma.candidate_activity.findMany({
          where: { candidate_id: { in: candidateIds } },
        })
      : [];

    // Fetch activities related to candidate activities
    const taskIds = candidateActivities
      .map((a) => a.task_id)
      .filter((id): id is string => id !== null && id !== undefined);
    const activities = taskIds.length
      ? await prisma.activity.findMany({
          where: { id: { in: taskIds } },
        })
      : [];

    // Define the CandidateActivity type explicitly
    type CandidateActivity = {
      id: string;
      start_date: Date;
      end_date: Date;
      status: boolean;
      note: string;
      assignee: string;
      candidate_id: string;
      task_id: string;
      reject_reason?: string;
      created_at: Date;
    };

    // Merge data
    const merged = candidates.map((c) => {
      // Find the stage for the candidate
      const stage = stages.find((s) => s.id === c.stage_id) || null;

      // Find all activities for this candidate
      const relatedActivities = candidateActivities.filter(
        (a) => a.candidate_id === c.id
      ) as any[];

      // Get the latest activity (if any)
      const latestActivity = relatedActivities.length
        ? relatedActivities.reduce((latest: any, current: any) =>
            !latest || (current.created_at > latest.created_at ? current : latest)
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
        activity_note: latestActivity ? latestActivity.note : null,
        activity_name: activity ? activity.name : null,
      };
    });

    return NextResponse.json({ success: true, data: merged });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Lỗi khi lấy danh sách ứng viên",
        },
        { status: 500 }
      );
    }
  }

  // POST: Tạo mới candidate
  export async function POST(request: Request) {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.full_name) {
        return NextResponse.json(
          { success: false, message: 'Họ và tên là bắt buộc' },
          { status: 400 }
        );
      }

      // Validate email format if provided
      if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return NextResponse.json(
          { success: false, message: 'Email không hợp lệ' },
          { status: 400 }
        );
      }

      // Validate and parse birthdate
      let birthdate: Date | null = null;
      if (body.birthdate) {
        birthdate = new Date(body.birthdate);
        if (isNaN(birthdate.getTime())) {
          console.warn(`Invalid birthdate provided: ${body.birthdate}`);
          birthdate = null;
          return NextResponse.json(
            { success: false, message: 'Ngày sinh không hợp lệ' },
            { status: 400 }
          );
        }
      }

      // Validate experience
      let experience = null;
      if (body.experience) {
        experience = body.experience;
      }

      // Validate weaknesses and skills
      const weaknesses = body.weaknesses && body.weaknesses.trim() !== '.' ? body.weaknesses : null;
      const skills = body.skills && body.skills.trim() !== '- .' ? body.skills : null;

      // Validate pipeline status
      const validStatuses = ['NEW', 'IN_REVIEW', 'INTERVIEW', 'REJECTED', 'HIRED'];
      const pipeline_status = "pending";

      // Validate CV link
      if (body.cv_link && !body.cv_link.startsWith('https://')) {
        return NextResponse.json(
          { success: false, message: 'Link CV không hợp lệ' },
          { status: 400 }
        );
      }

      // Tự động gán stage mặc định toàn cục thay vì stage của pipeline
      let stageId = body.stage_id || null;
      if (body.job_id && !stageId) {
        // Lấy stage mặc định (hiring_pipeline_id = null, isDefault = true)
        const defaultStage = await prisma.stage.findFirst({
          where: {
            isDefault: true,
            hiring_pipeline_id: null
          },
          select: {
            id: true,
            name: true
          }
        });

        if (defaultStage) {
          stageId = defaultStage.id;
          console.log(`Auto-assigned global default stage ${stageId} (${defaultStage.name}) for new candidate`);
        }
      }

      const candidate = await prisma.candidate.create({
        data: {
          full_name: body.full_name,
          email: body.email || null,
          birthdate,
          gender: body.gender || null,
          position: body.position || null,
          experience,
          source: body.source || null,
          strengths: body.strengths || null,
          weaknesses,
          skills,
          pipeline_status,
          cv_link: body.cv_link || null,
          fit_score: body.fit_score ? Math.round(parseFloat(body.fit_score)) : null,
          stage_id: stageId,
          job_id: body.job_id || null,
        },
      });

      return NextResponse.json({ success: true, data: candidate, message: 'Tạo ứng viên thành công' });
    } catch (error: any) {
      console.error('Error in POST:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return NextResponse.json(
          { success: false, message: 'Email đã tồn tại' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: error.message || 'Lỗi khi tạo ứng viên' },
        { status: 500 }
      );
    }
  }

  export async function PUT(request: Request) {
    try {
      const body = await request.json();
  
      console.log("daddadada", body);
      if (!body.id) {
        return NextResponse.json(
          { success: false, message: 'Thiếu ID ứng viên' },
          { status: 400 }
        );
      }
  
      // Fetch the existing candidate to get the current email
      const existingCandidate = await prisma.candidate.findUnique({
        where: { id: body.id },
      });
  
      if (!existingCandidate) {
        return NextResponse.json(
          { success: false, message: 'Không tìm thấy ứng viên' },
          { status: 404 }
        );
      }
  
      // Prepare update data with only provided fields
      const updateData: any = {};
      if (body.full_name !== undefined) {
        if (!body.full_name) {
          return NextResponse.json(
            { success: false, message: 'Họ và tên là bắt buộc khi được cung cấp' },
            { status: 400 }
          );
        }
        updateData.full_name = body.full_name;
      }
      if (body.email !== undefined) {
        if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
          return NextResponse.json(
            { success: false, message: 'Email không hợp lệ' },
            { status: 400 }
          );
        }
        updateData.email = body.email || null;
      }
      if (body.birthdate !== undefined) {
        let birthdate: Date | null = null;
        if (body.birthdate) {
          let dateValue = body.birthdate;
          if (typeof body.birthdate === 'object' && 'value' in body.birthdate && body.birthdate.value) {
            dateValue = body.birthdate.value;
          }
          const parsedDate = new Date(dateValue);
          if (isNaN(parsedDate.getTime())) {
            return NextResponse.json(
              { success: false, message: 'Ngày sinh không hợp lệ' },
              { status: 400 }
            );
          }
          birthdate = parsedDate;
        }
        updateData.birthdate = birthdate;
      }
      if (body.gender !== undefined) updateData.gender = body.gender || null;
      if (body.position !== undefined) updateData.position = body.position || null;
      if (body.experience !== undefined) updateData.experience = body.experience || null;
      if (body.source !== undefined) updateData.source = body.source || null;
      if (body.strengths !== undefined) updateData.strengths = body.strengths || null;
      if (body.weaknesses !== undefined) updateData.weaknesses = body.weaknesses || null;
      if (body.reject_reason !== undefined) updateData.reject_reason = body.reject_reason || null;
      if (body.skills !== undefined) updateData.skills = body.skills || null;
      if (body.pipeline_status !== undefined) updateData.pipeline_status = body.pipeline_status || null;
      if (body.cv_link !== undefined) updateData.cv_link = body.cv_link || null;
      if (body.fit_score !== undefined) updateData.fit_score = body.fit_score ? parseFloat(body.fit_score) : null;
      if (body.stage_id !== undefined) updateData.stage_id = body.stage_id || null;
  
      // Update the candidate
      const candidate = await prisma.candidate.update({
        where: { id: body.id },
        data: updateData,
      });
  
      return NextResponse.json({ success: true, data: candidate, message: 'Cập nhật ứng viên thành công' });
    } catch (error:any) {
      console.error('Error updating candidate:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return NextResponse.json(
          { success: false, message: 'Email đã tồn tại' },
          { status: 400 }
        );
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { success: false, message: 'Không tìm thấy ứng viên' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: error.message || 'Lỗi khi cập nhật ứng viên' },
        { status: 500}
      );
    }
  }

  // DELETE: Xóa candidate theo id
  export async function DELETE(request: Request) {
    try {
      const body = await request.json();

      if (!body.id) {
        return NextResponse.json(
          { success: false, message: 'Thiếu ID ứng viên' },
          { status: 400 }
        );
      }

      await prisma.candidate.delete({
        where: { id: body.id },
      });

      return NextResponse.json({ success: true, message: 'Xóa thành công' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { success: false, message: 'Không tìm thấy ứng viên' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: error.message || 'Lỗi khi xóa ứng viên' },
        { status: 500 }
      );
    }
  }