import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/candidate/[id]/note
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const { id } = params;
      const body = await request.json();
  
      const { note } = body;
  
      if (typeof note !== "string") {
        return NextResponse.json(
          { error: "Invalid 'note' value" },
          { status: 400 }
        );
      }
  
      const updatedCandidate = await prisma.candidate.update({
        where: { id },
        data: { note },
      });
  
      return NextResponse.json({ data: updatedCandidate });
    } catch (error) {
      console.error("Error updating candidate note:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
}