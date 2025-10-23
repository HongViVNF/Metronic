import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface BulkUpdateRequest {
  candidateIds?: string[];
  stageId?: string;
}

export async function PATCH(request: Request) {
  try {
    const body: BulkUpdateRequest = await request.json();
    const { candidateIds, stageId } = body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Danh sách ứng viên không hợp lệ' },
        { status: 400 }
      );
    }

    if (!stageId || typeof stageId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Stage đích không hợp lệ' },
        { status: 400 }
      );
    }

    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: { id: true },
    });

    if (!stage) {
      return NextResponse.json(
        { success: false, message: 'Stage đích không tồn tại' },
        { status: 404 }
      );
    }

    const result = await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        stage_id: stageId,
        pipeline_status: 'interview', // Set status to "đang xử lý" when moved to stage
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Error bulk updating candidates:', error);
    return NextResponse.json(
      { success: false, message: 'Không thể cập nhật stage cho ứng viên' },
      { status: 500 }
    );
  }
}
