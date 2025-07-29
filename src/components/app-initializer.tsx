"use client"

import { useEffect, useRef } from 'react';
import { useSupabaseSingleton } from '@/hooks/use-supabase-singleton';
import { useAuthState } from '@/hooks/use-auth-state';
import { useDevCleanup } from '@/hooks/use-dev-cleanup';

// Variable global para rastrear si ya se inicializó
let isAppInitialized = false;

export function AppInitializer() {
  const isInitialized = useRef(false);
  const { supabase } = useSupabaseSingleton();
  const { addAuthListener } = useAuthState();
  
  // Hook de limpieza para desarrollo
  useDevCleanup();

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitialized.current || isAppInitialized) return;
    
    isInitialized.current = true;
    isAppInitialized = true;

    // Agregar un listener básico para mantener la suscripción activa
    const removeListener = addAuthListener((event, session) => {
      // Este listener se mantiene activo para evitar que se limpie la suscripción
    });

    return () => {
      removeListener();
    };
  }, [addAuthListener]);

  return null; // Este componente no renderiza nada
} 