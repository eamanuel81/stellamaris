import { useEffect } from 'react';
import { useAuthState } from './use-auth-state';

export function useCacheCleaner() {
  const { addAuthListener } = useAuthState();

  useEffect(() => {
    const handleAuthStateChange = (event: string, session: any) => {
      // Limpiar localStorage si el usuario cerró sesión
      if (event === 'SIGNED_OUT') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Forzar recarga de datos si el usuario inició sesión
      if (event === 'SIGNED_IN') {
        // El cache se mantendrá fresco al iniciar sesión
      }
    };

    const removeListener = addAuthListener(handleAuthStateChange);

    return () => {
      removeListener();
    };
  }, []);
} 