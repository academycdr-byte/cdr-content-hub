export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login (auth page)
     * - /api/auth/* (NextAuth endpoints)
     * - /tiktok-developers-site-verification.txt (TikTok verification)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /icon*, /apple-icon* (browser assets)
     * - Static files (images, etc.)
     */
    '/((?!login|api/auth|tiktok-developers-site-verification\\.txt|_next|favicon\\.ico|icon|apple-icon|.*\\.).*)',
  ],
};
