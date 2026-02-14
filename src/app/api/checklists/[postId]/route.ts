import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ postId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { postId } = await context.params;

    // Get the post to know its current status
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { status: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Find the checklist template for this stage
    const template = await prisma.checklistTemplate.findUnique({
      where: { stage: post.status },
    });

    if (!template) {
      return NextResponse.json({
        templateItems: [],
        completedItems: [],
      });
    }

    // Find or create completion record
    let completion = await prisma.checklistCompletion.findUnique({
      where: {
        postId_templateId: {
          postId,
          templateId: template.id,
        },
      },
    });

    if (!completion) {
      completion = await prisma.checklistCompletion.create({
        data: {
          postId,
          templateId: template.id,
          completedItems: '[]',
        },
      });
    }

    return NextResponse.json({
      templateItems: JSON.parse(template.items) as string[],
      completedItems: JSON.parse(completion.completedItems) as string[],
      completionId: completion.id,
    });
  } catch (error) {
    console.error('Failed to fetch checklist:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { postId } = await context.params;
    const body = await request.json() as { completedItems: string[] };

    // Get the post to know its current status
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { status: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Find the template for this stage
    const template = await prisma.checklistTemplate.findUnique({
      where: { stage: post.status },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'No checklist template for this stage' },
        { status: 404 }
      );
    }

    // Check if all items are completed
    const templateItems = JSON.parse(template.items) as string[];
    const allCompleted = templateItems.every((item) =>
      body.completedItems.includes(item)
    );

    // Upsert the completion
    const completion = await prisma.checklistCompletion.upsert({
      where: {
        postId_templateId: {
          postId,
          templateId: template.id,
        },
      },
      update: {
        completedItems: JSON.stringify(body.completedItems),
        completedAt: allCompleted ? new Date() : null,
      },
      create: {
        postId,
        templateId: template.id,
        completedItems: JSON.stringify(body.completedItems),
        completedAt: allCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({
      completedItems: JSON.parse(completion.completedItems) as string[],
      completedAt: completion.completedAt,
    });
  } catch (error) {
    console.error('Failed to update checklist:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    );
  }
}
