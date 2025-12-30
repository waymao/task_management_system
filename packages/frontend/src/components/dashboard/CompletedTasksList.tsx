import { useState } from 'react';
import { Task } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TaskDetailModal } from '../common/TaskDetailModal';
import { useUncompleteTask, useDeleteTask } from '../../hooks/useTasks';
import { formatDate } from '../../utils/date';

interface CompletedTasksListProps {
  tasks: Task[];
}

export function CompletedTasksList({ tasks }: CompletedTasksListProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const uncompleteTask = useUncompleteTask();
  const deleteTask = useDeleteTask();

  const completedTasks = tasks.filter((task) => task.status === 'completed');

  if (completedTasks.length === 0) {
    return null;
  }

  const tasksToShow = showAll ? completedTasks : completedTasks.slice(0, 5);

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Completed Tasks ({completedTasks.length})
          </h2>
          {completedTasks.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show less' : 'Show all'}
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          {tasksToShow.map((task) => (
            <div
              key={task.id}
              className="group flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">
                    {task.title}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  {task.dueDate && (
                    <span>Due: {formatDate(task.dueDate)}</span>
                  )}
                  {task.type === 'delegated' && task.delegatedTo && (
                    <span>→ {task.delegatedTo}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    uncompleteTask.mutate(task.id);
                  }}
                  disabled={uncompleteTask.isPending}
                >
                  Undo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this task?')) {
                      deleteTask.mutate(task.id);
                    }
                  }}
                  disabled={deleteTask.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
