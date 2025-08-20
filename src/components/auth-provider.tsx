"use client"
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Employee } from '@/lib/data';
import { useAuthState } from '@/hooks/use-auth-state';

export type Role = 'admin' | 'employee' | null;
export type Subrole = 'empleado' | 'encargado' | 'admin' | null;

type AuthContextType = {
  role: Role;
  subrole: Subrole;
  login: (email: string, password: string) => Promise<{ error?: string } | void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  avatarKey: string;
  setAvatarKey: (key: string) => void;
  clearCorruptedSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [subrole, setSubrole] = useState<Subrole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarKey, setAvatarKey] = useState<string>('default');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const { addAuthListener } = useAuthState();

  // Función para limpiar sesión corrupta
  const clearCorruptedSession = async () => {
    try {
      console.log('🧹 Limpiando sesión corrupta...');
      
      // Limpiar almacenamiento local
      if (typeof window !== 'undefined') {
        localStorage.removeItem('stellamaris-auth');
        sessionStorage.removeItem('stellamaris-auth');
      }
      
      // Cerrar sesión en Supabase
      await supabase.auth.signOut();
      
      // Limpiar estado local
      clearAuthState();
      
      console.log('✅ Sesión corrupta limpiada correctamente');
    } catch (error) {
      console.error('❌ Error limpiando sesión corrupta:', error);
    }
  };

  // Obtiene el perfil del usuario autenticado
  const fetchProfile = async (userId: string, email: string) => {
    try {
      // 1. Primero intentar obtener el subrol desde employees (por email)
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('subrole')
        .eq('email', email)
        .single();
      
      if (!employeeError && employee) {
        const subrole = employee.subrole && typeof employee.subrole === 'string' ? employee.subrole as Subrole : 'empleado';
        setSubrole(subrole);
        
        // Si el subrole es 'admin', establecer el rol como admin
        if (subrole === 'admin') {
          setRole('admin');
        }
      } else {
        setSubrole(null);
      }
      
      // 2. Intentar obtener rol y avatar desde profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, avatar_url')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        // Si no hay perfil, verificar si es un administrador por email
        if (email === 'admin@stellamaris.com' || email.includes('admin')) {
          setRole('admin');
        } else {
          setRole(null);
        }
        // Usar el ID del usuario como avatar key por defecto
        setAvatarKey(userId);
      } else if (profile) {
        setRole(profile.role === 'Administrador' ? 'admin' : 'employee');
        
        // Usar el avatar_url del perfil si existe, sino usar el ID del usuario
        const avatarUrl = profile.avatar_url && typeof profile.avatar_url === 'string' ? profile.avatar_url : userId;
        setAvatarKey(avatarUrl);
      } else {
        setRole(null);
        setAvatarKey(userId);
      }
      
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setRole(null);
      setSubrole(null);
      setAvatarKey(userId);
    }
  };

  // Limpiar estado cuando el usuario cambia
  const clearAuthState = () => {
    setRole(null);
    setSubrole(null);
    setAvatarKey('default');
    setCurrentUserId(null);
  };

  // Efecto para mantener la sesión y el rol/subrol sincronizados
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const getSessionAndProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión:', error);
          if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
            console.log('🔄 Token de actualización inválido, limpiando sesión...');
            await clearCorruptedSession();
          }
          clearAuthState();
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          // Verificar si el usuario cambió
          if (currentUserId && currentUserId !== session.user.id) {
            clearAuthState();
          }
          
          setCurrentUserId(session.user.id);
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          clearAuthState();
        }
      } catch (error) {
        console.error('❌ Error inesperado en getSessionAndProfile:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };
    
    getSessionAndProfile();
    
    // Usar el listener centralizado en lugar de crear una nueva suscripción
    const removeListener = addAuthListener(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          // Usuario inició sesión
          setCurrentUserId(session.user.id);
          await fetchProfile(session.user.id, session.user.email!);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          // Usuario cerró sesión
          clearAuthState();
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refrescado, verificar si el usuario cambió
          if (currentUserId !== session.user.id) {
            clearAuthState();
            setCurrentUserId(session.user.id);
            await fetchProfile(session.user.id, session.user.email!);
          }
        } else if (event === 'TOKEN_REFRESH_FAILED') {
          // Token de actualización falló
          console.log('🔄 Fallo en la actualización del token, limpiando sesión...');
          await clearCorruptedSession();
        }
      } catch (error) {
        console.error('❌ Error en auth listener:', error);
      }
    });
    
    return () => {
      removeListener();
    };
  }, []);

  // Login usando Supabase Auth
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }
      if (data.user) {
        setCurrentUserId(data.user.id);
        await fetchProfile(data.user.id, data.user.email!);
      }
    } catch (error) {
      console.error('❌ Error inesperado en login:', error);
      return { error: 'Error inesperado durante el inicio de sesión' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      clearAuthState();
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Forzar limpieza del estado incluso si falla el logout
      clearAuthState();
    }
  };

  return (
    <AuthContext.Provider value={{ role, subrole, login, logout, isLoading, avatarKey, setAvatarKey, clearCorruptedSession }}>
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
