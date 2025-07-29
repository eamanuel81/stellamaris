import { initializeSupabase, initializeSupabaseAdmin, resetSupabaseInstances } from './init-supabase';

// Exportar solo la instancia principal inicializada
export const supabase = initializeSupabase();

// Función para obtener la instancia admin solo cuando se necesite
export function getSupabaseAdmin() {
  return initializeSupabaseAdmin();
}

// Función para resetear en desarrollo
export function resetSupabaseClients() {
  resetSupabaseInstances();
}