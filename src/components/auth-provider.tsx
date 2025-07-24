"use client"
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Employee } from '@/lib/data';

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

  // Obtiene el perfil del usuario autenticado
  const fetchProfile = async (userId: string, email: string) => {
    // 1. Obtener rol desde profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (profileError || !profile) {
      setRole(null);
    } else {
      setRole(profile.role === 'Administrador' ? 'admin' : 'employee');
    }
    // 2. Obtener subrol desde employees (por email)
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('subrole')
      .eq('email', email)
      .single();
    if (employeeError || !employee) {
      setSubrole(null);
    } else {
      setSubrole(employee.subrole || 'empleado');
    }
  };

  // Efecto para mantener la sesión y el rol/subrol sincronizados
  useEffect(() => {
    const getSessionAndProfile = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
        setAvatarKey(session.user.id); // Usa el id como avatarKey por defecto
      } else {
        setRole(null);
        setSubrole(null);
        setAvatarKey('default');
      }
      setIsLoading(false);
    };
    getSessionAndProfile();
    // Suscribirse a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getSessionAndProfile();
    });
    return () => {
      listener?.subscription.unsubscribe();
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
      await fetchProfile(data.user.id, data.user.email!);
      setAvatarKey(data.user.id);
    }
    setIsLoading(false);
  };

  // Logout usando Supabase Auth
  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setRole(null);
    setSubrole(null);
    setAvatarKey('default');
    setIsLoading(false);
  };

  const handleSetAvatarKey = (key: string) => {
    setAvatarKey(key);
    // Aquí podrías guardar el avatarKey en el perfil si lo deseas
  };

  return (
    <AuthContext.Provider value={{ role, subrole, login, logout, isLoading, avatarKey, setAvatarKey: handleSetAvatarKey }}>
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
