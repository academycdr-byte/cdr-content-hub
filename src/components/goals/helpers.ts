export function formatFollowerCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'instagram': return '#E4405F';
    case 'tiktok': return '#00F2EA';
    default: return 'var(--accent)';
  }
}

export function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    default: return platform;
  }
}

export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'achieved': return { bg: 'var(--success-surface)', text: 'var(--success)' };
    case 'expired': return { bg: 'var(--error-surface)', text: 'var(--error)' };
    default: return { bg: 'var(--accent-surface)', text: 'var(--accent)' };
  }
}

export function getEndDateForPeriod(period: string): string {
  const now = new Date();
  switch (period) {
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
