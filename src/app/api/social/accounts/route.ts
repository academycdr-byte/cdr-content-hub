import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const accounts = await prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        platform: true,
        displayName: true,
        username: true,
        profilePictureUrl: true,
        followersCount: true,
        autoSync: true,
        lastSyncAt: true,
        isActive: true,
        createdAt: true,
        // Include token expiry for status indicators but NOT the token itself
        tokenExpiresAt: true,
        tiktokExpiresAt: true,
        // Include these to check connection status
        igUserId: true,
        tiktokOpenId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error(
      'Failed to fetch social accounts:',
      error instanceof Error ? error.message : 'Unknown'
    );
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as Record<string, unknown>).id as string;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    }

    // Verify ownership before deleting
    const account = await prisma.socialAccount.findFirst({
      where: { id, userId },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Conta nao encontrada' },
        { status: 404 }
      );
    }

    await prisma.socialAccount.update({
      where: { id },
      data: {
        isActive: false,
        accessToken: null,
        tiktokToken: null,
        tiktokRefresh: null,
        autoSync: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Failed to disconnect account:',
      error instanceof Error ? error.message : 'Unknown'
    );
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
