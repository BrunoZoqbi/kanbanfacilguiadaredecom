import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskWithRelations, TaskPriority, TaskStatus, ReagendamentoMotivo, REAGENDAMENTO_MOTIVO_LABELS } from '@/types/database';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useAssignableProfiles } from '@/hooks/useAssignableProfiles';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  RefreshCw,
  ExternalLink,
  Pencil,
  X,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FileUploadZone, { AttachmentItem } from './FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  task: TaskWithRelations | null;
  open: boolean;
  onClose: () => void;
  onOpenTask?: (taskId: string) => void;
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

interface EditDraft {
  title: string;
  description: string;
  priority: TaskPriority;
  location: string;
  assignee_id: string;
  due_date: string;
  scheduled_date: string;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, open, onClose, onOpenTask }) => {
  const { user, isAdmin, role } = useAuth();
  const { addComment, toggleChecklistItem, addChecklistItem, deleteTask, updateTask, profiles } = useTasks();
  const { deleteFile } = useFileUpload();
  const isGestorTecnico = useIsGestorTecnico();
  const assignableProfiles = useAssignableProfiles(profiles);
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [pendingEditScope, setPendingEditScope] = useState<'single' | 'future' | null>(null);
  const [pendingReagendamentoScope, setPendingReagendamentoScope] = useState<'single' | 'future' | null>(null);
  const [reagendamentoMotivo, setReagendamentoMotivo] = useState<ReagendamentoMotivo | ''>('');
  const [reagendamentoObservacao, setReagendamentoObservacao] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isGeneratingInstances, setIsGeneratingInstances] = useState(false);
  const [assigneeIsAdmin, setAssigneeIsAdmin] = useState(false);

  // Espelha a checagem da RLS de tasks (is_gestor_tecnico() AND NOT
  // has_role(assignee_id, 'admin')) — precisa saber se o responsável ATUAL
  // é admin para decidir se o Gestor Técnico pode editar esta tarefa.
  useEffect(() => {
    let active = true;
    if (!task?.assignee_id) {
      setAssigneeIsAdmin(false);
      return;
    }
    supabase
      .rpc('has_role', { _user_id: task.assignee_id, _role: 'admin' })
      .then(({ data }) => {
        if (active) setAssigneeIsAdmin(!!data);
      });
    return () => {
      active = false;
    };
  }, [task?.assignee_id]);

  if (!task) return null;

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const canEdit =
    isAdmin || task.assignee_id === user?.id || (isGestorTecnico && !assigneeIsAdmin);
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done';
  const isInstance = !!task.parent_task_id;
  const isTemplate = !task.parent_task_id && task.recurrence_type !== 'none';
  const canGenerateInstances =
    isTemplate && ['admin', 'gestor_tecnico', 'gestor_comercial'].includes(role ?? '');

  const startEditing = () => {
    setEditDraft({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      location: task.location ?? '',
      assignee_id: task.assignee_id ?? '',
      due_date: format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm"),
      scheduled_date: task.scheduled_date ? format(new Date(task.scheduled_date), 'yyyy-MM-dd') : '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditDraft(null);
    setPendingEditScope(null);
    setPendingReagendamentoScope(null);
    setReagendamentoMotivo('');
    setReagendamentoObservacao('');
  };

  // Reagendamento = mudança no prazo (due_date) ou na data prevista
  // (scheduled_date) — dispara o AlertDialog de motivo obrigatório.
  const isReagendamento = (draft: EditDraft) => {
    const newDueTime = new Date(draft.due_date).getTime();
    const oldDueTime = new Date(task.due_date).getTime();
    if (newDueTime !== oldDueTime) return true;
    const oldScheduled = task.scheduled_date ? task.scheduled_date.slice(0, 10) : '';
    return draft.scheduled_date !== oldScheduled;
  };

  const saveEdit = async (
    scope: 'single' | 'future',
    reagendamento?: { motivo: ReagendamentoMotivo; observacao: string }
  ) => {
    if (!editDraft) return;
    setIsSavingEdit(true);
    try {
      const novoAssigneeId = editDraft.assignee_id || null;
      const assigneeMudou = novoAssigneeId !== (task.assignee_id ?? null);

      // Campos propagáveis para template + instâncias futuras (escopo
      // 'future'). due_date/scheduled_date ficam FORA daqui de propósito:
      // cada instância recorrente tem seu próprio prazo já calculado pela
      // Edge Function gerar-instancias-recorrentes — sobrescrever em massa
      // quebraria esse cálculo (ver lição em CLAUDE.md).
      const updates = {
        title: editDraft.title,
        description: editDraft.description || null,
        priority: editDraft.priority,
        location: editDraft.location || null,
        assignee_id: novoAssigneeId,
      };

      const currentTaskUpdates: Record<string, unknown> = {
        ...updates,
        due_date: new Date(editDraft.due_date).toISOString(),
        scheduled_date: editDraft.scheduled_date || null,
      };
      if (reagendamento) {
        currentTaskUpdates.reagendamento_motivo = reagendamento.motivo;
        currentTaskUpdates.reagendamento_observacao = reagendamento.observacao || null;
        currentTaskUpdates.reagendamento_count = (task.reagendamento_count ?? 0) + 1;
        currentTaskUpdates.reagendamento_at = new Date().toISOString();
      }

      // Always update this task
      const { error: err1 } = await supabase
        .from('tasks')
        .update(currentTaskUpdates)
        .eq('id', task.id);
      if (err1) throw err1;

      // Notifica o novo responsável, exceto quando ele é quem fez a troca.
      // Fire-and-forget, mesmo padrão de useTasks.ts (createTask).
      if (assigneeMudou && novoAssigneeId && novoAssigneeId !== user?.id) {
        supabase
          .rpc('criar_notificacao', {
            p_user_id: novoAssigneeId,
            p_tipo: 'tarefa_atribuida',
            p_titulo: 'Nova tarefa atribuída a você',
            p_mensagem: editDraft.title,
            p_link: '/',
          })
          .then(() => {});
      }

      if (scope === 'future' && isInstance && task.parent_task_id) {
        // Update template
        const { error: err2 } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', task.parent_task_id);
        if (err2) throw err2;

        // Update all future instances (due_date >= today)
        const today = new Date().toISOString().split('T')[0];
        const { error: err3 } = await supabase
          .from('tasks')
          .update(updates)
          .eq('parent_task_id', task.parent_task_id)
          .gte('due_date', today)
          .neq('id', task.id);
        if (err3) throw err3;
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-infinite'] });
      toast.success(reagendamento ? 'Tarefa reagendada!' : 'Tarefa atualizada!');
      setIsEditing(false);
      setEditDraft(null);
      setPendingEditScope(null);
      setPendingReagendamentoScope(null);
      setReagendamentoMotivo('');
      setReagendamentoObservacao('');
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Decide, para um dado escopo já resolvido (avulsa, ou instância recorrente
  // após a escolha "só esta"/"esta e futuras"), se precisa abrir o modal de
  // motivo antes de salvar de fato.
  const proceedToSaveOrReagendamento = (scope: 'single' | 'future') => {
    if (!editDraft) return;
    if (isReagendamento(editDraft)) {
      setPendingReagendamentoScope(scope);
    } else {
      saveEdit(scope);
    }
  };

  const handleSaveEditClick = () => {
    if (!editDraft) return;
    if (isInstance) {
      // Show AlertDialog to choose scope
      setPendingEditScope('single');
    } else {
      proceedToSaveOrReagendamento('single');
    }
  };

  const handleConfirmReagendamento = () => {
    if (!reagendamentoMotivo || !pendingReagendamentoScope) return;
    const scope = pendingReagendamentoScope;
    saveEdit(scope, { motivo: reagendamentoMotivo, observacao: reagendamentoObservacao.trim() });
  };

  const handleGenerateInstances = async () => {
    setIsGeneratingInstances(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-instancias-recorrentes', {
        body: { task_id: task.id },
      });
      if (error) throw error;
      const created = data?.created ?? 0;
      if (created === 0) {
        toast.info(data?.message ?? 'Nenhuma instância nova a gerar.');
      } else {
        toast.success(`${created} instância(s) recorrente(s) gerada(s)!`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['tasks-infinite'] });
      }
    } catch (e: any) {
      toast.error('Erro ao gerar instâncias: ' + e.message);
    } finally {
      setIsGeneratingInstances(false);
    }
  };

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

  const handlePdfTextExtracted = (text: string) => {
    const separador = '\n\n--- Conteúdo do PDF: ---\n\n';
    const novaDescricao = task.description ? `${task.description}${separador}${text}` : text;
    updateTask.mutate({ id: task.id, description: novaDescricao });
  };

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!canEdit) return;
    try {
      await deleteFile(filePath);
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
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn('text-xs', priority.className)}>
                    {priority.label}
                  </Badge>
                  {task.task_type === 'daily' && (
                    <Badge variant="secondary" className="text-xs">
                      Diária
                    </Badge>
                  )}
                  {isInstance && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Recorrente
                    </Badge>
                  )}
                  {isTemplate && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 border-primary/40 text-primary">
                      <RefreshCw className="h-3 w-3" />
                      Template de recorrência
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

                {/* Link "Ver tarefa original" para instâncias */}
                {isInstance && task.parent_task_id && onOpenTask && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTask(task.parent_task_id!);
                    }}
                    className="flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:no-underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver tarefa original (template)
                  </button>
                )}
              </div>

              {/* Botão editar */}
              {canEdit && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startEditing}
                  className="h-8 w-8 shrink-0"
                  aria-label="Editar tarefa"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Inline edit form */}
            {isEditing && editDraft && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Título</label>
                  <Input
                    value={editDraft.title}
                    onChange={(e) => setEditDraft((d) => d ? { ...d, title: e.target.value } : d)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                  <Textarea
                    value={editDraft.description}
                    onChange={(e) => setEditDraft((d) => d ? { ...d, description: e.target.value } : d)}
                    className="min-h-[80px]"
                  />
                </div>
                {(isAdmin || isGestorTecnico) && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Responsável</label>
                    <Select
                      value={editDraft.assignee_id || undefined}
                      onValueChange={(v) => setEditDraft((d) => (d ? { ...d, assignee_id: v } : d))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Prazo</label>
                    <Input
                      type="datetime-local"
                      value={editDraft.due_date}
                      onChange={(e) => setEditDraft((d) => d ? { ...d, due_date: e.target.value } : d)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Previsto</label>
                    <Input
                      type="date"
                      value={editDraft.scheduled_date}
                      onChange={(e) => setEditDraft((d) => d ? { ...d, scheduled_date: e.target.value } : d)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
                    <select
                      value={editDraft.priority}
                      onChange={(e) => setEditDraft((d) => d ? { ...d, priority: e.target.value as TaskPriority } : d)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Local</label>
                    <Input
                      value={editDraft.location}
                      onChange={(e) => setEditDraft((d) => d ? { ...d, location: e.target.value } : d)}
                      placeholder="Local / identificação"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={handleSaveEditClick} disabled={isSavingEdit}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSavingEdit ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}

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

            {/* Description (when not editing) */}
            {!isEditing && task.description && (
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
              {task.location && !isEditing && (
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
                    onPdfTextExtracted={handlePdfTextExtracted}
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

                {!canEdit && (!task.checklist_items || task.checklist_items.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhum item no checklist</p>
                )}

                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Novo item..."
                      aria-label="Novo item da checklist"
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
                  aria-label="Adicionar comentário"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
                <Button onClick={handleAddComment} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Gerar mais instâncias (templates de recorrência) */}
            {canGenerateInstances && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Gera as próximas 4 instâncias a partir da última existente.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateInstances}
                    disabled={isGeneratingInstances}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', isGeneratingInstances && 'animate-spin')} />
                    {isGeneratingInstances ? 'Gerando...' : 'Gerar mais instâncias'}
                  </Button>
                </div>
              </>
            )}

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

      {/* AlertDialog para escolha de escopo de edição (instâncias recorrentes) */}
      <AlertDialog open={!!pendingEditScope} onOpenChange={(open) => { if (!open) setPendingEditScope(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar tarefa recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta é uma instância de uma tarefa recorrente. Deseja editar apenas esta
              ocorrência ou propagar as alterações a esta e a todas as futuras instâncias
              (incluindo o template)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={cancelEditing}>Cancelar</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => { setPendingEditScope(null); proceedToSaveOrReagendamento('single'); }}
              disabled={isSavingEdit}
            >
              Editar só esta ocorrência
            </Button>
            <Button
              onClick={() => { setPendingEditScope(null); proceedToSaveOrReagendamento('future'); }}
              disabled={isSavingEdit}
            >
              Editar esta e todas as futuras
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de motivo do reagendamento — obrigatório quando o prazo
          (due_date) ou a data prevista (scheduled_date) mudam */}
      <AlertDialog
        open={!!pendingReagendamentoScope}
        onOpenChange={(open) => {
          if (!open) {
            setPendingReagendamentoScope(null);
            setReagendamentoMotivo('');
            setReagendamentoObservacao('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reagendando tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              O prazo desta tarefa foi alterado. Informe o motivo do reagendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <RadioGroup
                value={reagendamentoMotivo}
                onValueChange={(v) => setReagendamentoMotivo(v as ReagendamentoMotivo)}
              >
                {(Object.keys(REAGENDAMENTO_MOTIVO_LABELS) as ReagendamentoMotivo[]).map((motivo) => (
                  <div key={motivo} className="flex items-center gap-2">
                    <RadioGroupItem value={motivo} id={`reagendamento-motivo-${motivo}`} />
                    <Label htmlFor={`reagendamento-motivo-${motivo}`} className="cursor-pointer font-normal">
                      {REAGENDAMENTO_MOTIVO_LABELS[motivo]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reagendamento-observacao">Observação</Label>
              <Textarea
                id="reagendamento-observacao"
                value={reagendamentoObservacao}
                onChange={(e) => setReagendamentoObservacao(e.target.value)}
                placeholder="Detalhe opcional..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingReagendamentoScope(null);
                setReagendamentoMotivo('');
                setReagendamentoObservacao('');
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmReagendamento}
              disabled={!reagendamentoMotivo || isSavingEdit}
            >
              Confirmar reagendamento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskDetailModal;
