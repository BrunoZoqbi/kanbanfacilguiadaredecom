import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types/database';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Busca o papel em user_roles com um retry de 1s em caso de erro na query
  // (rede instável, etc). Sem isso, um erro transiente era engolido
  // silenciosamente e o usuário ficava com role 'user' (perda de
  // permissão) até o próximo fetch — indistinguível de uma rebaixamento
  // real.
  const fetchRole = async (userId: string, isRetry = false): Promise<AppRole> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching role:', error);
      if (!isRetry) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchRole(userId, true);
      }
    }

    return data?.role || 'user';
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // A deactivated account (profiles.is_active = false) must not be
      // allowed to keep using an already-established Supabase Auth
      // session — sign it out immediately instead of letting it proceed.
      // The matching RLS check (is_user_active()) covers writes even if
      // this client-side check is bypassed or hasn't run yet.
      if (profileData && profileData.is_active === false) {
        toast.error('Sua conta foi desativada. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        return;
      }

      setProfile(profileData);
      setRole(await fetchRole(userId));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // setTimeout(0) evita o deadlock documentado do supabase-js ao
          // chamar o client de dentro do próprio callback de auth state.
          // isLoading só desce depois que fetchUserData resolve — do
          // contrário, telas que fazem `if (isLoading) ... else if
          // (!isAdmin) redirect` avaliam o papel ainda em 'null'/inicial
          // e podem redirecionar incorretamente antes do papel real chegar.
          setTimeout(() => {
            fetchUserData(session.user.id).finally(() => setIsLoading(false));
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mantém o papel do usuário logado em sincronia com user_roles em tempo
  // real: sem isso, uma promoção/rebaixamento feita por um admin em
  // Gerenciar > Usuários só refletia no cliente após logout/login, porque
  // fetchUserData só roda no login (ver lição em CLAUDE.md).
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-roles-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRole(user.id).then(setRole);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAdmin: role === 'admin',
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
