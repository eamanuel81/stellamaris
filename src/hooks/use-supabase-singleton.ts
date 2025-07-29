import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Variable global para rastrear si ya se inicializó
let isSupabaseInitialized = false;

export function useSupabaseSingleton() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current || isSupabaseInitialized) return;
    
    isInitialized.current = true;
    isSupabaseInitialized = true;

    console.log('useSupabaseSingleton: Ensuring single Supabase instance');

    // Verificar que la instancia existe y es única
    if (supabase) {
      console.log('Supabase instance verified and ready');
    }

    return () => {
      // No limpiar aquí, mantener la instancia
    };
  }, []);

  return { supabase };
}

// Función para resetear en desarrollo
export function resetSupabaseSingleton() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Resetting Supabase singleton');
    isSupabaseInitialized = false;
  }
} 