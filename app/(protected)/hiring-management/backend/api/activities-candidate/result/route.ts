import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH: Cập nhật result của candidate_activity
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { candidate_activity_id, result } = body;

    if (!candidate_activity_id) {
      return NextResponse.json({ error: 'Missing required field: candidate_activity_id' }, { status: 400 });
    }

    // Validate result values if provided
    if (result) {
      const validResults = ['pending', 'pass', 'fail'];
      if (!validResults.includes(result)) {
        return NextResponse.json({ error: 'Invalid result value. Must be: pending, pass, or fail' }, { status: 400 });
      }
    }

    const updatedCandidateActivity = await prisma.candidate_activity.update({
      where: { id: candidate_activity_id },
      data: { result },
      select: {
        id: true,
        task_id: true,
        candidate_id: true,
        status: true,
        result: true,
        noteresult: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCandidateActivity,
    });
  } catch (error) {
    console.error('Error updating candidate activity result:', error);
    return NextResponse.json({ error: 'Failed to update candidate activity result' }, { status: 500 });
  }
}
