"use client"
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Role = 'admin' | 'employee' | null;

type AuthContextType = {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
  isLoading: boolean;
  avatarKey: string;
  setAvatarKey: (key: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarKey, setAvatarKey] = useState<string>('default');

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      if (storedRole) {
        setRole(storedRole);
        const storedAvatarKey = localStorage.getItem('avatarKey') || storedRole;
        setAvatarKey(storedAvatarKey);
      }
    } catch (e) {
      console.error("Could not access local storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newRole: Role) => {
    setRole(newRole);
    const newAvatarKey = newRole || 'default';
    setAvatarKey(newAvatarKey);
    try {
      if (newRole) {
        localStorage.setItem('userRole', newRole);
        localStorage.setItem('avatarKey', newAvatarKey);
      } else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('avatarKey');
      }
    } catch(e) {
      console.error("Could not access local storage", e);
    }
  };

  const logout = () => {
    setRole(null);
    setAvatarKey('default');
     try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('avatarKey');
    } catch(e) {
      console.error("Could not access local storage", e);
    }
  };

  const handleSetAvatarKey = (key: string) => {
      setAvatarKey(key);
      try {
          localStorage.setItem('avatarKey', key);
      } catch (e) {
          console.error("Could not access local storage", e);
      }
  }

  return (
    <AuthContext.Provider value={{ role, login, logout, isLoading, avatarKey, setAvatarKey: handleSetAvatarKey }}>
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
