import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLog } from '@/hooks/useActivityLog';
import CreateUserForm from './CreateUserForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Shield, ShieldOff, User, Phone, Search, Wrench, Briefcase } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

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
        <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
          {filteredUsers.map((user) => {
            const isUpdating = updatingUsers.has(user.id);
            return (
              <div
                key={user.id}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{user.full_name}</p>
                      <Badge variant={user.role === 'user' ? 'secondary' : 'default'}>
                        {roleLabels[user.role]}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="WhatsApp (ex: 5511999999999)"
                        defaultValue={user.phone_whatsapp || ''}
                        className="h-8 w-48 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== (user.phone_whatsapp || '')) {
                            updatePhoneWhatsapp(user.id, e.target.value);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
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
    </div>
  );
};

export default UserManagement;
