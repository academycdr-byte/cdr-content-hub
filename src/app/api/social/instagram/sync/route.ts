import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { syncInstagramAccount } from '@/lib/sync/instagram-sync';
import { syncAccountSchema, parseBody } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const raw = await request.json();
    const parsed = parseBody(syncAccountSchema, raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { accountId } = parsed.data;

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId, platform: 'instagram' },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Conta nao encontrada' },
        { status: 404 }
      );
    }

    const result = await syncInstagramAccount(account, 'manual');

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.errorMessage },
        { status: result.errorMessage?.includes('Token expirado') ? 401 : 500 }
      );
    }

    return NextResponse.json({
      synced: result.postsFound,
      metrics: result.postsSynced,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar';
    console.error('[IG Sync] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
