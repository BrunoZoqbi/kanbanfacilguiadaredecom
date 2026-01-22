import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(72),
  phone: z.string().optional(),
  isAdmin: z.boolean(),
});

const CreateUserForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setIsAdmin(false);
    setError(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    try {
      createUserSchema.parse({
        fullName,
        email,
        password,
        phone: phone || undefined,
        isAdmin,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsCreating(true);

    try {
      // Use Supabase Auth to create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update phone if provided
      if (phone) {
        await supabase
          .from('profiles')
          .update({ phone_whatsapp: phone })
          .eq('id', authData.user.id);
      }

      // Set admin role if needed
      if (isAdmin) {
        // Check if role already exists
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();

        if (existingRole) {
          await supabase
            .from('user_roles')
            .update({ role: 'admin' })
            .eq('user_id', authData.user.id);
        } else {
          await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role: 'admin' });
        }
      }

      await logActivity({
        action: 'create',
        entityType: 'user',
        entityId: authData.user.id,
        details: {
          user_name: fullName,
          email: email,
          is_admin: isAdmin,
        },
      });

      toast.success(`Usuário "${fullName}" criado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError(error.message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Cadastrar Novo Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nome do usuário"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="5511999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Switch
                id="isAdmin"
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">
                Cadastrar como Administrador
              </Label>
            </div>

            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Usuário
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateUserForm;
