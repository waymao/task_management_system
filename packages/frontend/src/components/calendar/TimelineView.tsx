import { format, isToday, parseISO, isSameDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { Task } from '../../types';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  accountEmail: string;
}

interface TimelineViewProps {
  days: Date[];
  tasksByDate: Map<string, Task[]>;
  googleEvents?: GoogleCalendarEvent[];
  onTaskClick?: (task: Task) => void;
  currentTime: Date;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

export function TimelineView({ days, tasksByDate, googleEvents, onTaskClick, currentTime }: TimelineViewProps) {
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return ((hours - 6) * 60 + minutes) / (18 * 60) * 100; // Percentage position
  };

  const isTaskAllDay = (task: Task): boolean => {
    if (!task.dueDate) return false;
    try {
      const taskDate = parseISO(task.dueDate);
      // Check if the time is midnight (00:00:00), which indicates a date-only task
      return taskDate.getHours() === 0 && taskDate.getMinutes() === 0 && taskDate.getSeconds() === 0;
    } catch {
      return false;
    }
  };

  const getTaskPosition = (task: Task): { top: number; height: number } | null => {
    try {
      const taskDate = parseISO(task.dueDate || '');
      const hours = taskDate.getHours();
      const minutes = taskDate.getMinutes();

      // If task is outside our display range (6 AM - 11 PM), skip it
      if (hours < 6 || hours >= 24) {
        return null;
      }

      const startMinutes = (hours - 6) * 60 + minutes;
      const top = (startMinutes / (18 * 60)) * 100;

      // Default duration: 1 hour for regular tasks
      const height = (60 / (18 * 60)) * 100;

      return { top, height };
    } catch {
      return null;
    }
  };

