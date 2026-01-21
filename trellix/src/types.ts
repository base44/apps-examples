export type View = { type: 'boards' } | { type: 'board'; name: string } | { type: 'profile' };
export type AuthStep = 'login' | 'verify';

export type BoardColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  email: string;
  full_name?: string | null;
  role?: string | null;
  created_date: string;
  is_verified?: boolean;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  team_id?: string;
  owner_email?: string;
  color: BoardColor;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  board_id?: string;
  assignee_email?: string;
  priority?: TaskPriority;
  due_date?: string;
  attachments?: TaskAttachment[];
  position?: number;
  labels?: string[];
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  assignee_email?: string;
  labels?: string[];
  status: TaskStatus;
}