import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCacheCleaner() {
  useEffect(() => {
    const handleAuthStateChange = (event: string, session: any) => {
      console.log('Auth state changed, clearing cache:', event);
      
      // Limpiar localStorage si el usuario cerró sesión
      if (event === 'SIGNED_OUT') {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Cache cleared on sign out');
      }
      
      // Forzar recarga de datos si el usuario inició sesión
      if (event === 'SIGNED_IN') {
        console.log('User signed in, cache should be fresh');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, []);
} 