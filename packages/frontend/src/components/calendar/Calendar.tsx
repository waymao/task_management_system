import { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { Button } from '../common/Button';
import { CalendarView, getMonthDays, getWeekDays, navigateCalendar, formatCalendarTitle, groupTasksByDate } from '../../utils/calendar';
import type { Task } from '../../types';

interface CalendarProps {
  tasks: Task[];
  onDateClick?: (date: Date) => void;
  onTaskClick?: (task: Task) => void;
}

export function Calendar({ tasks, onDateClick, onTaskClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setCurrentDate(prev => navigateCalendar(prev, 'prev', view));
  };

  const handleNext = () => {
    setCurrentDate(prev => navigateCalendar(prev, 'next', view));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const tasksByDate = groupTasksByDate(tasks.filter(t => t.dueDate));

  const renderMonthView = () => {
    const days = getMonthDays(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dateKey = format(day.date, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];

          return (
            <div
              key={index}
              className={`
                bg-white p-2 min-h-24 cursor-pointer hover:bg-gray-50 transition-colors
                ${!day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''}
                ${day.isToday ? 'ring-2 ring-primary-500' : ''}
              `}
              onClick={() => onDateClick?.(day.date)}
            >
              <div className={`text-sm font-medium mb-1 ${day.isToday ? 'text-primary-600' : ''}`}>
                {format(day.date, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className={`
                      text-xs px-1 py-0.5 rounded truncate cursor-pointer
                      ${task.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                      ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays(currentDate);

    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => {
          const dateKey = format(day.date, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];

          return (
            <div
              key={index}
              className={`
                border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors
                ${day.isToday ? 'ring-2 ring-primary-500' : ''}
              `}
              onClick={() => onDateClick?.(day.date)}
            >
              <div className="text-center mb-3">
                <div className="text-xs text-gray-500">{format(day.date, 'EEE')}</div>
                <div className={`text-lg font-semibold ${day.isToday ? 'text-primary-600' : ''}`}>
                  {format(day.date, 'd')}
                </div>
                {day.isToday && (
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="text-xs text-blue-600 font-medium">
                      {format(currentTime, 'h:mm a')}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    className={`
                      text-xs p-2 rounded cursor-pointer hover:shadow-md transition-shadow
                      ${task.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                      ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                  >
                    <div className="font-medium truncate">{task.title}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const dayTasks = tasksByDate.get(dateKey) || [];
    const isTodayView = isToday(currentDate);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-gray-900">{format(currentDate, 'd')}</div>
            <div className="text-sm text-gray-500">{format(currentDate, 'EEEE, MMMM yyyy')}</div>
            {isTodayView && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="text-sm font-medium text-blue-700">
                  Current time: {format(currentTime, 'h:mm a')}
                </div>
              </div>
            )}
          </div>

          {dayTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks scheduled for this day
            </div>
          ) : (
            <div className="space-y-3">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  className={`
                    p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow
                    ${task.priority === 'high' ? 'bg-red-50 border border-red-200' : ''}
                    ${task.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' : ''}
                    ${task.priority === 'low' ? 'bg-green-50 border border-green-200' : ''}
                  `}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="font-medium text-gray-900">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full font-medium
                      ${task.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                      ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">{task.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handlePrevious}>
            ← Prev
          </Button>
          <Button size="sm" variant="ghost" onClick={handleToday}>
            Today
          </Button>
          <Button size="sm" variant="ghost" onClick={handleNext}>
            Next →
          </Button>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">
          {formatCalendarTitle(currentDate, view)}
        </h2>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={view === 'month' ? 'primary' : 'ghost'}
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button
            size="sm"
            variant={view === 'week' ? 'primary' : 'ghost'}
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={view === 'day' ? 'primary' : 'ghost'}
            onClick={() => setView('day')}
          >
            Day
          </Button>
        </div>
      </div>

      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
}
