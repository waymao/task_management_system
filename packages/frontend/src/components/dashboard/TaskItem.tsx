import { useCompleteTask, useUncompleteTask } from '../../hooks/useTasks';
import { formatDate, isOverdue } from '../../utils/date';
import type { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  onClick?: () => void;
}

export function TaskItem({ task, onClick }: TaskItemProps) {
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  const isCompleted = task.status === 'completed';
  const isTaskOverdue = task.dueDate ? isOverdue(task.dueDate) : false;

  const handleToggleComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isCompleted) {
      uncompleteTask.mutate(task.id);
    } else {
      completeTask.mutate(task.id);
    }
  };

  return (
    <div
      className={`
        flex items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer
        ${isCompleted ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200'}
        hover:shadow-md hover:border-gray-300
      `}
      onClick={onClick}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleToggleComplete}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`
            text-xs px-1.5 py-0.5 rounded-full font-medium
            ${task.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
            ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
          `}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className={`text-xs ${isTaskOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
              {isTaskOverdue ? 'Overdue: ' : 'Due: '}
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.delegatedTo && (
            <span className="text-xs text-purple-600">
              → {task.delegatedTo}
            </span>
          )}
          {task.followUpDate && (
            <span className="text-xs text-blue-600">
              Follow-up: {formatDate(task.followUpDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
