"use client"
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Role = 'admin' | 'employee' | null;

type AuthContextType = {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      if (storedRole) {
        setRole(storedRole);
      }
    } catch (e) {
      console.error("Could not access local storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newRole: Role) => {
    setRole(newRole);
    try {
      if (newRole) {
        localStorage.setItem('userRole', newRole);
      } else {
        localStorage.removeItem('userRole');
      }
    } catch(e) {
      console.error("Could not access local storage", e);
    }
  };

  const logout = () => {
    setRole(null);
     try {
      localStorage.removeItem('userRole');
    } catch(e) {
      console.error("Could not access local storage", e);
    }
  };

  return (
    <AuthContext.Provider value={{ role, login, logout, isLoading }}>
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
