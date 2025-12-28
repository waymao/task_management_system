export type TaskType = 'todo' | 'delegated' | 'immediate';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  delegatedTo?: string | null;
  followUpDate?: string | null;
  userId: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  dueDate?: string;
  delegatedTo?: string;
  followUpDate?: string;
  projectId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  delegatedTo?: string | null;
  followUpDate?: string | null;
  projectId?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
