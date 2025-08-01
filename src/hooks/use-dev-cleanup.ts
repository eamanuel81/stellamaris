import { useEffect } from 'react';
import { resetSupabaseClients } from '@/lib/supabaseClient';
import { resetSupabaseSingleton } from './use-supabase-singleton';
import { cleanupAuthSubscription } from './use-auth-state';

export function useDevCleanup() {
  useEffect(() => {
    // Solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const handleBeforeUnload = () => {
        // Clean up on page unload
        if (typeof window !== 'undefined') {
            // Reset any global state or cleanup
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
            // Page hidden, resetting clients
            if (typeof window !== 'undefined') {
                // Reset any global state or cleanup
            }
        }
      };

      // Limpiar cuando se recarga la página
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Limpiar cuando se cierra la pestaña
      window.addEventListener('unload', handleBeforeUnload);

      // Resetear cuando la página se oculta (para HMR)
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('unload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);
} 