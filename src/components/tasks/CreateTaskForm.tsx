import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
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
import { Checkbox } from '@/components/ui/checkbox';
import { getFileIcon } from './FileUploadZone';
import { ArrowLeft, Save, Upload, X, Paperclip, ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
});

type TaskFormValues = z.infer<typeof taskSchema>;

const CreateTaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { profiles, tags, createTask, isLoading } = useTasks();
  const { user, isAdmin } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const { uploadFile } = useFileUpload();
  const queryClient = useQueryClient();
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isSavingExtras, setIsSavingExtras] = useState(false);

  // Gestor técnico sees every profile except admins (checked via the
  // has_role RPC, since user_roles RLS only lets a non-admin read their own
  // role row). Admins keep the full, unfiltered list.
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
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const [checklistItems, setChecklistItems] = useState<string[]>([]);
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
      title: '',
      description: '',
      assignee_id: user?.id || '',
      task_type: 'one_time',
      priority: 'medium',
      due_date: '',
      scheduled_date: '',
      location: '',
      tag_ids: [],
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }

    navigate('/');
  };

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
                {/* Assignee — locked to self for regular users; admins see
                    everyone, gestor técnico sees everyone except admins */}
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
                            <Checkbox checked={isSelected} className="pointer-events-none" />
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
