import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameMonth, isSameDay, format, startOfDay, endOfDay } from 'date-fns';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getMonthDays(date: Date): CalendarDay[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = new Date();

  return days.map(day => ({
    date: day,
    isCurrentMonth: isSameMonth(day, date),
    isToday: isSameDay(day, today),
  }));
}

export function getWeekDays(date: Date): CalendarDay[] {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = new Date();

  return days.map(day => ({
    date: day,
    isCurrentMonth: isSameMonth(day, date),
    isToday: isSameDay(day, today),
  }));
}

export function navigateCalendar(currentDate: Date, direction: 'prev' | 'next', view: CalendarView): Date {
  switch (view) {
    case 'month':
      return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    case 'week':
      return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    case 'day':
      return direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
  }
}

export function formatCalendarTitle(date: Date, view: CalendarView): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week':
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    case 'day':
      return format(date, 'MMMM d, yyyy');
  }
}

export function getDayRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

export function groupTasksByDate<T extends { dueDate?: string | Date | null }>(tasks: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  tasks.forEach(task => {
    if (!task.dueDate) return;

    const date = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
    const dateKey = format(startOfDay(date), 'yyyy-MM-dd');

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(task);
  });

  return grouped;
}
