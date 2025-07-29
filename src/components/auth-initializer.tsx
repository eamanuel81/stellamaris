"use client"

import { useEffect, useRef } from 'react';
import { useAuthState } from '@/hooks/use-auth-state';
import { useDevCleanup } from '@/hooks/use-dev-cleanup';

// Variable global para rastrear si ya se inicializó
let isGlobalInitialized = false;

export function AuthInitializer() {
  const isInitialized = useRef(false);
  const { addAuthListener } = useAuthState();
  
  // Hook de limpieza para desarrollo
  useDevCleanup();

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitialized.current || isGlobalInitialized) return;
    
    isInitialized.current = true;
    isGlobalInitialized = true;

    console.log('AuthInitializer: Initializing global auth state');

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