import { useState, FormEvent } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useCreateTask } from '../../hooks/useTasks';
import type { TaskType } from '../../types';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureType = 'immediate' | 'later' | 'followup';

export function QuickCaptureModal({ isOpen, onClose }: QuickCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<CaptureType>('immediate');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [delegatedTo, setDelegatedTo] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const createTask = useCreateTask();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    const taskData: any = {
      title: title.trim(),
    };

    if (activeTab === 'immediate') {
      taskData.type = 'immediate' as TaskType;
    } else if (activeTab === 'later') {
      if (!dueDate) {
        alert('Please select a due date');
        return;
      }
      taskData.type = 'todo' as TaskType;
      taskData.dueDate = new Date(dueDate).toISOString();
    } else if (activeTab === 'followup') {
      if (!delegatedTo.trim()) {
        alert('Please enter who this is delegated to');
        return;
      }
      if (!followUpDate) {
        alert('Please select a follow-up date');
        return;
      }
      taskData.type = 'delegated' as TaskType;
      taskData.delegatedTo = delegatedTo.trim();
      taskData.followUpDate = new Date(followUpDate).toISOString();
    }

    await createTask.mutateAsync(taskData);

    // Reset form
    setTitle('');
    setDueDate('');
    setDelegatedTo('');
    setFollowUpDate('');
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDueDate('');
    setDelegatedTo('');
    setFollowUpDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Capture</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('immediate')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'immediate'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚡ Immediate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('later')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'later'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Later
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'followup'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 Follow Up
          </button>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'immediate' && (
            <>
              <p className="text-sm text-gray-600">
                Add a task to do now - goes straight to your action list
              </p>
              <Input
                type="text"
                placeholder="What needs to be done now?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </>
          )}

          {activeTab === 'later' && (
            <>
              <p className="text-sm text-gray-600">
                Schedule a task for a specific date
              </p>
              <Input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          )}

          {activeTab === 'followup' && (
            <>
              <p className="text-sm text-gray-600">
                Delegate a task and set a follow-up reminder
              </p>
              <Input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delegated To
                </label>
                <Input
                  type="text"
                  placeholder="Person or team name"
                  value={delegatedTo}
                  onChange={(e) => setDelegatedTo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-Up Date
                </label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
