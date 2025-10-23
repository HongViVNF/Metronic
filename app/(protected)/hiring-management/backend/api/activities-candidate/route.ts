import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/activities-candidate?task_id=...&candidate_id=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get("task_id");
    const candidate_id = searchParams.get("candidate_id");

    if (!task_id || !candidate_id) {
      return NextResponse.json(
        { error: "Missing query params: task_id, candidate_id" },
        { status: 400 }
      );
    }

    const ca = await prisma.candidate_activity.findFirst({
      where: {
        task_id,
        candidate_id,
      },
      select: {
        id: true,
        check_list: true,
      },
    });

    if (!ca) {
      return NextResponse.json(
        { success: true, data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, data: ca }, { status: 200 });
  } catch (error) {
    console.error("Error fetching candidate_activity check_list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/candidate-activity
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const {
      id,           // lấy id trực tiếp từ body
      start_date,
      end_date,
      status,
      noteresult,
      assignee,
      stage_id,
      candidate_id,
      task_id,
      check_list,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing candidate_activity id" },
        { status: 400 }
      );
    }

    const updatedCandidateActivity = await prisma.candidate_activity.update({
      where: { id },
      data: {
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        status: status ?? undefined,
        noteresult: noteresult ?? undefined,
        assignee: assignee ?? undefined,
        stage_id: stage_id ?? undefined,
        candidate_id: candidate_id ?? undefined,
        task_id: task_id ?? undefined,
        check_list: check_list ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCandidateActivity,
    });
  } catch (error) {
    console.error("Error updating candidate_activity:", error);
    return NextResponse.json(
      { error: "Candidate Activity not found or internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/activities-candidate/note - Update noteresult
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get("task_id");
    const candidate_id = searchParams.get("candidate_id");
    const status = searchParams.get("status");

    console.log('PATCH activities-candidate called with:', { task_id, candidate_id, status });

    if (!task_id || !candidate_id || status === null) {
      return NextResponse.json(
        { error: "Missing required query params: task_id, candidate_id, status" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be: in_progress, completed, or cancelled" },
        { status: 400 }
      );
    }

    console.log('Updating candidate_activity with:', { task_id, candidate_id, status });

    const updatedCandidateActivity = await prisma.candidate_activity.updateMany({
      where: {
        task_id,
        candidate_id,
      },
      data: {
        status: status as any, // Use the enum value directly
      },
    });

    console.log('Update result:', updatedCandidateActivity);

    if (updatedCandidateActivity.count === 0) {
      return NextResponse.json(
        {
          error: `No candidate activity found for task_id: ${task_id}, candidate_id: ${candidate_id}. Please check if the activity exists.`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      data: { status: status, updatedCount: updatedCandidateActivity.count },
    });
  } catch (error: any) {
    console.error("Error updating candidate_activity status:", error);

    // Handle Prisma errors specifically
    if (error.code) {
      return NextResponse.json(
        {
          error: `Database error (${error.code}): ${error.message || 'Unable to update status'}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error while updating status" },
      { status: 500 }
    );
  }
}

