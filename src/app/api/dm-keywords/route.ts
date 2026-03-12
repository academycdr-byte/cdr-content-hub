import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createDmKeywordSchema, parseBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const userId = auth.session!.user.id;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const where: Record<string, unknown> = {
      socialAccount: { userId },
    };
    if (accountId) {
      where.socialAccountId = accountId;
    }

    const keywords = await prisma.dmKeyword.findMany({
      where,
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
      },
      orderBy: { totalReceived: 'desc' },
    });

    return NextResponse.json(keywords);
  } catch (error) {
    console.error('Failed to fetch dm keywords:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to fetch dm keywords' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const raw = await request.json();
    const parsed = parseBody(createDmKeywordSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data;

    const keyword = await prisma.dmKeyword.create({
      data: {
        keyword: body.keyword.toUpperCase(),
        description: body.description || '',
        socialAccountId: body.socialAccountId,
      },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
      },
    });

    return NextResponse.json(keyword, { status: 201 });
  } catch (error) {
    console.error('Failed to create dm keyword:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Failed to create dm keyword' }, { status: 500 });
  }
}
