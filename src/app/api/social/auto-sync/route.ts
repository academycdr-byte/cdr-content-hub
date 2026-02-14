import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * PATCH /api/social/auto-sync
 *
 * Toggle the autoSync flag on a social account.
 * Body: { accountId: string, autoSync: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const body = (await request.json()) as { accountId: string; autoSync: boolean };
    const { accountId, autoSync } = body;

    if (!accountId || typeof autoSync !== 'boolean') {
      return NextResponse.json(
        { error: 'accountId (string) e autoSync (boolean) obrigatorios' },
        { status: 400 }
      );
    }

    // Verify ownership
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Conta nao encontrada' },
        { status: 404 }
      );
    }

    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { autoSync },
    });

    console.log(`[Auto-sync] @${account.username} (${account.platform}): autoSync=${autoSync}`);

    return NextResponse.json({ success: true, autoSync });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auto-sync] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
