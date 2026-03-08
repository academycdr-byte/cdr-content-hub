import { NextResponse } from 'next/server';

// Re-export requireAuth from auth.ts (already defined there)
export { requireAuth } from '@/lib/auth';

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}
