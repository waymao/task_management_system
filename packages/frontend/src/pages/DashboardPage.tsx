import { useTasks } from '../hooks/useTasks';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { CurrentFocusTasks } from '../components/dashboard/CurrentFocusTasks';
import { TodosByDate } from '../components/dashboard/TodosByDate';
import { FollowUpReminders } from '../components/dashboard/FollowUpReminders';
import { CompletedTasksList } from '../components/dashboard/CompletedTasksList';

export function DashboardPage() {
  const { data: pendingTasks, isLoading: isLoadingPending, error: errorPending } = useTasks({ status: 'pending' });
  const { data: completedTasks, isLoading: isLoadingCompleted } = useTasks({ status: 'completed' });

  const isLoading = isLoadingPending || isLoadingCompleted;
  const error = errorPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg">Failed to load dashboard</p>
      </div>
    );
  }

  const pending = pendingTasks || [];
  const completed = completedTasks || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Overview of all your tasks and reminders
        </p>
      </div>

      <SummaryCards tasks={pending} />

      <CurrentFocusTasks tasks={pending} />

      <TodosByDate tasks={pending} />

      <FollowUpReminders tasks={pending} />

      <CompletedTasksList tasks={completed} />
    </div>
  );
}
