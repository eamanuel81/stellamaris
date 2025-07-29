import { useEffect } from 'react';
import { useAuthState } from './use-auth-state';

export function useCacheCleaner() {
  const { addAuthListener } = useAuthState();

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

    const removeListener = addAuthListener(handleAuthStateChange);

    return () => {
      removeListener();
    };
  }, []);
} 