import { useState, FormEvent } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';
import { useCreateTask } from '../../hooks/useTasks';
import type { TaskType, TaskPriority } from '../../types';

export function FullCaptureForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [delegatedTo, setDelegatedTo] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const createTask = useCreateTask();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    // Validation
    if (type === 'todo' && !dueDate) {
      alert('Todo tasks require a due date');
      return;
    }

    if (type === 'delegated' && (!delegatedTo.trim() || !followUpDate)) {
      alert('Delegated tasks require a person and follow-up date');
      return;
    }

    await createTask.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      priority,
      dueDate: type === 'todo' ? new Date(dueDate).toISOString() : undefined,
      delegatedTo: type === 'delegated' ? delegatedTo.trim() : undefined,
      followUpDate: type === 'delegated' ? new Date(followUpDate).toISOString() : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setType('todo');
    setPriority('medium');
    setDueDate('');
    setDelegatedTo('');
    setFollowUpDate('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Capture Form</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Additional details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            required
          >
            <option value="todo">Todo</option>
            <option value="delegated">Delegated</option>
            <option value="immediate">Immediate</option>
          </Select>

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>

        {type === 'todo' && (
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        )}

        {type === 'delegated' && (
          <>
            <Input
              label="Delegated To"
              type="text"
              placeholder="Person's name"
              value={delegatedTo}
              onChange={(e) => setDelegatedTo(e.target.value)}
              required
            />
            <Input
              label="Follow-up Date"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              required
            />
          </>
        )}

        {type === 'immediate' && (
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            This task will be added to your immediate todos list without a deadline.
          </p>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? 'Capturing...' : 'Capture Task'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setTitle('');
              setDescription('');
              setDueDate('');
              setDelegatedTo('');
              setFollowUpDate('');
            }}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
