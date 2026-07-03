import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskWithRelations, TaskPriority, TaskStatus } from '@/types/database';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FileUploadZone, { AttachmentItem } from './FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  task: TaskWithRelations | null;
  open: boolean;
  onClose: () => void;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Baixa', className: 'priority-low' },
  medium: { label: 'Média', className: 'priority-medium' },
  high: { label: 'Alta', className: 'priority-high' },
  critical: { label: 'Crítica', className: 'priority-critical' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType }> = {
  todo: { label: 'A Fazer', icon: Circle },
  doing: { label: 'Fazendo', icon: PlayCircle },
  done: { label: 'Feito', icon: CheckCircle2 },
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, open, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { addComment, toggleChecklistItem, addChecklistItem, deleteTask, updateTask } = useTasks();
  const { deleteFile } = useFileUpload();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showUploadZone, setShowUploadZone] = useState(false);

  if (!task) return null;

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const canEdit = isAdmin || task.assignee_id === user?.id;
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done';

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment.mutate({ taskId: task.id, content: newComment });
    setNewComment('');
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    addChecklistItem.mutate({ taskId: task.id, text: newChecklistItem });
    setNewChecklistItem('');
  };

  const handleToggleChecklist = (itemId: string, currentState: boolean) => {
    if (!canEdit) return;
    toggleChecklistItem.mutate({ id: itemId, is_completed: !currentState });
  };

  const handleDelete = () => {
    if (!isAdmin) return;
    deleteTask.mutate(task.id);
    onClose();
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!canEdit) return;
    updateTask.mutate({ id: task.id, status: newStatus });
  };

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!canEdit) return;

    try {
      // Delete from storage
      await deleteFile(filePath);
      
      // Delete from database
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Anexo removido!');
    } catch (error: any) {
      toast.error('Erro ao remover anexo: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', priority.className)}>
                  {priority.label}
                </Badge>
                {task.task_type === 'daily' && (
                  <Badge variant="secondary" className="text-xs">
                    Diária
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Atrasada
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-display">{task.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status buttons */}
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              {(['todo', 'doing', 'done'] as TaskStatus[]).map((s) => {
                const config = statusConfig[s];
                const Icon = config.icon;
                const isActive = task.status === s;
                return (
                  <Button
                    key={s}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(s)}
                    className={cn(
                      isActive && s === 'todo' && 'bg-status-todo hover:bg-status-todo/90',
                      isActive && s === 'doing' && 'bg-status-doing hover:bg-status-doing/90',
                      isActive && s === 'done' && 'bg-status-done hover:bg-status-done/90'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium mb-2 font-display">Descrição</h3>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Prazo: {format(new Date(task.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            {task.scheduled_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Previsto: {format(new Date(task.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            )}
            {task.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{task.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Criado em: {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 font-display">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium font-display flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos ({task.attachments?.length || 0})
              </h3>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadZone(!showUploadZone)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>

            {showUploadZone && canEdit && (
              <div className="mb-4">
                <FileUploadZone
                  taskId={task.id}
                  onUploadComplete={() => setShowUploadZone(false)}
                  compact
                />
              </div>
            )}

            {task.attachments && task.attachments.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((attachment) => (
                  <AttachmentItem
                    key={attachment.id}
                    attachment={{
                      id: attachment.id,
                      fileName: attachment.file_name,
                      filePath: attachment.file_path,
                      fileType: attachment.file_type,
                    }}
                    canDelete={canEdit}
                    onDelete={() => handleDeleteAttachment(attachment.id, attachment.file_path)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum anexo
              </p>
            )}
          </div>

          <Separator />

          {/* Checklist */}
          <div>
            <h3 className="text-sm font-medium mb-3 font-display">Checklist</h3>
            <div className="space-y-2">
              {task.checklist_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.is_completed}
                    onCheckedChange={() => handleToggleChecklist(item.id, item.is_completed)}
                    disabled={!canEdit}
                  />
                  <span
                    className={cn(
                      'text-sm',
                      item.is_completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
              
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Novo item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddChecklistItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="text-sm font-medium mb-3 font-display">Comentários</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {task.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {comment.user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.user?.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
              
              {(!task.comments || task.comments.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum comentário ainda
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Textarea
                placeholder="Adicionar comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-[80px]"
              />
              <Button onClick={handleAddComment} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <>
              <Separator />
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Tarefa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir esta tarefa? Essa ação não pode ser
                        desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className={buttonVariants({ variant: 'destructive' })}
                        onClick={handleDelete}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
