import { useState } from 'react';
import { TaskItem } from './TaskItem';
import { TaskDetailModal } from '../common/TaskDetailModal';
import type { Task } from '../../types';

interface TodosByDateProps {
  tasks: Task[];
}

export function TodosByDate({ tasks }: TodosByDateProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const todoTasks = tasks
    .filter((t) => t.type === 'todo')
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  if (todoTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">📅</span>
          Todos by Date
        </h2>
        <p className="text-sm text-gray-500 text-center py-6">
          No scheduled todos yet. Start planning your tasks!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">📅</span>
          Todos by Date ({todoTasks.length})
        </h2>
        <p className="text-xs text-gray-600 mb-2">
          Tasks with specific due dates
        </p>
        <div className="space-y-1.5">
          {todoTasks.map((task) => (
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
