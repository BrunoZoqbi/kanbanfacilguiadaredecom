import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import UserManagement from '@/components/admin/UserManagement';
import ActivityLogs from '@/components/admin/ActivityLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Tags, Loader2, Plus, Trash2, Save, Activity, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { TaskTypeRecord } from '@/types/database';

const AdminPage: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { tasks, profiles, tags, isLoading } = useTasks();
  const queryClient = useQueryClient();
  
  // Bulk reassignment state
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [newAssignee, setNewAssignee] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  
  // Tag management state
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#A7E000');
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Task type management state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6366f1');
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [editingType, setEditingType] = useState<{ id: string; name: string; label: string; color: string } | null>(null);

  // Fetch task types
  const { data: taskTypes = [] } = useQuery({
    queryKey: ['task_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_types')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TaskTypeRecord[];
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((t) => t.id));
    }
  };

  const handleBulkReassign = async () => {
    if (!newAssignee || selectedTasks.length === 0) {
      toast.error('Selecione um responsável e ao menos uma tarefa');
      return;
    }

    setIsReassigning(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assignee_id: newAssignee })
        .in('id', selectedTasks);

      if (error) throw error;

      toast.success(`${selectedTasks.length} tarefa(s) reatribuída(s)!`);
      setSelectedTasks([]);
      setNewAssignee('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast.error('Erro ao reatribuir: ' + error.message);
    } finally {
      setIsReassigning(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    setIsCreatingTag(true);
    try {
      const { error } = await supabase
        .from('tags')
        .insert([{ name: newTagName.trim(), color: newTagColor }]);

      if (error) throw error;

      toast.success('Tag criada!');
      setNewTagName('');
      setNewTagColor('#A7E000');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    } catch (error: any) {
      toast.error('Erro ao criar tag: ' + error.message);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      const { error } = await supabase
        .from('tags')
        .update({ name: editingTag.name, color: editingTag.color })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast.success('Tag atualizada!');
      setEditingTag(null);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast.success('Tag excluída!');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  // Task type management functions
  const handleCreateTaskType = async () => {
    if (!newTypeName.trim() || !newTypeLabel.trim()) {
      toast.error('Nome e label são obrigatórios');
      return;
    }

    setIsCreatingType(true);
    try {
      const { error } = await supabase
        .from('task_types')
        .insert([{ name: newTypeName.trim(), label: newTypeLabel.trim(), color: newTypeColor }]);

      if (error) throw error;

      toast.success('Tipo de tarefa criado!');
      setNewTypeName('');
      setNewTypeLabel('');
      setNewTypeColor('#6366f1');
      queryClient.invalidateQueries({ queryKey: ['task_types'] });
    } catch (error: any) {
      toast.error('Erro ao criar tipo: ' + error.message);
    } finally {
      setIsCreatingType(false);
    }
  };

  const handleDeleteTaskType = async (typeId: string) => {
    try {
      const { error } = await supabase
        .from('task_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      toast.success('Tipo de tarefa excluído!');
      queryClient.invalidateQueries({ queryKey: ['task_types'] });
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleToggleTaskTypeActive = async (typeId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('task_types')
        .update({ is_active: !isActive })
        .eq('id', typeId);

      if (error) throw error;

      toast.success(isActive ? 'Tipo desativado!' : 'Tipo ativado!');
      queryClient.invalidateQueries({ queryKey: ['task_types'] });
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const handleUpdateTaskType = async () => {
    if (!editingType) return;

    try {
      const { error } = await supabase
        .from('task_types')
        .update({ name: editingType.name, label: editingType.label, color: editingType.color })
        .eq('id', editingType.id);

      if (error) throw error;

      toast.success('Tipo de tarefa atualizado!');
      setEditingType(null);
      queryClient.invalidateQueries({ queryKey: ['task_types'] });
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Gerenciamento
          </h1>
          <p className="text-muted-foreground">Ferramentas administrativas</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="reassign" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Reatribuir em Massa
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="task-types" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Tipos de Tarefa
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* User Management */}
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          {/* Bulk Reassignment */}
          <TabsContent value="reassign" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reatribuir Tarefas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTasks.length === tasks.length && tasks.length > 0}
                      onCheckedChange={selectAllTasks}
                    />
                    <span className="text-sm">
                      {selectedTasks.length} de {tasks.length} selecionada(s)
                    </span>
                  </div>

                  <Select value={newAssignee} onValueChange={setNewAssignee}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Novo responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleBulkReassign}
                    disabled={isReassigning || selectedTasks.length === 0 || !newAssignee}
                  >
                    {isReassigning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Reatribuir
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="w-full border rounded-lg divide-y max-h-96 overflow-y-auto overflow-x-hidden">
                    {tasks.map((task) => {
                      const assignee = profiles.find((p) => p.id === task.assignee_id);
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={() => toggleTaskSelection(task.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Responsável: {assignee?.full_name || 'Não atribuído'}
                            </p>
                          </div>
                          <Badge
                            variant={task.status === 'done' ? 'default' : 'secondary'}
                          >
                            {task.status === 'todo' && 'A Fazer'}
                            {task.status === 'doing' && 'Fazendo'}
                            {task.status === 'done' && 'Feito'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tag Management */}
          <TabsContent value="tags" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gerenciar Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create new tag */}
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nova tag..."
                      className="w-48"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="h-10 w-12 rounded border cursor-pointer"
                      />
                      <Input
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateTag} disabled={isCreatingTag}>
                    {isCreatingTag ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Tag
                  </Button>
                </div>

                {/* Existing tags */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tags existentes</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card"
                      >
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-medium">{tag.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setEditingTag({ id: tag.id, name: tag.name, color: tag.color })
                          }
                          aria-label="Editar"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTag(tag.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Types Management */}
          <TabsContent value="task-types" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gerenciar Tipos de Tarefa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create new task type */}
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome (identificador)</label>
                    <Input
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="weekly"
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Label (exibição)</label>
                    <Input
                      value={newTypeLabel}
                      onChange={(e) => setNewTypeLabel(e.target.value)}
                      placeholder="Semanal"
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="h-10 w-12 rounded border cursor-pointer"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateTaskType} disabled={isCreatingType}>
                    {isCreatingType ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Tipo
                  </Button>
                </div>

                {/* Existing task types */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tipos existentes</h4>
                  <div className="border rounded-lg divide-y">
                    {taskTypes.map((type) => (
                      <div
                        key={type.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="h-4 w-4 rounded-full shrink-0"
                            style={{ backgroundColor: type.color }}
                          />
                          <div className="min-w-0">
                            <span className="font-medium truncate block">{type.label}</span>
                            <span className="text-xs text-muted-foreground">({type.name})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={type.is_active ? 'default' : 'secondary'}>
                            {type.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTaskTypeActive(type.id, type.is_active)}
                          >
                            {type.is_active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingType({ id: type.id, name: type.name, label: type.label, color: type.color })}
                            aria-label="Editar"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTaskType(type.id)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs */}
          <TabsContent value="logs" className="mt-6">
            <ActivityLogs />
          </TabsContent>
        </Tabs>

        {/* Edit Tag Dialog */}
        <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tag</DialogTitle>
            </DialogHeader>
            {editingTag && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={editingTag.name}
                    onChange={(e) =>
                      setEditingTag({ ...editingTag, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTag.color}
                      onChange={(e) =>
                        setEditingTag({ ...editingTag, color: e.target.value })
                      }
                      className="h-10 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={editingTag.color}
                      onChange={(e) =>
                        setEditingTag({ ...editingTag, color: e.target.value })
                      }
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTag(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTag}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit Task Type Dialog */}
        <Dialog open={!!editingType} onOpenChange={() => setEditingType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tipo de Tarefa</DialogTitle>
            </DialogHeader>
            {editingType && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome (identificador)</label>
                  <Input
                    value={editingType.name}
                    onChange={(e) =>
                      setEditingType({ ...editingType, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Label (exibição)</label>
                  <Input
                    value={editingType.label}
                    onChange={(e) =>
                      setEditingType({ ...editingType, label: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingType.color}
                      onChange={(e) =>
                        setEditingType({ ...editingType, color: e.target.value })
                      }
                      className="h-10 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={editingType.color}
                      onChange={(e) =>
                        setEditingType({ ...editingType, color: e.target.value })
                      }
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingType(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTaskType}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
