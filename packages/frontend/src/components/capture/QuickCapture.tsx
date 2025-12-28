import { useState, FormEvent } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useCreateTask } from '../../hooks/useTasks';

export function QuickCapture() {
  const [title, setTitle] = useState('');
  const createTask = useCreateTask();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    await createTask.mutateAsync({
      title: title.trim(),
      type: 'immediate',
    });

    setTitle('');
  };

  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Capture</h3>
      <p className="text-sm text-gray-600 mb-4">
        Add an immediate todo that goes straight to your action list
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="What needs to be done now?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!title.trim() || createTask.isPending}>
          {createTask.isPending ? 'Adding...' : 'Add Now'}
        </Button>
      </form>
    </div>
  );
}
