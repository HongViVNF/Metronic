import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// CREATE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const template = await prisma.emailTemplate.create({
      data: {
        subject: body.subject,
        body: body.body,
        name: body.name,
        variables: body.variables,
        type : body.type,
      }
    });
    
    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

// READ ALL
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

// UPDATE
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID template' },
        { status: 400 }
      );
    }

    const updated = await prisma.emailTemplate.update({
      where: { id: body.id },
      data: body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID template' },
        { status: 400 }
      );
    }

    const deleted = await prisma.emailTemplate.delete({
      where: { id: body.id },
    });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

