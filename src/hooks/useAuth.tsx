import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { buildSignupMeta, ensureProfileFromSignup } from '@/lib/signupProfile';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, city: string, role: AppRole, cnpj?: string, telefone?: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch role - get highest priority if multiple exist
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error fetching role:', roleError);
      } else if (roleData && roleData.length > 0) {
        // Priority: ADMIN > COMPANY > AFFILIATE > CLIENT
        const rolePriority: Record<string, number> = {
          'ADMIN': 4,
          'COMPANY': 3,
          'AFFILIATE': 2,
          'CLIENT': 1
        };
        
        const sortedRoles = roleData.sort((a, b) => 
          (rolePriority[b.role] || 0) - (rolePriority[a.role] || 0)
        );
        
        setRole(sortedRoles[0].role as AppRole);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State change:', event);
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('[Auth] Token refresh failed, clearing session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRole(null);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Handle invalid refresh token error
      if (error) {
        console.error('[Auth] Session error:', error);
        // Clear any corrupted session data
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, city: string, userRole: AppRole, cnpj?: string, telefone?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          // Os dados do cadastro vão junto com a conta; o perfil é criado no primeiro login (ver ensureProfileFromSignup)
          data: buildSignupMeta({
            clilin_role: userRole === 'COMPANY' ? 'COMPANY' : 'AFFILIATE',
            clilin_name: name,
            clilin_city: city,
            clilin_cnpj: cnpj,
            clilin_telefone: telefone,
          }),
        },
      });

      if (error) {
        return { error, needsConfirmation: false };
      }

      // Com confirmação de e-mail ligada não há sessão ainda: o perfil nasce depois, no primeiro login
      if (!data.session || !data.user) {
        return { error: null, needsConfirmation: true };
      }

      const ok = await ensureProfileFromSignup(data.user);
      if (!ok) {
        return { error: new Error('Não foi possível concluir o cadastro. Tente entrar com seu e-mail e senha.'), needsConfirmation: false };
      }
      return { error: null, needsConfirmation: false };
    } catch (error) {
      return { error: error as Error, needsConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    // Se o usuário estiver acessando pelo domínio da Lovable,
    // força o callback a usar o domínio personalizado em produção
    const baseUrl = window.location.hostname.includes('lovableproject.com')
      ? 'https://clilin.com'
      : window.location.origin;
    const redirectUrl = `${baseUrl}/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Limpa estado local primeiro para garantir logout mesmo com erros
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);

    // Garante que o storage local seja limpo mesmo se a sessão no servidor já expirou
    // (isso evita “voltar logado” ao recarregar a página)
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // ignore
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}