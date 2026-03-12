"use client"
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';

export type Role = 'admin' | 'employee' | null;
export type Subrole = 'empleado' | 'encargado' | 'admin' | null;

type AuthContextType = {
  role: Role;
  subrole: Subrole;
  login: (email: string, password: string) => Promise<{ error?: string; subrole?: string } | void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  avatarKey: string;
  setAvatarKey: (key: string) => void;
  clearCorruptedSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [avatarKey, setAvatarKey] = useState<string>('default');

  const isLoading = status === 'loading';
  const subroleRaw = (session?.user as any)?.subrole as string | undefined;
  const subrole: Subrole = (subroleRaw as Subrole) ?? null;
  const role: Role = subrole === 'admin' ? 'admin' : (status === 'authenticated' ? 'employee' : null);

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      return { error: 'Credenciales incorrectas' };
    }
    const newSession = await getSession();
    const subrole = (newSession?.user as any)?.subrole as string | undefined;
    return { subrole };
  };

  const logout = async () => {
    await signOut({ redirect: true, redirectTo: '/' });
  };

  const clearCorruptedSession = async () => {
    await signOut({ redirect: false });
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
