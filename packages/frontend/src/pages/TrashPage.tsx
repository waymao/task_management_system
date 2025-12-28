import { useTrashTasks, useRestoreTask, usePermanentDeleteTask } from '../hooks/useTasks';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatDate } from '../utils/date';

export function TrashPage() {
  const { data: trashedTasks, isLoading, error } = useTrashTasks();
  const restoreTask = useRestoreTask();
  const permanentDeleteTask = usePermanentDeleteTask();

  const handleRestore = (taskId: string) => {
    restoreTask.mutate(taskId);
  };

  const handlePermanentDelete = (taskId: string) => {
    if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      permanentDeleteTask.mutate(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading trash...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg">Failed to load trash</p>
      </div>
    );
  }

  const tasks = trashedTasks || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trash</h1>
        <p className="text-gray-600">
          Deleted tasks can be restored or permanently deleted
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Trash is empty</p>
            <p className="text-gray-400 text-sm mt-2">
              Deleted tasks will appear here
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{task.title}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Deleted
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full font-medium
                      ${task.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                      ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      Type: {task.type}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.delegatedTo && (
                      <span className="text-xs text-gray-500">
                        Delegated to: {task.delegatedTo}
                      </span>
                    )}
                    {task.deletedAt && (
                      <span className="text-xs text-gray-400">
                        Deleted: {formatDate(task.deletedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRestore(task.id)}
                    disabled={restoreTask.isPending}
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handlePermanentDelete(task.id)}
                    disabled={permanentDeleteTask.isPending}
                  >
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
