import { useEffect, useRef } from 'react';

/**
 * Hook that silently refreshes expiring Instagram tokens.
 *
 * Calls POST /api/social/refresh on first mount.
 * Uses a ref to prevent duplicate calls in React strict mode.
 *
 * This should be used in pages where users are actively using the app
 * (e.g., metrics page, social page) to ensure tokens stay valid.
 */
export function useTokenRefresh() {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const refreshTokens = async () => {
      try {
        const res = await fetch('/api/social/refresh', {
          method: 'POST',
        });

        if (!res.ok) return;

        const data = (await res.json()) as {
          refreshed: number;
          failed: number;
          total: number;
        };

        if (data.refreshed > 0) {
          console.log(
            `[Token Refresh] Renewed ${data.refreshed}/${data.total} token(s)`
          );
        }
      } catch {
        // Silent failure -- token refresh is best-effort
      }
    };

    refreshTokens();
  }, []);
}
