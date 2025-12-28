import { TaskItem } from './TaskItem';
import type { Task } from '../../types';

interface FollowUpRemindersProps {
  tasks: Task[];
}

export function FollowUpReminders({ tasks }: FollowUpRemindersProps) {
  const delegatedTasks = tasks
    .filter((t) => t.type === 'delegated')
    .sort((a, b) => {
      if (!a.followUpDate) return 1;
      if (!b.followUpDate) return -1;
      return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
    });

  if (delegatedTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">👥</span>
          Follow-up Reminders
        </h2>
        <p className="text-gray-500 text-center py-8">
          No delegated tasks to follow up on.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">👥</span>
        Follow-up Reminders ({delegatedTasks.length})
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Tasks delegated to others
      </p>
      <div className="space-y-2">
        {delegatedTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
