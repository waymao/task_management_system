import { isToday, isOverdue } from '../../utils/date';
import type { Task } from '../../types';

interface SummaryCardsProps {
  tasks: Task[];
}

export function SummaryCards({ tasks }: SummaryCardsProps) {
  const todayCount = tasks.filter(
    (t) => t.type === 'todo' && t.dueDate && isToday(t.dueDate)
  ).length;

  const overdueCount = tasks.filter(
    (t) => t.type === 'todo' && t.dueDate && isOverdue(t.dueDate)
  ).length;

  const immediateCount = tasks.filter((t) => t.type === 'immediate').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-600">Today</h3>
        <p className="text-3xl font-bold text-primary-600 mt-2">{todayCount}</p>
        <p className="text-xs text-gray-500 mt-1">tasks due today</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
        <p className="text-3xl font-bold text-red-600 mt-2">{overdueCount}</p>
        <p className="text-xs text-gray-500 mt-1">tasks past due</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-600">Immediate</h3>
        <p className="text-3xl font-bold text-yellow-600 mt-2">{immediateCount}</p>
        <p className="text-xs text-gray-500 mt-1">tasks need attention</p>
      </div>
    </div>
  );
}
