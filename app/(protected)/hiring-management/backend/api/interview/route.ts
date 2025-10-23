import prisma from '@/lib/prisma';
import formatToISO from '@/lib/(utils)/date';
import { NextResponse } from 'next/server';

//  GET: Lấy tất cả interview
export async function GET() {
  try {
    // Lấy tất cả các interview
    const interviews = await prisma.interview.findMany({
      orderBy: { createdOn: 'desc' },
    });

    // Lấy danh sách candidate_activity liên quan đến các interview
    const candidateActivityIds = interviews
      .map(i => i.candidate_activity_id)
      .filter((id): id is string => typeof id === 'string' && id !== null);
  
    const candidateActivities = await prisma.candidate_activity.findMany({
      where: {
        id: { in: candidateActivityIds },
      },
    });

    // Tạo mapping từ task_id đến activity.name
    const activityIds = Array.from(
      new Set(candidateActivities.map(ca => ca.task_id).filter(Boolean))
    );
    const activities = await prisma.activity.findMany({
      where: {
        id: { in: activityIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const activityMap = new Map(activities.map(act => [act.id, act.name]));

    // Format dữ liệu interview với thông tin candidate_activity
    const formattedInterviews = interviews.map((interview) => {
      // Tìm candidate_activity liên quan dựa trên candidate_activity_id
      const relatedCandidateActivity = candidateActivities.find(
        ca => ca.id === interview.candidate_activity_id
      );
      return {
        ...interview,
        ngayPhongVan: interview.ngay ? interview.ngay : null,
        link: interview.linkExam,
        confirmed: interview.confirmed,
        activityName: relatedCandidateActivity?.task_id
          ? activityMap.get(relatedCandidateActivity.task_id) || null
          : null,
        candidateActivity: relatedCandidateActivity
          ? {
              id: relatedCandidateActivity.id,
              start_date: relatedCandidateActivity.start_date,
              end_date: relatedCandidateActivity.end_date,
              status: relatedCandidateActivity.status,
              note: relatedCandidateActivity.noteresult,
              assignee: relatedCandidateActivity.assignee,
              stage_id: relatedCandidateActivity.stage_id,
              candidate_id: relatedCandidateActivity.candidate_id,
              task_id: relatedCandidateActivity.task_id,
            }
          : null,
      };
    });

    console.log("data data", formattedInterviews);
    return NextResponse.json({ success: true, data: formattedInterviews });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
//  POST: Tạo mới interview
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("vooooooo")
    const { link, linkInterview,ngayPhongVan, idNV, createdById,type,candidate_activity_id, location } = body;

    const ngayISO = ngayPhongVan ? formatToISO(ngayPhongVan) : null;
    console.log("ngay ngay ngay",ngayISO)
    // Check ngày trùng
    if (ngayISO) {
      const existed = await prisma.interview.findFirst({
        where: { ngay: ngayISO },
      });
      if (existed) {
        return NextResponse.json(
          { success: false, message: 'Ngày này đã có lịch phỏng vấn, vui lòng chọn ngày khác' },
          { status: 400 }
        );
      }
    }
    console.log("dadadad",link, linkInterview,ngayPhongVan, idNV, createdById,type)
    const interview = await prisma.interview.create({
      data: {
        linkExam: link,
        linkInterview: linkInterview,
        ngay: ngayISO,
        idcandidate: idNV,
        type: type,
        candidate_activity_id:candidate_activity_id || null,
        location: location || null,
        createdById,
      },
    });

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 📌 PUT: Cập nhật interview
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, link,linkInterview, ngayPhongVan, idcandidate, isActive, updatedById,reject_reason,candidate_activity_id, confirmed, location, type } = body;

    // console.log('PUT request body:', body);
    // console.log('Looking for interview with id:', id);

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Tìm interview theo id trước
    let existingInterview = await prisma.interview.findUnique({ where: { id } });
    console.log('Found existing interview by id:', existingInterview);

    // Nếu không tìm thấy theo id, có thể id này là activity id
    // Tìm interview thông qua candidate_activity
    if (!existingInterview) {
      console.log('Trying to find interview by activity id:', id);
      
      // Tìm candidate_activity có task_id = id (activity id)
      const candidateActivity = await prisma.candidate_activity.findFirst({
        where: { task_id: id },
        orderBy: { start_date: 'desc' }
      });
      
      if (candidateActivity) {
        console.log('Found candidate_activity:', candidateActivity);
        
        // Tìm interview có candidate_activity_id này
        existingInterview = await prisma.interview.findFirst({
          where: { candidate_activity_id: candidateActivity.id },
          orderBy: { createdOn: 'desc' }
        });
        console.log('Found interview by candidate_activity_id:', existingInterview);
      }
    }

    // Fallback: Tìm theo candidate và type nếu vẫn không có
    if (!existingInterview && idcandidate && type) {
      console.log('Trying to find interview by idcandidate and type:', { idcandidate, type });
      existingInterview = await prisma.interview.findFirst({
        where: {
          idcandidate: idcandidate,
          type: type
        },
        orderBy: { createdOn: 'desc' }
      });
      console.log('Found existing interview by candidate and type:', existingInterview);
    }

    if (!existingInterview) {
      // Thêm debug để xem tất cả interviews hiện có
      const allInterviews = await prisma.interview.findMany({
        select: { id: true, idcandidate: true, type: true }
      });
      console.log('All interviews in database:', allInterviews);
      
      return NextResponse.json(
        { success: false, message: 'Interview record not found' },
        { status: 404 }
      );
    }

    // Sử dụng id thực của interview để update
    const interviewId = existingInterview.id;

    const updateData: any = {};
    if (link !== undefined) updateData.linkExam = link;
    if (idcandidate !== undefined) updateData.idcandidate = idcandidate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (linkInterview !== undefined) updateData.linkInterview = linkInterview;
    if (updatedById !== undefined) updateData.updatedById = updatedById;
    if ( reject_reason!== undefined) updateData.reject_reason = reject_reason;

    if (candidate_activity_id !== undefined) updateData.candidate_activity_id = candidate_activity_id;

    if (confirmed !== undefined) updateData.confirmed = confirmed;
    if (location !== undefined) updateData.location = location;
    if (ngayPhongVan !== undefined) {
      const ngayISO = ngayPhongVan ? formatToISO(ngayPhongVan) : null;

      // Check ngày trùng (không tính record hiện tại)
      if (ngayISO) {
        const existed = await prisma.interview.findFirst({
          where: {
            ngay: ngayISO,
            NOT: { id: interviewId }, // bỏ qua chính nó bằng id thực
          },
        });
        if (existed) {
          return NextResponse.json(
            { success: false, message: 'Ngày này đã có lịch phỏng vấn, vui lòng chọn ngày khác' },
            { status: 400 }
          );
        }
      }

      updateData.ngay = ngayISO;
    }

    const interview = await prisma.interview.update({
      where: { id: interviewId }, // Sử dụng id thực của interview
      data: updateData,
    });

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    console.error('Error updating interview:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Interview record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa interview theo id
// export async function DELETE(req: Request) {
//   try {
//     const body = await req.json();
//     const { id } = body;

//     if (!id) {
//       return NextResponse.json(
//         { success: false, message: 'Interview ID is required' },
//         { status: 400 }
//       );
//     }

//     await prisma.interview.delete({ where: { id } });

//     return NextResponse.json({ success: true, message: 'Interview deleted' });
//   } catch (error: any) {
//     return NextResponse.json(
//       { success: false, message: error.message },
//       { status: 500 }
//     );
//   }
// }
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Lấy interview để biết candidate_activity_id liên quan
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { candidate_activity: true },
    });

    if (!interview) {
      return NextResponse.json(
        { success: false, message: 'Interview not found' },
        { status: 404 }
      );
    }

    const candidateActivityId = interview.candidate_activity_id;

    // Xoá interview trước
    await prisma.interview.delete({ where: { id } });

    // Kiểm tra nếu candidate_activity không còn interview nào khác thì xoá luôn
    if (candidateActivityId) {
      const otherInterviews = await prisma.interview.findMany({
        where: { candidate_activity_id: candidateActivityId },
      });

      if (otherInterviews.length === 0) {
        await prisma.candidate_activity.delete({
          where: { id: candidateActivityId },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Interview and related candidate_activity deleted (if unused).' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
