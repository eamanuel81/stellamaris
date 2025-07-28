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
    console.log('Fetching profile for user:', userId, email);
    
    try {
      // 1. Primero intentar obtener el subrol desde employees (por email)
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('subrole')
        .eq('email', email)
        .single();
      
      console.log('Employee data:', employee, 'Employee error:', employeeError);
      
      if (!employeeError && employee) {
        console.log('Employee found, subrole:', employee.subrole);
        setSubrole(employee.subrole || 'empleado');
        
        // Si el subrole es 'admin', establecer el rol como admin
        if (employee.subrole === 'admin') {
          console.log('User is admin based on subrole');
          setRole('admin');
          return; // No necesitamos verificar profiles si ya sabemos que es admin
        }
      } else {
        console.log('No employee found, setting subrole to null');
        setSubrole(null);
      }
      
      // 2. Intentar obtener rol desde profiles (solo si no es admin por subrole)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      console.log('Profile data:', profile, 'Profile error:', profileError);
      
      if (profileError) {
        console.log('No profile found or policy error, checking if user is admin by email...');
        // Si no hay perfil, verificar si es un administrador por email
        if (email === 'admin@stellamaris.com' || email.includes('admin')) {
          console.log('User appears to be admin by email');
          setRole('admin');
        } else {
          console.log('No profile found and not admin email');
          setRole(null);
        }
      } else if (profile) {
        console.log('Profile found, role:', profile.role);
        setRole(profile.role === 'Administrador' ? 'admin' : 'employee');
      } else {
        console.log('No profile data returned');
        setRole(null);
      }
      
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setRole(null);
      setSubrole(null);
    }
  };

  // Efecto para mantener la sesión y el rol/subrol sincronizados
  useEffect(() => {
    const getSessionAndProfile = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      
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
    }
    setIsLoading(false);
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setSubrole(null);
    setAvatarKey('default');
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
