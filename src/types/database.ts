export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'daily' | 'one_time';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type AppRole = 'admin' | 'user';

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  created_by_id: string;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  location: string | null;
  due_date: string;
  scheduled_date: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  assignee?: Profile | null;
  creator?: Profile | null;
  tags?: Tag[];
  checklist_items?: ChecklistItem[];
  comments?: Comment[];
}

export interface TaskTag {
  id: string;
  task_id: string;
  tag_id: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  text: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  uploaded_by_id: string;
  created_at: string;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCompletionTime: number;
  onTimeRate: number;
}

export interface UserMetrics extends TaskMetrics {
  userId: string;
  userName: string;
}
