import { TaskItem } from './TaskItem';
import type { Task } from '../../types';

interface TodosByDateProps {
  tasks: Task[];
}

export function TodosByDate({ tasks }: TodosByDateProps) {
  const todoTasks = tasks
    .filter((t) => t.type === 'todo')
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  if (todoTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">📅</span>
          Todos by Date
        </h2>
        <p className="text-gray-500 text-center py-8">
          No scheduled todos yet. Start planning your tasks!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">📅</span>
        Todos by Date ({todoTasks.length})
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Tasks with specific due dates
      </p>
      <div className="space-y-2">
        {todoTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
