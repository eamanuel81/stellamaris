"use client"

import { useSupabaseSingleton } from '@/hooks/use-supabase-singleton';

export function SupabaseInitializer() {
  useSupabaseSingleton();
  return null; // Este componente no renderiza nada
} 