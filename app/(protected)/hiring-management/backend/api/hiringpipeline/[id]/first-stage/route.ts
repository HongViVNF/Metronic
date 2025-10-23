import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import formatToISO from '@/lib/(utils)/date';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pipelineId = params.id;

    // Kiểm tra pipeline có tồn tại không
    const pipeline = await prisma.hiringPipeline.findUnique({
      where: { id: pipelineId },
      select: { id: true, name: true },
    });

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    // Lấy tất cả stages và sắp xếp theo settings.order
    const stages = await prisma.stage.findMany({
      where: { hiring_pipeline_id: pipelineId },
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

    // Sắp xếp theo settings.order, nếu không có thì theo created_at
    const sortedStages = stages.sort((a, b) => {
      const orderA = (a.settings as any)?.order ?? Infinity;
      const orderB = (b.settings as any)?.order ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const firstStage = sortedStages[0];

    if (!firstStage) {
      return NextResponse.json({ error: 'No stages found in this pipeline' }, { status: 404 });
    }

    // Format dates
    const formattedStage = {
      ...firstStage,
      created_at: formatToISO(firstStage.created_at),
      updated_at: formatToISO(firstStage.updated_at),
    };

    return NextResponse.json({ stage: formattedStage });
  } catch (error) {
    console.error('Error fetching first stage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
