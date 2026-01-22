import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
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
import { ArrowLeft, Save } from 'lucide-react';

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
    await createTask.mutateAsync({
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
                {/* Assignee */}
                {isAdmin && profiles.length > 0 && (
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
                            {profiles.map((profile) => (
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

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTask.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {createTask.isPending ? 'Salvando...' : 'Criar Tarefa'}
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
