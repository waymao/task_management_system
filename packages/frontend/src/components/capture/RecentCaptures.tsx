import { useTasks } from '../../hooks/useTasks';
import { formatDate, formatRelative } from '../../utils/date';

export function RecentCaptures() {
  const { data: tasks, isLoading } = useTasks({ status: 'pending' });

  const recentTasks = tasks?.slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Captures</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (recentTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Captures</h3>
        <p className="text-gray-500">No recent captures yet. Start capturing tasks above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Captures (Last 10)</h3>
      <div className="space-y-2">
        {recentTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{task.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${task.type === 'immediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${task.type === 'todo' ? 'bg-blue-100 text-blue-800' : ''}
                  ${task.type === 'delegated' ? 'bg-purple-100 text-purple-800' : ''}
                `}>
                  {task.type}
                </span>
                {task.type === 'todo' && task.dueDate && (
                  <span className="text-xs text-gray-600">
                    Due: {formatDate(task.dueDate)}
                  </span>
                )}
                {task.type === 'delegated' && task.delegatedTo && (
                  <span className="text-xs text-gray-600">
                    Delegated to: {task.delegatedTo}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {formatRelative(task.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
