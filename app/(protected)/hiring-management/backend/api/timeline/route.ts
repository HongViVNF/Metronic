import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  end_timestamp?: Date;
  details?: any;
  status: string;
}

// GET: Lấy timeline của ứng viên
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidate_id');

    if (!candidateId) {
      return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 });
    }

    const timeline: TimelineEvent[] = [];

    // 1. Thông tin ứng tuyển ban đầu
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        full_name: true,
        email: true,
        position: true,
        source: true,
        created_at: true,
        cv_link: true,
        fit_score: true,
        pipeline_status: true,
        stage: {
          select: {
            name: true
          }
        },
        job_id: true
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Get job title if job_id exists
    let jobTitle: string | null = null;
    if (candidate.job_id) {
      const job = await prisma.job.findUnique({
        where: { id: candidate.job_id },
        select: { title: true }
      });
      jobTitle = job?.title || null;
    }

    // Thêm event ứng tuyển
    timeline.push({
      id: 'application',
      type: 'application',
      title: 'Thông tin ứng tuyển ban đầu',
      description: 'Ứng viên nộp hồ sơ ứng tuyển',
      timestamp: candidate.created_at,
      details: {
        position: candidate.position || jobTitle,
        email: candidate.email,
        source: candidate.source,
        cv_link: candidate.cv_link,
        fit_score: candidate.fit_score
      },
      status: 'completed'
    });

    // 2. CV upload events (nếu có CV)
    if (candidate.cv_link) {
      timeline.push({
        id: 'cv_upload',
        type: 'cv_upload',
        title: 'CV đã tải lên',
        description: 'CV được tải lên và phân tích thành công',
        timestamp: candidate.created_at, // Sử dụng thời gian tạo candidate
        details: {
          fit_score: candidate.fit_score,
          cv_link: candidate.cv_link
        },
        status: 'completed'
      });
    }

    // 3. Activities và Interviews
    const candidateActivities = await prisma.candidate_activity.findMany({
      where: { candidate_id: candidateId },
      include: {
        interviews: {
          where: { isActive: true }
        }
      },
      orderBy: { start_date: 'asc' }
    });

    // Get activity details separately
    const activityIds = candidateActivities.map(ca => ca.task_id).filter(Boolean);
    const activities = await prisma.activity.findMany({
      where: { id: { in: activityIds } }
    });
    const activityMap = new Map(activities.map(a => [a.id, a]));

    for (const ca of candidateActivities) {
      const hasInterview = ca.interviews.length > 0;
      const interview = ca.interviews[0]; // Lấy interview đầu tiên nếu có
      const activity = activityMap.get(ca.task_id);

      // Check if this is a test activity and fetch score
      let testScore: number | null = null;
      let testStartTime: Date | null = null;
      let testEndTime: Date | null = null;
      const isTestActivity = hasInterview && interview?.linkExam;
      if (isTestActivity && interview.linkExam) {
        // Try to extract exam id from linkExam (assuming format contains exam id)
        const examIdMatch = interview.linkExam.match(/\/exam\/([^/?]+)/) || interview.linkExam.match(/exam[_-]id[=:](\w+)/) || interview.linkExam.match(/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/); // UUID format
        const examId = examIdMatch ? examIdMatch[1] : interview.linkExam; // fallback to full linkExam if no match
        
        if (examId) {
          try {
            // Find nhanVien by candidate email
            const nhanVien = await prisma.nhanVien.findUnique({
              where: { email: candidate.email },
              select: { id: true }
            });
            
            if (nhanVien) {
              // Find latest test result for this exam and employee
              const baiThiHR = await prisma.baiThiHR.findFirst({
                where: {
                  nhanVienId: nhanVien.id,
                  idexam: examId
                },
                orderBy: { solanthi: 'desc' },
                select: {
                  diem: true,
                  ngayVaoThi: true,
                  ngaynop: true
                }
              });
              
              if (baiThiHR) {
                testScore = baiThiHR.diem;
                testStartTime = baiThiHR.ngayVaoThi;
                testEndTime = baiThiHR.ngaynop;
              }
            }
          } catch (error) {
            console.error('Error fetching test score:', error);
          }
        }
      }

      timeline.push({
        id: `activity_${ca.id}`,
        type: hasInterview ? 'interview' : 'activity',
        title: activity?.name || 'Hoạt động',
        description: activity?.description || 'Hoạt động tuyển dụng',
        timestamp: ca.start_date,
        end_timestamp: ca.end_date || undefined,
        details: {
          stage_id: ca.stage_id,
          assignee: ca.assignee,
          status: ca.status,
          interview_date: interview?.ngay,
          interview_link: interview?.linkInterview,
          interview_location: interview?.location,
          interview_confirmed: interview?.confirmed,
          check_list: ca.check_list,
          test_score: testScore,
          test_start_time: testStartTime,
          test_end_time: testEndTime
        },
        status: ca.status ? 'completed' : 'pending'
      });
    }

    // 4. Current status
    timeline.push({
      id: 'current_status',
      type: 'status',
      title: 'Trạng thái hiện tại',
      description: `Ứng viên đang ở trạng thái: ${candidate.pipeline_status}`,
      timestamp: new Date(),
      details: {
        pipeline_status: candidate.pipeline_status,
        stage_name: candidate.stage?.name
      },
      status: 'current'
    });

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        full_name: candidate.full_name,
        email: candidate.email
      },
      timeline: timeline
    });

  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
