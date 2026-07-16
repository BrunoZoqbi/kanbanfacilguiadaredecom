import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, addMonths, addWeeks, startOfWeek } from 'date-fns';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { Profile, RecurrenceType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFileIcon } from './FileUploadZone';
import { ArrowLeft, Save, Upload, X, Paperclip, ListChecks, Plus, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  assignee_id: z.string().optional(),
  task_type: z.enum(['daily', 'one_time']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: z.string().min(1, 'Prazo é obrigatório'),
  scheduled_date: z.string().optional(),
  location: z.string().max(500, 'Local muito longo').optional(),
  tag_ids: z.array(z.string()).optional(),
  recurrence_type: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  recurrence_interval: z.coerce.number().int().min(1).default(1),
  recurrence_days: z.array(z.number()).default([]),
  recurrence_time: z.string().optional(),
  recurrence_end_mode: z.enum(['never', 'date', 'after']).default('never'),
  recurrence_end_date: z.string().optional(),
  recurrence_end_after: z.coerce.number().int().min(1).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const DRAFT_STORAGE_KEY = 'kanban-create-task-draft';

interface TaskDraft extends Partial<TaskFormValues> {
  checklistItems?: string[];
}

const loadDraft = (): TaskDraft | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaskDraft) : null;
  } catch {
    return null;
  }
};

const saveDraft = (draft: TaskDraft) => {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage indisponível — rascunho é conveniência, não deve quebrar o form.
  }
};

const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ver saveDraft
  }
};

function computeInstanceDates(
  baseDate: Date,
  recurrenceType: Exclude<RecurrenceType, 'none'>,
  interval: number,
  days: number[],
  endDate: Date | null,
  endAfter: number | null,
): Date[] {
  const maxCount = endAfter ? Math.min(endAfter, 4) : 4;
  const result: Date[] = [];

  if (recurrenceType === 'daily') {
    let k = 1;
    while (result.length < maxCount) {
      const d = addDays(baseDate, k * interval);
      if (endDate && d > endDate) break;
      result.push(d);
      k++;
    }
  } else if (recurrenceType === 'weekly') {
    const sortedDays = [...days].sort((a, b) => a - b);
    if (sortedDays.length === 0) return result;

    // Começa da semana que contém baseDate (domingo = 0)
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
    let cycleIndex = 0;

    outer: for (;;) {
      const currentWeekStart = addWeeks(weekStart, cycleIndex * interval);
      for (const dow of sortedDays) {
        const candidate = addDays(currentWeekStart, dow);
        if (candidate <= baseDate) continue;
        if (endDate && candidate > endDate) break outer;
        result.push(candidate);
        if (result.length >= maxCount) break outer;
      }
      cycleIndex++;
      if (cycleIndex > 104) break; // limite de segurança: 2 anos
    }
  } else if (recurrenceType === 'monthly') {
    let k = 1;
    while (result.length < maxCount) {
      const d = addMonths(baseDate, k * interval);
      if (endDate && d > endDate) break;
      result.push(d);
      k++;
    }
  }

  return result;
}

function applyRecurrenceTime(date: Date, timeStr: string | undefined, fallback: Date): Date {
  const result = new Date(date);
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    result.setHours(h, m, 0, 0);
  } else {
    result.setHours(fallback.getHours(), fallback.getMinutes(), 0, 0);
  }
  return result;
}

const CreateTaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { profiles, tags, createTask, isLoading } = useTasks();
  const { user, isAdmin } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const { uploadFile } = useFileUpload();
  const queryClient = useQueryClient();
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isSavingExtras, setIsSavingExtras] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);

  const [draft] = useState(() => loadDraft());

  const [assignableProfiles, setAssignableProfiles] = useState<Profile[]>(profiles);

  useEffect(() => {
    let active = true;

    if (isAdmin || !isGestorTecnico) {
      setAssignableProfiles(profiles);
      return;
    }

    (async () => {
      const results = await Promise.all(
        profiles.map(async (profile) => {
          const { data } = await supabase.rpc('has_role', {
            _user_id: profile.id,
            _role: 'admin',
          });
          return { profile, isAdminProfile: !!data };
        })
      );
      if (active) {
        setAssignableProfiles(results.filter((r) => !r.isAdminProfile).map((r) => r.profile));
      }
    })();

    return () => {
      active = false;
    };
  }, [profiles, isAdmin, isGestorTecnico]);

  const onDropAttachments = useCallback((acceptedFiles: File[]) => {
    setPendingAttachments((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps: getAttachmentRootProps, getInputProps: getAttachmentInputProps, isDragActive: isAttachmentDragActive } = useDropzone({
    onDrop: onDropAttachments,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const [checklistItems, setChecklistItems] = useState<string[]>(() => draft?.checklistItems ?? []);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');

  const addChecklistItemLocal = () => {
    const text = newChecklistItemText.trim();
    if (!text) return;
    setChecklistItems((prev) => [...prev, text]);
    setNewChecklistItemText('');
  };

  const removeChecklistItemLocal = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: draft?.title ?? '',
      description: draft?.description ?? '',
      assignee_id: draft?.assignee_id ?? user?.id ?? '',
      task_type: draft?.task_type ?? 'one_time',
      priority: draft?.priority ?? 'medium',
      due_date: draft?.due_date ?? '',
      scheduled_date: draft?.scheduled_date ?? '',
      location: draft?.location ?? '',
      tag_ids: draft?.tag_ids ?? [],
      recurrence_type: draft?.recurrence_type ?? 'none',
      recurrence_interval: draft?.recurrence_interval ?? 1,
      recurrence_days: draft?.recurrence_days ?? [],
      recurrence_time: draft?.recurrence_time ?? '',
      recurrence_end_mode: draft?.recurrence_end_mode ?? 'never',
      recurrence_end_date: draft?.recurrence_end_date ?? '',
      recurrence_end_after: draft?.recurrence_end_after ?? undefined,
    },
  });

  const recurrenceType = form.watch('recurrence_type');
  const recurrenceEndMode = form.watch('recurrence_end_mode');

  useEffect(() => {
    if (recurrenceType !== 'none') setShowRecurrence(true);
  }, [recurrenceType]);

  useEffect(() => {
    if (draft && (draft.title || draft.description)) {
      toast.info('Rascunho recuperado desta sessão.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = form.watch((values) => {
      saveDraft({ ...values, checklistItems });
    });
    return () => subscription.unsubscribe();
  }, [form, checklistItems]);

  const onSubmit = async (values: TaskFormValues) => {
    const isRecurring = values.recurrence_type !== 'none';

    const task = await createTask.mutateAsync({
      title: values.title,
      description: values.description || null,
      assignee_id: values.assignee_id || user?.id || null,
      task_type: values.task_type,
      priority: values.priority,
      due_date: new Date(values.due_date).toISOString(),
      scheduled_date: values.scheduled_date ? new Date(values.scheduled_date).toISOString() : null,
      location: values.location || null,
      tag_ids: values.tag_ids,
      recurrence_type: values.recurrence_type,
      recurrence_days: isRecurring ? (values.recurrence_days ?? []) : null,
      recurrence_time: isRecurring ? (values.recurrence_time || null) : null,
      recurrence_interval: isRecurring ? (values.recurrence_interval ?? 1) : 1,
      recurrence_end_date: isRecurring && values.recurrence_end_mode === 'date' ? (values.recurrence_end_date || null) : null,
      recurrence_end_after: isRecurring && values.recurrence_end_mode === 'after' ? (values.recurrence_end_after ?? null) : null,
      parent_task_id: null,
    });

    const hasExtras = pendingAttachments.length > 0 || checklistItems.length > 0;

    if (hasExtras) {
      setIsSavingExtras(true);

      if (pendingAttachments.length > 0 && user) {
        for (const file of pendingAttachments) {
          const result = await uploadFile(file, task.id);
          if (result) {
            const { error } = await supabase.from('task_attachments').insert({
              task_id: task.id,
              file_name: result.fileName,
              file_path: result.filePath,
              file_type: result.fileType,
              uploaded_by_id: user.id,
            });
            if (error) {
              console.error('Error saving attachment:', error);
              toast.error('Erro ao salvar anexo: ' + result.fileName);
            }
          }
        }
      }

      if (checklistItems.length > 0) {
        const { error } = await supabase.from('task_checklist_items').insert(
          checklistItems.map((text) => ({ task_id: task.id, text }))
        );
        if (error) {
          console.error('Error saving checklist items:', error);
          toast.error('Erro ao salvar itens do checklist');
        }
      }

      setIsSavingExtras(false);
    }

    // Gera instâncias imediatas para tarefas recorrentes
    if (isRecurring) {
      const baseDate = new Date(task.due_date);
      const endDate = values.recurrence_end_mode === 'date' && values.recurrence_end_date
        ? new Date(values.recurrence_end_date)
        : null;
      const endAfter = values.recurrence_end_mode === 'after'
        ? (values.recurrence_end_after ?? null)
        : null;

      const dates = computeInstanceDates(
        baseDate,
        values.recurrence_type as Exclude<RecurrenceType, 'none'>,
        values.recurrence_interval ?? 1,
        values.recurrence_days ?? [],
        endDate,
        endAfter,
      );

      if (dates.length > 0) {
        const instances = dates.map((d) => ({
          title: task.title,
          description: task.description,
          assignee_id: task.assignee_id,
          created_by_id: user!.id,
          task_type: task.task_type,
          priority: task.priority,
          location: task.location,
          due_date: applyRecurrenceTime(d, values.recurrence_time, baseDate).toISOString(),
          parent_task_id: task.id,
          recurrence_type: 'none' as const,
          recurrence_interval: 1,
        }));

        const { error } = await supabase.from('tasks').insert(instances);
        if (error) {
          toast.error('Erro ao criar instâncias recorrentes: ' + error.message);
        } else {
          toast.success(`${dates.length} instância(s) recorrente(s) criada(s)!`);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['tasks-infinite'] });
        }
      }
    }

    clearDraft();
    navigate('/');
  };

  const recurrenceIntervalLabel = recurrenceType === 'daily'
    ? 'dia(s)'
    : recurrenceType === 'weekly'
    ? 'semana(s)'
    : 'mês/meses';

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Nova Tarefa</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Verificar CTO do cliente X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o problema ou tarefa em detalhes..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assignee */}
                {(isAdmin || isGestorTecnico) && assignableProfiles.length > 0 && (
                  <FormField
                    control={form.control}
                    name="assignee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Task Type */}
                <FormField
                  control={form.control}
                  name="task_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">Pontual</SelectItem>
                          <SelectItem value="daily">Diária</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo Final *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scheduled Date */}
                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Prevista</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local / Identificação</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CTO 15, Rua das Flores" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags */}
              <FormField
                control={form.control}
                name="tag_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isSelected = field.value?.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value?.filter((id) => id !== tag.id)
                                : [...(field.value || []), tag.id];
                              field.onChange(newValue);
                            }}
                            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-all ${
                              isSelected
                                ? 'ring-2 ring-offset-1'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{
                              backgroundColor: isSelected ? `${tag.color}20` : 'transparent',
                              borderColor: tag.color,
                              color: tag.color,
                            }}
                          >
                            {/* Indicador puramente visual — nunca um Checkbox interativo real.
                                Ver comentário completo no histórico: Radix Checkbox dentro de
                                <button> dispara evento sintético com bubble que causa loop infinito. */}
                            <span
                              aria-hidden="true"
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                                isSelected ? '' : 'bg-transparent'
                              }`}
                              style={{
                                borderColor: tag.color,
                                backgroundColor: isSelected ? tag.color : 'transparent',
                              }}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </span>
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recorrência — seção colapsável */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRecurrence((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Recorrência
                    {recurrenceType !== 'none' && (
                      <span className="text-xs text-primary font-semibold">(ativa)</span>
                    )}
                  </span>
                  {showRecurrence ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {showRecurrence && (
                  <div className="px-4 pb-4 pt-3 space-y-4">
                    {/* Tipo de recorrência */}
                    <FormField
                      control={form.control}
                      name="recurrence_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repetir</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não repetir</SelectItem>
                              <SelectItem value="daily">Diariamente</SelectItem>
                              <SelectItem value="weekly">Semanalmente</SelectItem>
                              <SelectItem value="monthly">Mensalmente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {recurrenceType !== 'none' && (
                      <>
                        {/* Intervalo */}
                        <FormField
                          control={form.control}
                          name="recurrence_interval"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>A cada</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="w-20"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                  />
                                </FormControl>
                                <span className="text-sm text-muted-foreground">{recurrenceIntervalLabel}</span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Dias da semana (apenas weekly) */}
                        {recurrenceType === 'weekly' && (
                          <FormField
                            control={form.control}
                            name="recurrence_days"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dias da semana</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                  {DAYS_OF_WEEK.map((day) => {
                                    const selected = field.value?.includes(day.value);
                                    return (
                                      <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => {
                                          const next = selected
                                            ? field.value.filter((d) => d !== day.value)
                                            : [...field.value, day.value];
                                          field.onChange(next);
                                        }}
                                        className={cn(
                                          'w-10 h-10 rounded-full text-xs font-medium border transition-colors',
                                          selected
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                                        )}
                                      >
                                        {day.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Horário das instâncias */}
                        <FormField
                          control={form.control}
                          name="recurrence_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Horário das instâncias</FormLabel>
                              <FormControl>
                                <Input type="time" className="w-36" {...field} />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Deixe em branco para usar o mesmo horário do prazo acima.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Condição de término */}
                        <FormField
                          control={form.control}
                          name="recurrence_end_mode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Terminar</FormLabel>
                              <div className="space-y-2">
                                {[
                                  { value: 'never', label: 'Sem fim (gera 4 instâncias)' },
                                  { value: 'date', label: 'Até uma data' },
                                  { value: 'after', label: 'Após N ocorrências' },
                                ].map((opt) => (
                                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                      type="radio"
                                      name="recurrence_end_mode"
                                      value={opt.value}
                                      checked={field.value === opt.value}
                                      onChange={() => field.onChange(opt.value)}
                                      className="accent-primary"
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {recurrenceEndMode === 'date' && (
                          <FormField
                            control={form.control}
                            name="recurrence_end_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de término</FormLabel>
                                <FormControl>
                                  <Input type="date" className="w-44" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {recurrenceEndMode === 'after' && (
                          <FormField
                            control={form.control}
                            name="recurrence_end_after"
                            render={({ field }) => {
                              const n = Number(field.value) || 1;
                              const nowCount = Math.min(n, 4);
                              return (
                                <FormItem>
                                  <FormLabel>Número total de ocorrências</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={52}
                                      className="w-20"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">
                                    {n > 4
                                      ? `As primeiras 4 instâncias serão criadas agora. As demais (até ${n} no total) poderão ser geradas pelo botão "Gerar mais instâncias" no template.`
                                      : `${nowCount} instância(s) serão criadas imediatamente.`}
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div>
                <FormLabel className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4" />
                  Anexos
                </FormLabel>
                <div
                  {...getAttachmentRootProps()}
                  className={cn(
                    'flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                    isAttachmentDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <input {...getAttachmentInputProps()} />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isAttachmentDragActive ? 'Solte aqui...' : 'Arraste PDF, JPEG ou PNG, ou clique para selecionar'}
                  </span>
                </div>

                {pendingAttachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {pendingAttachments.map((file, index) => {
                      const Icon = getFileIcon(file.type);
                      return (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-3 p-2 rounded-lg border bg-card"
                        >
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="flex-1 min-w-0 text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePendingAttachment(index)}
                            className="h-8 w-8"
                            aria-label="Remover anexo"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div>
                <FormLabel className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-4 w-4" />
                  Checklist
                </FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Novo item..."
                    value={newChecklistItemText}
                    onChange={(e) => setNewChecklistItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItemLocal();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={addChecklistItemLocal}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {checklistItems.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {checklistItems.map((text, index) => (
                      <div
                        key={`${text}-${index}`}
                        className="flex items-center gap-3 p-2 rounded-lg border bg-card"
                      >
                        <span className="flex-1 min-w-0 text-sm truncate">{text}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChecklistItemLocal(index)}
                          className="h-8 w-8"
                          aria-label="Remover item"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTask.isPending || isSavingExtras}>
                  <Save className="h-4 w-4 mr-2" />
                  {createTask.isPending || isSavingExtras ? 'Salvando...' : 'Criar Tarefa'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTaskForm;
