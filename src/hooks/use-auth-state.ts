import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Variables globales para manejar una sola suscripción
let globalAuthSubscription: any = null;
let authListeners: Set<(event: string, session: any) => void> = new Set();
let isGlobalInitialized = false;

export function useAuthState() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Inicializar la suscripción global solo una vez
    if (!isGlobalInitialized) {
     // console.log('Initializing global auth subscription');
      isGlobalInitialized = true;
      
      globalAuthSubscription = supabase.auth.onAuthStateChange((event, session) => {
      //  console.log('Global auth state changed:', event, session?.user?.id);
        
        // Notificar a todos los listeners
        authListeners.forEach(listener => {
          try {
            listener(event, session);
          } catch (error) {
            console.error('Error in auth listener:', error);
          }
        });
      });
    }

    return () => {
      // No limpiar aquí, mantener la suscripción activa
    };
  }, []);

  return {
    addAuthListener: (listener: (event: string, session: any) => void) => {
      authListeners.add(listener);
      return () => authListeners.delete(listener);
    }
  };
}

// Función para limpiar la suscripción global
export function cleanupAuthSubscription() {
  if (globalAuthSubscription) {
    console.log('Cleaning up global auth subscription');
    globalAuthSubscription.data.subscription.unsubscribe();
    globalAuthSubscription = null;
    authListeners.clear();
    isGlobalInitialized = false;
  }
} 