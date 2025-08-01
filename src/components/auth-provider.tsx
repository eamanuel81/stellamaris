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
      const { data: { session } } = await supabase.auth.getSession();
      
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
      setIsLoading(false);
    };
    
    getSessionAndProfile();
    
    // Usar el listener centralizado en lugar de crear una nueva suscripción
    const removeListener = addAuthListener(async (event, session) => {
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
      }
    });
    
    return () => {
      removeListener();
    };
  }, []);

  // Login usando Supabase Auth
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }
    if (data.user) {
      setCurrentUserId(data.user.id);
      await fetchProfile(data.user.id, data.user.email!);
    }
    setIsLoading(false);
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    clearAuthState();
  };

  return (
    <AuthContext.Provider value={{ role, subrole, login, logout, isLoading, avatarKey, setAvatarKey }}>
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
