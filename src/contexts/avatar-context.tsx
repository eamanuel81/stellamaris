"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface AvatarContextType {
  avatarKey: string;
  updateAvatar: (newAvatarKey: string) => Promise<boolean>;
  isLoading: boolean;
  refreshAvatar: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [avatarKey, setAvatarKey] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  const loadAvatar = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const url = data.employee?.avatarUrl;
        setAvatarKey(url ?? (session?.user?.id ?? 'default'));
      } else {
        setAvatarKey(session?.user?.id ?? 'default');
      }
    } catch {
      setAvatarKey('default');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadAvatar();
    } else if (status === 'unauthenticated') {
      setAvatarKey('default');
      setIsLoading(false);
    }
  }, [status]);

  const updateAvatar = async (newAvatarKey: string) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: newAvatarKey }),
      });
      if (!res.ok) return false;
      setAvatarKey(newAvatarKey);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AvatarContext.Provider value={{ avatarKey, updateAvatar, isLoading, refreshAvatar: loadAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
}
