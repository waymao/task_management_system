import { useState } from 'react';
import { Button } from '../common/Button';
import { useCompleteTask, useDeleteTask, useUpdateTask } from '../../hooks/useTasks';
import { formatDate, isOverdue } from '../../utils/date';
import type { Task } from '../../types';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(task.dueDate || task.followUpDate || '');

  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const handleComplete = () => {
    completeTask.mutate(task.id);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id);
    }
  };

  const handleSaveDate = () => {
    const updateData: any = {};
    if (task.type === 'todo') {
      updateData.dueDate = newDate;
    } else if (task.type === 'delegated') {
      updateData.followUpDate = newDate;
    }

    updateTask.mutate({ id: task.id, data: updateData });
    setIsEditingDate(false);
  };

  const handleCancelEdit = () => {
    setNewDate(task.dueDate || task.followUpDate || '');
    setIsEditingDate(false);
  };

  const isTaskOverdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border transition-all
        ${showActions ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}
        hover:shadow-md
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <input
        type="checkbox"
        checked={false}
        onChange={handleComplete}
        className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />

      <div className="flex-1">
        <p className="font-medium text-gray-900">{task.title}</p>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
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
          {isEditingDate ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newDate ? new Date(newDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setNewDate(new Date(e.target.value).toISOString())}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              />
              <Button size="sm" variant="primary" onClick={handleSaveDate}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              {task.dueDate && (
                <span
                  className={`text-xs cursor-pointer hover:underline ${isTaskOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}
                  onClick={() => setIsEditingDate(true)}
                >
                  {isTaskOverdue ? 'Overdue: ' : 'Due: '}
                  {formatDate(task.dueDate)}
                </span>
              )}
              {task.delegatedTo && (
                <span className="text-xs text-purple-600">
                  Delegated to: {task.delegatedTo}
                </span>
              )}
              {task.followUpDate && (
                <span
                  className="text-xs text-gray-600 cursor-pointer hover:underline"
                  onClick={() => setIsEditingDate(true)}
                >
                  Follow-up: {formatDate(task.followUpDate)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {showActions && !isEditingDate && (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIsEditingDate(true)}>
            Edit
          </Button>
          <Button size="sm" variant="primary" onClick={handleComplete}>
            Complete
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
