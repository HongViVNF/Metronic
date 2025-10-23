import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/activities-candidate/note - Update noteresult for a candidate activity
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { candidate_activity_id, noteresult } = body;

    console.log('PATCH /api/activities-candidate/note called with:', { candidate_activity_id, noteresult });

    if (!candidate_activity_id) {
      return NextResponse.json(
        { error: "Missing required parameter: candidate_activity_id" },
        { status: 400 }
      );
    }

    const updatedCandidateActivity = await prisma.candidate_activity.update({
      where: {
        id: candidate_activity_id,
      },
      data: {
        noteresult: noteresult || null,
      },
    });

    console.log('Successfully updated noteresult for candidate_activity:', candidate_activity_id, 'with value:', noteresult);

    return NextResponse.json({
      success: true,
      message: "Note result updated successfully",
      data: updatedCandidateActivity,
    });
  } catch (error: any) {
    console.error("Error updating candidate_activity noteresult:", error);

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Candidate activity not found" },
        { status: 404 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: error.message || "Internal server error while updating noteresult" },
      { status: 500 }
    );
  }
}
