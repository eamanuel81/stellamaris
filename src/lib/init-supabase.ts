import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Validar variables de entorno
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está definida');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definida');
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida');
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida');
}

if (!supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY no está definida');
  throw new Error('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY no está definida');
}

//console.log('✅ Variables de entorno de Supabase configuradas correctamente');
//console.log('🔗 URL:', supabaseUrl);

// Variables globales para evitar múltiples instancias
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

// Función para inicializar Supabase solo una vez
export function initializeSupabase() {
  if (!supabaseInstance) {
    //console.log('🔧 Inicializando cliente Supabase...');
    try {
      // Las variables ya están validadas arriba, así que son string
      supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storageKey: 'stellamaris-auth',
          flowType: 'pkce',
          debug: false
        },
        global: {
          headers: {
            'X-Client-Info': 'stellamaris-manager'
          }
        }
      });

      // Configurar interceptores para manejar errores de token
      if (process.env.NODE_ENV === 'development') {
        // Interceptor para respuestas de auth
        supabaseInstance.auth.onAuthStateChange((event, session) => {
          if (event === 'TOKEN_REFRESHED') {
            console.log('✅ Token refrescado exitosamente');
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 Usuario cerró sesión');
          }
        });
      }

      //console.log('✅ Cliente Supabase inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Supabase:', error);
      throw error;
    }
  }
  return supabaseInstance;
}

// Función para inicializar Supabase Admin solo una vez
export function initializeSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    console.log('🔧 Inicializando cliente Supabase Admin...');
    try {
      // Las variables ya están validadas arriba, así que son string
      supabaseAdminInstance = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'X-Client-Info': 'stellamaris-manager-admin'
          }
        }
      });
      console.log('✅ Cliente Supabase Admin inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Supabase Admin:', error);
      throw error;
    }
  }
  return supabaseAdminInstance;
}

// Función para resetear en desarrollo
export function resetSupabaseInstances() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Reseteando instancias de Supabase para HMR');
    supabaseInstance = null;
    supabaseAdminInstance = null;
  }
} 