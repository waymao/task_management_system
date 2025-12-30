import { useState } from 'react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { useAssignments } from '../../hooks/useAssignments';
import { TaskItem } from './TaskItem';
import { TaskDetailModal } from '../common/TaskDetailModal';
import type { Task, TimeSlot } from '../../types';

interface CurrentFocusTasksProps {
  tasks: Task[];
}

// Helper function to get current time slot
const getCurrentTimeSlot = (): TimeSlot => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'allday';
};

// Helper to check if a time slot is in the past
const isSlotInPast = (date: Date, slot: TimeSlot, currentSlot: TimeSlot): boolean => {
  const today = new Date();
  const slotOrder: TimeSlot[] = ['morning', 'afternoon', 'evening', 'allday'];

  const dateStr = format(date, 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // If assignment date is before today, it's overdue
  if (dateStr < todayStr) return true;

  // If assignment is today, check if the slot has passed
  if (dateStr === todayStr) {
    const slotIndex = slotOrder.indexOf(slot);
    const currentSlotIndex = slotOrder.indexOf(currentSlot);
    return slotIndex < currentSlotIndex;
  }

  return false;
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  allday: 'All Day',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export function CurrentFocusTasks({ tasks }: CurrentFocusTasksProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const today = new Date();
  const currentSlot = getCurrentTimeSlot();

  // Fetch assignments from 30 days ago to today to check for overdue assignments
  const thirtyDaysAgo = subDays(today, 30);
  const startDate = startOfDay(thirtyDaysAgo).toISOString();
  const endDate = endOfDay(today).toISOString();

  const { data: allAssignments } = useAssignments({ startDate, endDate });

  // Get tasks with overdue deadlines (dueDate < today and status pending)
  const deadlineOverdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status !== 'pending') return false;
    const dueDate = new Date(task.dueDate);
    const todayStart = startOfDay(today);
    return dueDate < todayStart;
  });

  // Get tasks with overdue assignments (assigned to past time slots, still pending)
  const assignmentOverdueTasks = (allAssignments || [])
    .filter((assignment) => {
      const assignmentDate = new Date(assignment.date);
      return (
        assignment.task?.status === 'pending' &&
        isSlotInPast(assignmentDate, assignment.slot, currentSlot)
      );
    })
    .map((assignment) => assignment.task)
    .filter((task): task is Task => task !== undefined && task !== null);

  // Combine and deduplicate overdue tasks
  const overdueTasksMap = new Map<string, Task>();
  deadlineOverdueTasks.forEach((task) => overdueTasksMap.set(task.id, task));
  assignmentOverdueTasks.forEach((task) => overdueTasksMap.set(task.id, task));
  const overdueTasks = Array.from(overdueTasksMap.values());

  // Get tasks assigned to current time block (today + current slot, excluding overdue ones)
  const currentBlockTasks = (allAssignments || [])
    .filter((assignment) => {
      const assignmentDate = format(new Date(assignment.date), 'yyyy-MM-dd');
      const todayDate = format(today, 'yyyy-MM-dd');
      // Only include tasks for current slot that aren't already in overdue list
      return (
        assignmentDate === todayDate &&
        assignment.slot === currentSlot &&
        assignment.task?.status === 'pending' &&
        !overdueTasksMap.has(assignment.task?.id || '')
      );
    })
    .map((assignment) => assignment.task)
    .filter((task): task is Task => task !== undefined && task !== null);

  const hasOverdue = overdueTasks.length > 0;
  const hasCurrentBlock = currentBlockTasks.length > 0;

  if (!hasOverdue && !hasCurrentBlock) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Current Focus
        </h2>
        <p className="text-sm text-gray-500 text-center py-6">
          No overdue tasks or tasks scheduled for this time block. Great job!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Current Focus
        </h2>

        {/* Overdue Tasks */}
        {hasOverdue && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
              <span>⚠️</span>
              Overdue Tasks ({overdueTasks.length})
            </h3>
            <div className="space-y-1.5">
              {overdueTasks.map((task) => (
                <TaskItem key={task.id} task={task} onClick={() => setSelectedTask(task)} />
              ))}
            </div>
          </div>
        )}

        {/* Current Time Block Tasks */}
        {hasCurrentBlock && (
          <div>
            <h3 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
              <span>📍</span>
              {SLOT_LABELS[currentSlot]} Tasks ({currentBlockTasks.length})
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              Tasks scheduled for this time block
            </p>
            <div className="space-y-1.5">
              {currentBlockTasks.map((task) => (
                <TaskItem key={task.id} task={task} onClick={() => setSelectedTask(task)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
