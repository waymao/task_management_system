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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-xs font-medium text-gray-600">Today</h3>
        <p className="text-2xl font-bold text-primary-600 mt-1">{todayCount}</p>
        <p className="text-xs text-gray-500 mt-0.5">tasks due today</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-xs font-medium text-gray-600">Overdue</h3>
        <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p>
        <p className="text-xs text-gray-500 mt-0.5">tasks past due</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-xs font-medium text-gray-600">Immediate</h3>
        <p className="text-2xl font-bold text-yellow-600 mt-1">{immediateCount}</p>
        <p className="text-xs text-gray-500 mt-0.5">tasks need attention</p>
      </div>
    </div>
  );
}
