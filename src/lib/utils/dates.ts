// =============================================================
// Date Utilities
// =============================================================

/**
 * Get today's date as YYYY-MM-DD in a given timezone.
 */
export function getTodayString(timezone: string = 'UTC'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
}

/**
 * Get start and end of a month as ISO strings.
 */
export function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number);
  const start = new Date(year!, month! - 1, 1).toISOString();
  const end = new Date(year!, month!, 1).toISOString();
  return { start, end };
}

/**
 * Format a date for display.
 */
export function formatDate(date: string | Date, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options = ({
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  } as const)[style] as Intl.DateTimeFormatOptions;

  return d.toLocaleDateString('en-US', options);
}

/**
 * Get relative time string (e.g., "2 hours ago").
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}
