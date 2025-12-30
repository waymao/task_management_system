import { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, startOfDay, endOfDay, isToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useAssignments, useUnassignedTasks, useCreateAssignment, useDeleteAssignment } from '../hooks/useAssignments';
import { useFollowUpTasks, useCompleteTask, useUncompleteTask } from '../hooks/useTasks';
import { useGoogleCalendarEvents, useRefreshGoogleCalendarEvents } from '../hooks/useGoogleCalendar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TaskDetailModal } from '../components/common/TaskDetailModal';
import { CalendarEventModal } from '../components/common/CalendarEventModal';
import toast from 'react-hot-toast';
import type { Task, TimeSlot } from '../types';

type ViewMode = 'day' | '3days' | 'week';

const TIME_SLOTS: TimeSlot[] = ['allday', 'morning', 'afternoon', 'evening'];
const SLOT_LABELS: Record<TimeSlot, string> = {
  allday: '📅 All Day / Follow-ups',
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening: '🌙 Evening',
};

// Helper function to get current time slot
const getCurrentTimeSlot = (): TimeSlot => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'allday';
};

export function AssignmentBoardPage() {
  const [currentDay, setCurrentDay] = useState(() => {
    // Load saved current day from localStorage, default to today
    const savedDay = localStorage.getItem('assignmentCurrentDay');
    return savedDay ? new Date(savedDay) : new Date();
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load saved view mode from localStorage, default to 'week'
    const savedViewMode = localStorage.getItem('assignmentViewMode');
    return (savedViewMode as ViewMode) || 'week';
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedAssignmentId, setDraggedAssignmentId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ date: Date; slot: TimeSlot } | null>(null);
  const [hoveredTask, setHoveredTask] = useState<{ task: Task; x: number; y: number } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<{ event: any; x: number; y: number } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlot>(getCurrentTimeSlot());

  // Update current time slot every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeSlot(getCurrentTimeSlot());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assignmentViewMode', viewMode);
  }, [viewMode]);

  // Save current day to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assignmentCurrentDay', currentDay.toISOString());
  }, [currentDay]);

  // Calculate days based on view mode
  const numDays = viewMode === 'day' ? 1 : viewMode === '3days' ? 3 : 7;
  const startDay = viewMode === 'week' ? startOfWeek(currentDay) : currentDay;
  const viewDays = Array.from({ length: numDays }, (_, i) => addDays(startDay, i));

  // Set proper date range: start of first day to end of last day
  const startDate = startOfDay(viewDays[0]).toISOString();
  const endDate = endOfDay(viewDays[viewDays.length - 1]).toISOString();

  const { data: assignments, isLoading } = useAssignments({ startDate, endDate });
  const { data: unassignedTasks } = useUnassignedTasks();
  const { data: followUpTasks } = useFollowUpTasks({ startDate, endDate });
  const { data: googleEvents } = useGoogleCalendarEvents(startDate, endDate);
  const refreshEventsMutation = useRefreshGoogleCalendarEvents();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  // Separate hooks for reschedule operation (no toasts)
  const createAssignmentSilent = useCreateAssignment({ showToast: false });
  const deleteAssignmentSilent = useDeleteAssignment({ showToast: false });

  const handlePrevWeek = () => {
    setCurrentDay(prev => {
      if (viewMode === 'day') return addDays(prev, -1);
      if (viewMode === '3days') return addDays(prev, -1);
      return subWeeks(prev, 1);
    });
  };

  const handleNextWeek = () => {
    setCurrentDay(prev => {
      if (viewMode === 'day') return addDays(prev, 1);
      if (viewMode === '3days') return addDays(prev, 1);
      return addWeeks(prev, 1);
    });
  };
  const handleToday = () => setCurrentDay(new Date());

  const handleRefreshEvents = () => {
    refreshEventsMutation.mutate(
      { startDate, endDate },
      {
        onSuccess: () => {
          toast.success('Calendar events refreshed');
        },
        onError: () => {
          toast.error('Failed to refresh events');
        },
      }
    );
  };

  const getAssignmentsForSlot = (date: Date, slot: TimeSlot) => {
    if (!assignments) return [];
    const dateKey = format(date, 'yyyy-MM-dd');
    return assignments.filter(a => {
      const assignmentDate = format(new Date(a.date), 'yyyy-MM-dd');
      return assignmentDate === dateKey && a.slot === slot;
    });
  };

  const getFollowUpsForDate = (date: Date) => {
    if (!followUpTasks) return [];
    const dateKey = format(date, 'yyyy-MM-dd');
    return followUpTasks.filter(task => {
      if (!task.followUpDate) return false;
      const followUpDate = format(new Date(task.followUpDate), 'yyyy-MM-dd');
      return followUpDate === dateKey;
    });
  };

  // Determine which slot a Google Calendar event belongs to
  const getEventSlot = (startTime: string, endTime: string, isAllDay?: boolean): TimeSlot => {
    // Check isAllDay flag first (most reliable indicator)
    if (isAllDay) {
      return 'allday';
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHour = start.getHours();

    // If event spans more than 6 hours, consider it all-day
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 6) return 'allday';

    // Determine slot based on start time
    if (startHour >= 6 && startHour < 12) return 'morning';
    if (startHour >= 12 && startHour < 18) return 'afternoon';
    if (startHour >= 18 && startHour < 24) return 'evening';
    return 'allday';
  };

  const getGoogleEventsForSlot = (date: Date, slot: TimeSlot) => {
    if (!googleEvents) return [];
    const dateKey = format(date, 'yyyy-MM-dd');

    return googleEvents.filter(event => {
      // For all-day events, format in UTC to avoid timezone shift
      const eventDate = event.isAllDay
        ? formatInTimeZone(new Date(event.startTime), 'UTC', 'yyyy-MM-dd')
        : format(new Date(event.startTime), 'yyyy-MM-dd');
      if (eventDate !== dateKey) return false;

      const eventSlot = getEventSlot(event.startTime, event.endTime, event.isAllDay);
      return eventSlot === slot;
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: Task, assignmentId?: string) => {
    setDraggedTask(task);
    setDraggedAssignmentId(assignmentId || null);
    setHoveredTask(null);  // Close tooltip when dragging starts
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedAssignmentId(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date, slot: TimeSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ date, slot });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date, slot: TimeSlot) => {
    e.preventDefault();
    if (draggedTask) {
      // If moving an existing assignment, delete the old one first
      if (draggedAssignmentId) {
        deleteAssignmentSilent.mutate(draggedAssignmentId, {
          onSuccess: () => {
            // Then create the new assignment
            createAssignmentSilent.mutate({
              taskId: draggedTask.id,
              date: date.toISOString(),
              slot,
            }, {
              onSuccess: () => {
                toast.success('Task rescheduled');
              }
            });
          }
        });
      } else {
        // Just create a new assignment
        createAssignment.mutate({
          taskId: draggedTask.id,
          date: date.toISOString(),
          slot,
        });
      }
    }
    setDraggedTask(null);
    setDraggedAssignmentId(null);
    setDragOverSlot(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading assignment board...</p>
      </div>
    );
  }

  const isDragOverThisSlot = (date: Date, slot: TimeSlot) => {
    if (!dragOverSlot) return false;
    return format(date, 'yyyy-MM-dd') === format(dragOverSlot.date, 'yyyy-MM-dd') && slot === dragOverSlot.slot;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Board</h1>
        <p className="text-gray-600">
          Drag tasks from below into time slots to schedule them
        </p>
      </div>

      {/* Navigation and View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handlePrevWeek}>
            ← Prev
          </Button>
          <Button size="sm" variant="ghost" onClick={handleToday}>
            Today
          </Button>
          <Button size="sm" variant="ghost" onClick={handleNextWeek}>
            Next →
          </Button>
          <div className="border-l border-gray-300 h-6 mx-1"></div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefreshEvents}
            disabled={refreshEventsMutation.isPending}
          >
            {refreshEventsMutation.isPending ? 'Refreshing...' : '🔄 Refresh Events'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'day' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('day')}
          >
            1 Day
          </Button>
          <Button
            size="sm"
            variant={viewMode === '3days' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('3days')}
          >
            3 Days
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'week' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
        </div>

        <h2 className="text-xl font-semibold">
          {format(viewDays[0], 'MMM d')} - {format(viewDays[viewDays.length - 1], 'MMM d, yyyy')}
        </h2>
      </div>

      <div className={`grid gap-4 ${numDays === 1 ? 'grid-cols-4' : numDays === 3 ? 'grid-cols-4' : 'grid-cols-8'}`}>
        {/* Time slot column */}
        <div className="space-y-2">
          <div className="h-16"></div>
          {TIME_SLOTS.map(slot => (
            <div key={slot} className={`h-48 flex justify-end font-medium text-end text-gray-700`}>
              {SLOT_LABELS[slot]}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {viewDays.map((day, dayIndex) => (
          <div key={dayIndex} className={`space-y-2 ${numDays === 1 ? 'col-span-3' : ''}`}>
            <div className="text-center h-16 flex flex-col items-center justify-center bg-white rounded-lg p-2">
              <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
            </div>

            {TIME_SLOTS.map(slot => {
              const slotAssignments = getAssignmentsForSlot(day, slot);
              const followUps = slot === 'allday' ? getFollowUpsForDate(day) : [];
              const calendarEvents = getGoogleEventsForSlot(day, slot);
              const isOver = isDragOverThisSlot(day, slot);
              const isCurrentTimeBlock = isToday(day) && slot === currentTimeSlot;

              return (
                <div
                  key={slot}
                  className={`
                    h-48 p-2 rounded-lg border-2 transition-all
                    ${isOver ? 'border-primary-500 bg-primary-50 border-dashed' : ''}
                    ${isCurrentTimeBlock && !isOver ? 'border-blue-300 hover:border-blue-500' : ''}
                    ${!isOver && !isCurrentTimeBlock ? 'border-gray-200 bg-white hover:border-gray-300' : ''}
                  `}
                  onDragOver={(e) => handleDragOver(e, day, slot)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day, slot)}
                >
                  <div className="space-y-1 h-full overflow-y-auto">
                    {/* Google Calendar events (read-only, non-draggable) */}
                    {calendarEvents.map(event => (
                      <div
                        key={`gcal-${event.id}`}
                        className="text-xs p-1.5 rounded relative bg-purple-50 border border-purple-200 text-purple-800 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipWidth = 384;
                          const tooltipHeight = 200;
                          const padding = 10;

                          const spaceOnRight = window.innerWidth - rect.right;
                          const x = spaceOnRight > tooltipWidth + padding
                            ? rect.right + padding
                            : rect.left - padding;

                          const spaceBelow = window.innerHeight - rect.top;
                          const y = spaceBelow > tooltipHeight
                            ? rect.top
                            : Math.max(padding, rect.bottom - tooltipHeight);

                          setHoveredEvent({
                            event,
                            x: Math.max(padding, x),
                            y
                          });
                        }}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        <div className="truncate font-medium">📅 {event.title}</div>
                        {!event.isAllDay && (
                          <div className="text-xs text-purple-600 mt-0.5">
                            {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                          </div>
                        )}
                        {event.isAllDay && (
                          <div className="text-xs text-purple-600 mt-0.5">
                            All day
                          </div>
                        )}
                      </div>
                    ))}

                    
                    {/* Regular assignments (draggable) */}
                    {slotAssignments.map(assignment => {
                      const isCompleted = assignment.task?.status === 'completed';
                      return (
                        <div
                          key={assignment.id}
                          draggable
                          onDragStart={(e) => assignment.task && handleDragStart(e, assignment.task, assignment.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            // Don't open modal if clicking the delete button or checkbox
                            const target = e.target as HTMLElement;
                            if (!target.closest('button') && !target.closest('input[type="checkbox"]')) {
                              setSelectedTask(assignment.task || null);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (assignment.task) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const tooltipWidth = 384; // max-w-sm is roughly 384px
                              const tooltipHeight = 200; // estimated height
                              const padding = 10;

                              // Calculate horizontal position (prefer right, but use left if near edge)
                              const spaceOnRight = window.innerWidth - rect.right;
                              const x = spaceOnRight > tooltipWidth + padding
                                ? rect.right + padding  // Show on right
                                : rect.left - padding;  // Show on left

                              // Calculate vertical position (adjust if near bottom)
                              const spaceBelow = window.innerHeight - rect.top;
                              const y = spaceBelow > tooltipHeight
                                ? rect.top  // Align with top
                                : Math.max(padding, rect.bottom - tooltipHeight);  // Adjust upward

                              setHoveredTask({
                                task: assignment.task,
                                x: Math.max(padding, x),  // Don't go off left edge
                                y
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredTask(null)}
                          className={`
                            text-xs p-1.5 rounded group relative cursor-pointer transition-all flex items-start gap-1.5
                            ${isCompleted ? 'bg-gray-100 text-gray-500 opacity-75' : ''}
                            ${!isCompleted && assignment.task?.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                            ${!isCompleted && assignment.task?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${!isCompleted && assignment.task?.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                            ${draggedTask?.id === assignment.task?.id && draggedAssignmentId === assignment.id ? 'opacity-50 scale-95' : 'hover:shadow-md'}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (assignment.task) {
                                if (isCompleted) {
                                  uncompleteTask.mutate(assignment.task.id);
                                } else {
                                  completeTask.mutate(assignment.task.id);
                                }
                              }
                            }}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
                          />
                          <div className={`truncate font-medium flex-1 ${isCompleted ? 'line-through' : ''}`}>
                            {assignment.task?.title}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHoveredTask(null);  // Close tooltip when delete is clicked
                              deleteAssignment.mutate(assignment.id);
                            }}
                            className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}

                    {/* Follow-up reminders (non-draggable, static) */}
                    {followUps.map(task => (
                      <div
                        key={`followup-${task.id}`}
                        onClick={() => setSelectedTask(task)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipWidth = 384;
                          const tooltipHeight = 200;
                          const padding = 10;

                          const spaceOnRight = window.innerWidth - rect.right;
                          const x = spaceOnRight > tooltipWidth + padding
                            ? rect.right + padding
                            : rect.left - padding;

                          const spaceBelow = window.innerHeight - rect.top;
                          const y = spaceBelow > tooltipHeight
                            ? rect.top
                            : Math.max(padding, rect.bottom - tooltipHeight);

                          setHoveredTask({
                            task,
                            x: Math.max(padding, x),
                            y
                          });
                        }}
                        onMouseLeave={() => setHoveredTask(null)}
                        className="text-xs p-1.5 rounded relative bg-blue-50 border border-blue-200 text-blue-800 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="truncate font-medium">🔔 {task.title}</div>
                        <div className="text-xs text-blue-600 mt-0.5">
                          Follow-up {task.delegatedTo ? `with ${task.delegatedTo}` : ''}
                        </div>
                      </div>
                    ))}

                    {isOver && (
                      <div className="text-xs text-primary-600 italic">Drop here</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Unassigned Tasks */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Unassigned Tasks ({ unassignedTasks?.filter(task => task.type !== 'delegated')?.length || 0})
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Drag to schedule)
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {unassignedTasks?.filter(task => task.type !== 'delegated')?.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedTask(task)}
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${task.priority === 'high' ? 'bg-red-50 border border-red-200 hover:bg-red-100' : ''}
                ${task.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100' : ''}
                ${task.priority === 'low' ? 'bg-green-50 border border-green-200 hover:bg-green-100' : ''}
                ${draggedTask?.id === task.id ? 'opacity-50 scale-95' : 'hover:shadow-md'}
              `}
            >
              <div className="font-medium text-sm truncate">{task.title}</div>
              {task.dueDate && (
                <div className="text-xs text-gray-600 mt-1">
                  Due: {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                ✋ Drag to assign or click to view
              </div>
            </div>
          ))}
          {(!unassignedTasks || unassignedTasks.length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500">
              All tasks are assigned! Create new tasks in the Capture page.
            </div>
          )}
        </div>
      </Card>

      {/* Hover Tooltip for Tasks */}
      {hoveredTask && (
        <div
          className="fixed z-50 bg-white shadow-lg rounded-lg p-4 border border-gray-200 max-w-sm"
          style={{
            left: `${hoveredTask.x}px`,
            top: `${hoveredTask.y}px`,
          }}
        >
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">{hoveredTask.task.title}</div>
            {hoveredTask.task.description && (
              <div className="text-sm text-gray-600">{hoveredTask.task.description}</div>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${
                hoveredTask.task.priority === 'high' ? 'bg-red-100 text-red-800' :
                hoveredTask.task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {hoveredTask.task.priority}
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                {hoveredTask.task.type}
              </span>
            </div>
            {hoveredTask.task.dueDate && (
              <div className="text-sm text-gray-600">
                Due: {format(new Date(hoveredTask.task.dueDate), 'MMM d, yyyy')}
              </div>
            )}
            {hoveredTask.task.followUpDate && (
              <div className="text-sm text-gray-600">
                Follow-up: {format(new Date(hoveredTask.task.followUpDate), 'MMM d, yyyy')}
              </div>
            )}
            {hoveredTask.task.delegatedTo && (
              <div className="text-sm text-gray-600">
                Delegated to: {hoveredTask.task.delegatedTo}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover Tooltip for Google Calendar Events */}
      {hoveredEvent && (
        <div
          className="fixed z-50 bg-white shadow-lg rounded-lg p-4 border border-purple-200 max-w-sm"
          style={{
            left: `${hoveredEvent.x}px`,
            top: `${hoveredEvent.y}px`,
          }}
        >
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg">📅</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{hoveredEvent.event.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">Google Calendar Event</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-purple-50 p-2 rounded">
              <span className="font-medium">🕒</span>
              <div>
                <div>{format(new Date(hoveredEvent.event.startTime), 'MMM d, yyyy')}</div>
                <div className="text-xs text-gray-600">
                  {format(new Date(hoveredEvent.event.startTime), 'h:mm a')} - {format(new Date(hoveredEvent.event.endTime), 'h:mm a')}
                </div>
              </div>
            </div>
            {hoveredEvent.event.accountEmail && (
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <span>📧</span>
                <span>{hoveredEvent.event.accountEmail}</span>
              </div>
            )}
            <div className="text-xs text-gray-500 italic border-t pt-2 mt-2">
              Read-only event from Google Calendar
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {/* Calendar Event Modal */}
      {selectedEvent && (
        <CalendarEventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