  const getEventPosition = (event: GoogleCalendarEvent): { top: number; height: number } | null => {
    try {
      const startDate = parseISO(event.startTime);
      const endDate = parseISO(event.endTime);

      const startHours = startDate.getHours();
      const startMinutes = startDate.getMinutes();
      const endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();

      // If event starts before 6 AM, clamp to 6 AM
      const clampedStartHours = Math.max(6, startHours);
      const clampedStartMinutes = startHours < 6 ? 0 : startMinutes;

      // If event ends after 11 PM, clamp to 11 PM
      const clampedEndHours = Math.min(23, endHours);
      const clampedEndMinutes = endHours >= 23 ? 59 : endMinutes;

      // If event is completely outside our display range, skip it
      if (clampedEndHours < 6 || clampedStartHours >= 24) {
        return null;
      }

      const startMinutesFromStart = (clampedStartHours - 6) * 60 + clampedStartMinutes;
      const endMinutesFromStart = (clampedEndHours - 6) * 60 + clampedEndMinutes;
      const durationMinutes = endMinutesFromStart - startMinutesFromStart;

      const top = (startMinutesFromStart / (18 * 60)) * 100;
      const height = Math.max((durationMinutes / (18 * 60)) * 100, 1); // Minimum 1% height

      return { top, height };
    } catch {
      return null;
    }
  };

  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200">
        <div className="h-16 border-b border-gray-200" /> {/* Header spacer */}
        <div className="h-auto min-h-[60px] border-b border-gray-200 px-2 py-2 text-xs text-gray-600 text-right font-medium">
          All Day
        </div>
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-gray-200 px-2 py-1 text-xs text-gray-600 text-right"
            >
              {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
            </div>
          ))}
        </div>
      </div>

      {/* Days columns */}
      <div className="flex-1 flex overflow-x-auto">
        {days.map((day, dayIndex) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isDayToday = isToday(day);

          // Separate all-day items from timed items
          const allDayEvents = googleEvents?.filter(event => {
            if (!event.isAllDay) return false;
            // Compare dates in UTC to avoid timezone shift for all-day events
            const eventDateUTC = formatInTimeZone(new Date(event.startTime), 'UTC', 'yyyy-MM-dd');
            const dayDateUTC = formatInTimeZone(day, 'UTC', 'yyyy-MM-dd');
            return eventDateUTC === dayDateUTC;
          }) || [];
          const allDayTasks = dayTasks.filter(task => !task.id.startsWith('gcal-') && isTaskAllDay(task));

          return (
            <div
              key={dayIndex}
              className={`flex-1 min-w-[120px] border-r border-gray-200 last:border-r-0 ${
                isDayToday ? 'bg-blue-50/30' : ''
              }`}
            >
              {/* Day header */}
              <div className={`h-16 border-b border-gray-200 p-2 text-center ${
                isDayToday ? 'bg-blue-100' : 'bg-gray-50'
              }`}>
                <div className="text-xs text-gray-600">{format(day, 'EEE')}</div>
                <div className={`text-lg font-semibold ${
                  isDayToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* All Day Section */}
              <div className="min-h-[60px] border-b border-gray-200 p-1 bg-gray-50/50">
                <div className="space-y-1">
                  {/* All-day Google Calendar events */}
                  {allDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="text-xs px-2 py-1 rounded bg-purple-100 border-l-2 border-purple-500 text-purple-900 truncate cursor-pointer hover:shadow-sm"
                      title={event.title}
                    >
                      📅 {event.title}
                    </div>
                  ))}

                  {/* All-day tasks (tasks with date but no specific time) */}
                  {allDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`
                        text-xs px-2 py-1 rounded border-l-2 truncate cursor-pointer hover:shadow-sm
                        ${task.priority === 'high' ? 'bg-red-100 border-red-500 text-red-900' : ''}
                        ${task.priority === 'medium' ? 'bg-yellow-100 border-yellow-500 text-yellow-900' : ''}
                        ${task.priority === 'low' ? 'bg-green-100 border-green-500 text-green-900' : ''}
                      `}
                      onClick={() => onTaskClick?.(task)}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline grid */}
              <div className="relative">
                {/* Hour slots */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  />
                ))}

                {/* Current time indicator (only for today) */}
                {isDayToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${getCurrentTimePosition()}%` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Tasks and Events */}
                <div className="absolute inset-0 px-1">
                  {/* Google Calendar Events */}
                  {googleEvents?.filter(event => !event.isAllDay && isSameDay(parseISO(event.startTime), day)).map((event) => {
                    const position = getEventPosition(event);
                    if (!position) return null;

                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 rounded px-2 py-1 cursor-pointer
                          hover:shadow-lg transition-shadow z-10 overflow-hidden
                          bg-purple-100 border-l-4 border-purple-500 text-purple-900"
                        style={{
                          top: `${position.top}%`,
                          height: `${position.height}%`,
                          minHeight: '28px',
                        }}
                        title={`${event.title}\n${format(parseISO(event.startTime), 'h:mm a')} - ${format(parseISO(event.endTime), 'h:mm a')}`}
                      >
                        <div className="text-xs font-medium truncate">📅 {event.title}</div>
                        <div className="text-xs opacity-75">
                          {format(parseISO(event.startTime), 'h:mm a')} - {format(parseISO(event.endTime), 'h:mm a')}
                        </div>
                      </div>
                    );
                  })}

                  {/* Regular Tasks (with specific times) */}
                  {dayTasks.filter(task => !task.id.startsWith('gcal-') && !isTaskAllDay(task)).map((task) => {
                    const position = getTaskPosition(task);
                    if (!position) return null;

                    return (
                      <div
                        key={task.id}
                        className={`
                          absolute left-1 right-1 rounded px-2 py-1 cursor-pointer
                          hover:shadow-lg transition-shadow z-10 overflow-hidden
                          ${task.priority === 'high' ? 'bg-red-100 border-l-4 border-red-500 text-red-900' : ''}
                          ${task.priority === 'medium' ? 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900' : ''}
                          ${task.priority === 'low' ? 'bg-green-100 border-l-4 border-green-500 text-green-900' : ''}
                        `}
                        style={{
                          top: `${position.top}%`,
                          height: `${position.height}%`,
                          minHeight: '28px',
                        }}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <div className="text-xs font-medium truncate">{task.title}</div>
                        {task.dueDate && (
                          <div className="text-xs opacity-75">
                            {format(parseISO(task.dueDate), 'h:mm a')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
