import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { useUpdateTask, useCompleteTask, useUncompleteTask, useDeleteTask } from '../../hooks/useTasks';
import type { Task, TaskPriority, TaskStatus } from '../../types';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  readOnly?: boolean;
}

export function TaskDetailModal({ task, onClose, readOnly = false }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    delegatedTo: task.delegatedTo || '',
    followUpDate: task.followUpDate ? format(new Date(task.followUpDate), 'yyyy-MM-dd') : '',
  });

  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const deleteTask = useDeleteTask();

  const handleSave = () => {
    updateTask.mutate(
      {
        id: task.id,
        data: {
          title: editedTask.title,
          description: editedTask.description || null,
          priority: editedTask.priority,
          dueDate: editedTask.dueDate || null,
          delegatedTo: editedTask.delegatedTo || null,
          followUpDate: editedTask.followUpDate || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleToggleComplete = () => {
    if (task.status === 'completed') {
      uncompleteTask.mutate(task.id, {
        onSuccess: () => onClose(),
      });
    } else {
      completeTask.mutate(task.id, {
        onSuccess: () => onClose(),
      });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id, {
        onSuccess: () => onClose(),
      });
    }
  };

  // Check if this is a Google Calendar event (read-only)
  const isGoogleEvent = task.id.startsWith('gcal-');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isGoogleEvent ? 'Google Calendar Event' : 'Task Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {isEditing && !isGoogleEvent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                placeholder="Task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                placeholder="Task description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={editedTask.dueDate}
                  onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                />
              </div>
            </div>

            {task.type === 'delegated' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delegated To
                  </label>
                  <Input
                    value={editedTask.delegatedTo}
                    onChange={(e) => setEditedTask({ ...editedTask, delegatedTo: e.target.value })}
                    placeholder="Person's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <Input
                    type="date"
                    value={editedTask.followUpDate}
                    onChange={(e) => setEditedTask({ ...editedTask, followUpDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave} disabled={updateTask.isPending}>
                {updateTask.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditedTask({
                    title: task.title,
                    description: task.description || '',
                    priority: task.priority,
                    dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
                    delegatedTo: task.delegatedTo || '',
                    followUpDate: task.followUpDate ? format(new Date(task.followUpDate), 'yyyy-MM-dd') : '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{task.title}</h4>
            </div>

            {task.description && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Priority:</span>
                <div className="mt-1">
                  <span
                    className={`
                    inline-block text-xs px-2 py-1 rounded-full font-medium
                    ${task.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                    ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${task.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                  `}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <p className="text-sm text-gray-600 mt-1">{task.type}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="mt-1">
                  <span
                    className={`
                    inline-block text-xs px-2 py-1 rounded-full font-medium
                    ${task.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${task.status === 'pending' ? 'bg-blue-100 text-blue-800' : ''}
                    ${task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                  `}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              {task.dueDate && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Due Date:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
              )}

              {task.delegatedTo && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Delegated to:</span>
                  <p className="text-sm text-gray-600 mt-1">{task.delegatedTo}</p>
                </div>
              )}

              {task.followUpDate && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Follow-up:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(task.followUpDate), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {!isGoogleEvent && !readOnly && (
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setIsEditing(true)}>Edit Task</Button>
                <Button
                  variant={task.status === 'completed' ? 'ghost' : 'primary'}
                  onClick={handleToggleComplete}
                  disabled={completeTask.isPending || uncompleteTask.isPending}
                >
                  {task.status === 'completed' ? 'Mark as Pending' : 'Mark as Complete'}
                </Button>
                <div className="flex-1" />
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteTask.isPending}
                >
                  {deleteTask.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            )}

            {isGoogleEvent && (
              <div className="text-xs text-gray-500 italic border-t pt-3">
                This is a read-only event from Google Calendar
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
