import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLog } from '@/hooks/useActivityLog';
import CreateUserForm from './CreateUserForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Loader2,
  Shield,
  ShieldOff,
  User,
  Phone,
  Search,
  Wrench,
  Briefcase,
  Pencil,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppRole } from '@/types/database';

interface UserWithRole {
  id: string;
  full_name: string;
  is_active: boolean;
  phone_whatsapp: string | null;
  created_at: string;
  role: AppRole;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  gestor_tecnico: 'Gestor Técnico',
  gestor_comercial: 'Gestor Comercial',
  user: 'Usuário',
};

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState(false);

  // Reset password state (within the Edit dialog)
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      return profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'user',
        } as UserWithRole;
      });
    },
  });

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const setUserUpdating = (userId: string, isUpdating: boolean) => {
    setUpdatingUsers((prev) => {
      const next = new Set(prev);
      if (isUpdating) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const toggleUserActive = async (user: UserWithRole) => {
    setUserUpdating(user.id, true);
    try {
      const newStatus = !user.is_active;
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      await logActivity({
        action: newStatus ? 'user_activate' : 'user_deactivate',
        entityType: 'user',
        entityId: user.id,
        details: { user_name: user.full_name },
      });

      toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setUserUpdating(user.id, false);
    }
  };

  // Admin, Gestor Técnico and Gestor Comercial are mutually exclusive, and
  // user_roles only enforces UNIQUE(user_id, role) — not one row per user —
  // so any existing role rows are cleared before inserting the new one (or
  // left cleared to fall back to plain 'user').
  const setUserRole = async (
    user: UserWithRole,
    targetRole: 'admin' | 'gestor_tecnico' | 'gestor_comercial'
  ) => {
    setUserUpdating(user.id, true);
    try {
      const newRole: AppRole = user.role === targetRole ? 'user' : targetRole;

      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;

      if (newRole !== 'user') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: newRole });
        if (insertError) throw insertError;
      }

      await logActivity({
        action: 'role_change',
        entityType: 'user',
        entityId: user.id,
        details: {
          user_name: user.full_name,
          old_role: user.role,
          new_role: newRole,
        },
      });

      toast.success(`Função alterada para ${roleLabels[newRole]}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setUserUpdating(user.id, false);
    }
  };

  const updatePhoneWhatsapp = async (userId: string, phone: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_whatsapp: phone || null })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Telefone atualizado!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    }
  };

  const openEditDialog = async (user: UserWithRole) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditPhone(user.phone_whatsapp || '');
    setEditEmail('');
    setOriginalEmail('');
    setShowResetPassword(false);
    setNewPassword('');

    setIsLoadingEmail(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_user_email', {
        p_user_id: user.id,
      });
      if (error) throw error;
      setEditEmail(data || '');
      setOriginalEmail(data || '');
    } catch (error: any) {
      toast.error('Erro ao carregar e-mail: ' + error.message);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setEditFullName('');
    setEditPhone('');
    setEditEmail('');
    setOriginalEmail('');
    setShowResetPassword(false);
    setNewPassword('');
  };

  const performSaveEdit = async () => {
    if (!editingUser || !editFullName.trim()) return;

    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          phone_whatsapp: editPhone.trim() || null,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      const emailChanged = editEmail.trim() !== originalEmail;
      if (emailChanged) {
        const { data, error: invokeError } = await supabase.functions.invoke('update-user-email', {
          body: { user_id: editingUser.id, new_email: editEmail.trim() },
        });
        if (invokeError) throw new Error(invokeError.message || 'Erro ao atualizar e-mail');
        if (!data?.success) throw new Error(data?.error || 'Erro ao atualizar e-mail');
      }

      await logActivity({
        action: 'update',
        entityType: 'user',
        entityId: editingUser.id,
        details: { user_name: editFullName.trim(), ...(emailChanged ? { email_changed: true } : {}) },
      });

      toast.success('Usuário atualizado!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeEditDialog();
    } catch (error: any) {
      toast.error('Erro ao atualizar usuário: ' + error.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Se o e-mail foi alterado, pede confirmação explícita antes de salvar —
  // essa troca é o login do usuário, não só um dado de cadastro.
  const handleSaveEdit = () => {
    if (!editingUser || !editFullName.trim()) return;

    const emailChanged = editEmail.trim() !== originalEmail;
    if (emailChanged) {
      setPendingEmailChange(true);
    } else {
      performSaveEdit();
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser || newPassword.length < 6) return;

    setIsResettingPassword(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('reset-user-password', {
        body: { user_id: editingUser.id, new_password: newPassword },
      });

      if (invokeError) throw new Error(invokeError.message || 'Erro ao redefinir senha');
      if (!data?.success) throw new Error(data?.error || 'Erro ao redefinir senha');

      await logActivity({
        action: 'update',
        entityType: 'user',
        entityId: editingUser.id,
        details: { user_name: editingUser.full_name, password_reset: true },
      });

      toast.success('Senha redefinida com sucesso!');
      setShowResetPassword(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error('Erro ao redefinir senha: ' + error.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteUser = async (user: UserWithRole) => {
    setUserUpdating(user.id, true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Erro ao excluir usuário');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao excluir usuário');
      }

      await logActivity({
        action: 'delete',
        entityType: 'user',
        entityId: user.id,
        details: { user_name: user.full_name },
      });

      toast.success(`Usuário "${user.full_name}" excluído!`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error('Erro ao excluir usuário: ' + error.message);
    } finally {
      setUserUpdating(user.id, false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create User Form */}
      <CreateUserForm />

      <Separator />

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" />
            Usuários Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users list */}
        <div className="w-full border rounded-lg divide-y max-h-[500px] overflow-y-auto overflow-x-hidden">
          {filteredUsers.map((user) => {
            const isUpdating = updatingUsers.has(user.id);
            return (
              <div
                key={user.id}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0 sm:flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate max-w-full">{user.full_name}</p>
                      <Badge variant={user.role === 'user' ? 'secondary' : 'default'}>
                        {roleLabels[user.role]}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        placeholder="WhatsApp (ex: 5511999999999)"
                        defaultValue={user.phone_whatsapp || ''}
                        className="h-8 w-full max-w-[220px] sm:w-48 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== (user.phone_whatsapp || '')) {
                            updatePhoneWhatsapp(user.id, e.target.value);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 w-full min-w-0 sm:flex sm:flex-wrap sm:w-auto sm:items-center sm:gap-4">
                    {/* Active toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Ativo</span>
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserActive(user)}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Admin toggle */}
                    <Button
                      variant={user.role === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setUserRole(user, 'admin')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.role === 'admin' ? (
                        <>
                          <Shield className="h-4 w-4 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <ShieldOff className="h-4 w-4 mr-1" />
                          Tornar Admin
                        </>
                      )}
                    </Button>

                    {/* Gestor Técnico toggle */}
                    <Button
                      variant={user.role === 'gestor_tecnico' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setUserRole(user, 'gestor_tecnico')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Wrench className="h-4 w-4 mr-1" />
                          {user.role === 'gestor_tecnico' ? 'Gestor Técnico' : 'Tornar Gestor Técnico'}
                        </>
                      )}
                    </Button>

                    {/* Gestor Comercial toggle */}
                    <Button
                      variant={user.role === 'gestor_comercial' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setUserRole(user, 'gestor_comercial')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Briefcase className="h-4 w-4 mr-1" />
                          {user.role === 'gestor_comercial' ? 'Gestor Comercial' : 'Tornar Gestor Comercial'}
                        </>
                      )}
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => openEditDialog(user)}
                      disabled={isUpdating}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-destructive hover:text-destructive"
                          disabled={isUpdating || user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{user.full_name}"? Essa ação não pode
                            ser desfeita. Se o usuário tiver tarefas ou movimentações vinculadas,
                            a exclusão pode falhar — nesse caso, use "Desativar" em vez disso.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: 'destructive' })}
                            onClick={() => handleDeleteUser(user)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Nome Completo *</Label>
                <Input
                  id="edit-fullName"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">WhatsApp</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="5511999999999"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={isLoadingEmail}
                />
                <p className="text-xs text-muted-foreground">
                  Este é o e-mail de login do usuário. Alterá-lo pede confirmação ao salvar.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                {!showResetPassword ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetPassword(true)}
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Redefinir Senha
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-new-password">Nova senha</Label>
                    <Input
                      id="edit-new-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleResetPassword}
                        disabled={newPassword.length < 6 || isResettingPassword}
                      >
                        {isResettingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirmar Nova Senha
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowResetPassword(false);
                          setNewPassword('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editFullName.trim() || isSavingEdit || isLoadingEmail}
            >
              {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação específica para troca de e-mail de login */}
      <AlertDialog open={pendingEmailChange} onOpenChange={setPendingEmailChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar e-mail de login</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso muda o e-mail de login deste usuário — ele vai precisar usar o
              novo e-mail para entrar no sistema a partir de agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPendingEmailChange(false);
                performSaveEdit();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
