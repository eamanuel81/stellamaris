import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

// Variables globales para evitar múltiples instancias
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

// Función para inicializar Supabase solo una vez
export function initializeSupabase() {
  if (!supabaseInstance) {
    console.log('Initializing Supabase client (first time only)');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'stellamaris-auth'
      }
    });
  }
  return supabaseInstance;
}

// Función para inicializar Supabase Admin solo una vez
export function initializeSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
}

// Función para resetear en desarrollo
export function resetSupabaseInstances() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Resetting Supabase instances for HMR');
    supabaseInstance = null;
    supabaseAdminInstance = null;
  }
} 