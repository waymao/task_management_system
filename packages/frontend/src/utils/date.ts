import { format, formatDistance, isPast, isToday as isTodayFn, isTomorrow, parseISO } from 'date-fns';

export function isToday(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isTodayFn(dateObj);
  } catch {
    return false;
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
  } catch {
    return '';
  }
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (isTodayFn(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';

    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch {
    return '';
  }
}

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isPast(dateObj) && !isTodayFn(dateObj);
  } catch {
    return false;
  }
}

export function toISOString(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString();
}
