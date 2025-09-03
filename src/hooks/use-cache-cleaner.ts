import { useEffect } from 'react';
import { useAuthState } from './use-auth-state';

export function useCacheCleaner() {
  const { addAuthListener } = useAuthState();

  useEffect(() => {
    const handleAuthStateChange = (event: string, session: any) => {
      // Limpiar solo datos específicos de la aplicación, NO los tokens de Supabase
      if (event === 'SIGNED_OUT') {
        // Limpiar solo datos específicos de la aplicación
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('stellamaris') && 
            !key.includes('stellamaris-auth') // NO limpiar tokens de auth
          )) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Limpiar sessionStorage de manera similar
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.includes('stellamaris') && 
            !key.includes('stellamaris-auth') // NO limpiar tokens de auth
          )) {
            sessionKeysToRemove.push(key);
          }
        }
        
        sessionKeysToRemove.forEach(key => {
          sessionStorage.removeItem(key);
        });
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