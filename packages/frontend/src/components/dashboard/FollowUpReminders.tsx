import { useState } from 'react';
import { TaskItem } from './TaskItem';
import { TaskDetailModal } from '../common/TaskDetailModal';
import type { Task } from '../../types';

interface FollowUpRemindersProps {
  tasks: Task[];
}

export function FollowUpReminders({ tasks }: FollowUpRemindersProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const delegatedTasks = tasks
    .filter((t) => t.type === 'delegated')
    .sort((a, b) => {
      if (!a.followUpDate) return 1;
      if (!b.followUpDate) return -1;
      return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
    });

  if (delegatedTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">👥</span>
          Follow-up Reminders
        </h2>
        <p className="text-sm text-gray-500 text-center py-6">
          No delegated tasks to follow up on.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">👥</span>
          Follow-up Reminders ({delegatedTasks.length})
        </h2>
        <p className="text-xs text-gray-600 mb-2">
          Tasks delegated to others
        </p>
        <div className="space-y-1.5">
          {delegatedTasks.map((task) => (
            <TaskItem key={task.id} task={task} onClick={() => setSelectedTask(task)} />
          ))}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
