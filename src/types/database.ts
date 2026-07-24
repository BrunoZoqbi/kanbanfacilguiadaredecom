export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'daily' | 'one_time';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
export type AppRole = 'admin' | 'user' | 'gestor_tecnico' | 'gestor_comercial';
export type ReagendamentoMotivo = 'pedido_tecnico' | 'pedido_cliente' | 'condicao_externa' | 'outro';

export const REAGENDAMENTO_MOTIVO_LABELS: Record<ReagendamentoMotivo, string> = {
  pedido_tecnico: 'Pedido do Técnico',
  pedido_cliente: 'A Pedido do Cliente',
  condicao_externa: 'Condição Externa (clima, acesso, energia)',
  outro: 'Outro',
};

export const REAGENDAMENTO_MOTIVO_CHART_COLORS: Record<ReagendamentoMotivo, string> = {
  pedido_tecnico: '#3b82f6', // blue-500
  pedido_cliente: '#f59e0b', // amber-500
  condicao_externa: '#a855f7', // purple-500
  outro: '#6b7280', // gray-500
};

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  phone_whatsapp?: string | null;
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

export interface TaskTypeRecord {
  id: string;
  name: string;
  label: string;
  color: string;
  is_active: boolean;
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
  item_serializado_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  recurrence_type: RecurrenceType;
  recurrence_days: number[] | null;
  recurrence_time: string | null;
  recurrence_interval: number;
  recurrence_end_date: string | null;
  recurrence_end_after: number | null;
  parent_task_id: string | null;
  reagendamento_motivo: ReagendamentoMotivo | null;
  reagendamento_count: number;
  reagendamento_observacao: string | null;
  reagendamento_at: string | null;
}

export interface TaskWithRelations extends Task {
  assignee?: Profile | null;
  creator?: Profile | null;
  tags?: Tag[];
  checklist_items?: ChecklistItem[];
  comments?: Comment[];
  attachments?: TaskAttachment[];
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
  file_path: string;
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
