import { TaskItem } from './TaskItem';
import type { Task } from '../../types';

interface ImmediateTodosListProps {
  tasks: Task[];
}

export function ImmediateTodosList({ tasks }: ImmediateTodosListProps) {
  const immediateTasks = tasks.filter((t) => t.type === 'immediate');

  if (immediateTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Immediate Todos
        </h2>
        <p className="text-gray-500 text-center py-8">
          No immediate todos. Use quick capture to add urgent tasks!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        Immediate Todos ({immediateTasks.length})
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        No deadline, do ASAP
      </p>
      <div className="space-y-2">
        {immediateTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
