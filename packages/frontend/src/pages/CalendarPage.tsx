import { useTasks } from '../hooks/useTasks';
import { Calendar } from '../components/calendar/Calendar';
import { useState } from 'react';
import type { Task } from '../types';

export function CalendarPage() {
  const { data: tasks, isLoading, error } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg">Failed to load calendar</p>
      </div>
    );
  }

  const allTasks = tasks || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-gray-600">
          View your tasks by their due dates
        </p>
      </div>

      <Calendar
        tasks={allTasks}
        onTaskClick={setSelectedTask}
      />

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {selectedTask.description && (
              <p className="text-gray-600 mb-4">{selectedTask.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Priority:</span>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${selectedTask.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                  ${selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${selectedTask.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {selectedTask.priority}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <span className="text-sm text-gray-600">{selectedTask.type}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className="text-sm text-gray-600">{selectedTask.status}</span>
              </div>

              {selectedTask.delegatedTo && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Delegated to:</span>
                  <span className="text-sm text-gray-600">{selectedTask.delegatedTo}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
