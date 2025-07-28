"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AvatarContextType {
  avatarKey: string;
  updateAvatar: (newAvatarKey: string) => Promise<boolean>;
  isLoading: boolean;
  refreshAvatar: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarKey, setAvatarKey] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Cargar avatar del usuario actual
  const loadAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAvatarKey('default');
        setCurrentUserId(null);
        setIsLoading(false);
        return;
      }

      // Si el usuario cambió, limpiar el avatar anterior
      if (currentUserId && currentUserId !== user.id) {
        setAvatarKey('default');
      }

      setCurrentUserId(user.id);

      // Obtener avatar desde profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        setAvatarKey(profile.avatar_url);
      } else {
        setAvatarKey(user.id);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
      setAvatarKey('default');
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar avatar
  const updateAvatar = async (newAvatarKey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarKey })
        .eq('id', user.id);

      if (error) throw error;

      // Actualizar estado local inmediatamente
      setAvatarKey(newAvatarKey);
      return true;
    } catch (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
  };

  // Cargar avatar al montar el provider y escuchar cambios de autenticación
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    loadAvatar();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Usuario inició sesión, cargar su avatar
        setCurrentUserId(session.user.id);
        loadAvatar();
      } else if (event === 'SIGNED_OUT') {
        // Usuario cerró sesión, limpiar avatar
        setAvatarKey('default');
        setCurrentUserId(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refrescado, verificar si el usuario cambió
        if (currentUserId !== session.user.id) {
          setCurrentUserId(session.user.id);
          loadAvatar();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AvatarContext.Provider value={{
      avatarKey,
      updateAvatar,
      isLoading,
      refreshAvatar: loadAvatar
    }}>
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