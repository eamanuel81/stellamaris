import { supabase } from './supabaseClient';

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
}

export async function changeUserPassword(newPassword: string): Promise<PasswordChangeResult> {
  try {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Intentar cambiar la contraseña con el cliente normal
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (!updateError) {
      return { success: true };
    }

    // Si falla con el cliente normal, intentar con el admin client
    const { error: adminError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (adminError) {
      return {
        success: false,
        error: adminError.message
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error changing password:', error);
    
    let errorMessage = 'Error desconocido al cambiar la contraseña';
    
    if (error instanceof Error) {
      if (error.message.includes('password')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.message.includes('JWT') || error.message.includes('token')) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Espera un momento antes de intentar de nuevo';
      } else if (error.message.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'La contraseña no puede tener más de 128 caracteres' };
  }
  
  // Validar caracteres permitidos
  const allowedChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
  if (!allowedChars.test(password)) {
    return { isValid: false, error: 'La contraseña contiene caracteres no permitidos' };
  }
  
  return { isValid: true };
}

// Función para limpiar el estado del avatar cuando se cambia de usuario
export function clearAvatarState() {
  // Esta función puede ser llamada desde el contexto del avatar
  // para limpiar el estado cuando se detecta un cambio de usuario
} 

/**
 * Limpia completamente una sesión corrupta
 * Elimina tokens del almacenamiento local y cierra sesión en Supabase
 */
export async function clearCorruptedSession(): Promise<void> {
  try {
    console.log('🧹 Limpiando sesión corrupta...');
    
    // Limpiar almacenamiento local
    if (typeof window !== 'undefined') {
      // Limpiar localStorage
      localStorage.removeItem('stellamaris-auth');
      localStorage.removeItem('stellamaris-auth-storage');
      
      // Limpiar sessionStorage
      sessionStorage.removeItem('stellamaris-auth');
      sessionStorage.removeItem('stellamaris-auth-storage');
      
      // Limpiar cualquier otra clave relacionada
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('stellamaris') || key && key.includes('supabase')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Eliminada clave: ${key}`);
      });
    }
    
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();
    
    console.log('✅ Sesión corrupta limpiada correctamente');
  } catch (error) {
    console.error('❌ Error limpiando sesión corrupta:', error);
    throw error;
  }
}

/**
 * Verifica si una sesión es válida
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Error verificando sesión:', error.message);
      return false;
    }
    
    if (!session) {
      console.log('ℹ️ No hay sesión activa');
      return false;
    }
    
    // Verificar si el token ha expirado
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('⏰ Token expirado');
      return false;
    }
    
    console.log('✅ Sesión válida');
    return true;
  } catch (error) {
    console.error('❌ Error inesperado verificando sesión:', error);
    return false;
  }
}

/**
 * Intenta renovar la sesión actual
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log('🔄 Intentando renovar sesión...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Error renovando sesión:', error.message);
      return false;
    }
    
    if (data.session) {
      console.log('✅ Sesión renovada exitosamente');
      return true;
    } else {
      console.log('ℹ️ No se pudo renovar la sesión');
      return false;
    }
  } catch (error) {
    console.error('❌ Error inesperado renovando sesión:', error);
    return false;
  }
}

/**
 * Recupera de errores de autenticación comunes
 */
export async function recoverFromAuthError(error: any): Promise<boolean> {
  const errorMessage = error?.message || error?.error_description || String(error);
  
  console.log('🔄 Intentando recuperar de error:', errorMessage);
  
  // Errores de token de actualización
  if (errorMessage.includes('Invalid Refresh Token') || 
      errorMessage.includes('Refresh Token Not Found') ||
      errorMessage.includes('TOKEN_REFRESH_FAILED')) {
    
    console.log('🔄 Error de token detectado, limpiando sesión...');
    await clearCorruptedSession();
    return true;
  }
  
  // Errores de token expirado
  if (errorMessage.includes('JWT expired') || 
      errorMessage.includes('Token expired')) {
    
    console.log('⏰ Token expirado, intentando renovar...');
    return await refreshSession();
  }
  
  // Otros errores de autenticación
  if (errorMessage.includes('Invalid JWT') || 
      errorMessage.includes('Malformed JWT')) {
    
    console.log('🔑 JWT inválido, limpiando sesión...');
    await clearCorruptedSession();
    return true;
  }
  
  console.log('ℹ️ Error no recuperable automáticamente');
  return false;
}

/**
 * Configura listeners para errores de autenticación
 */
export function setupAuthErrorListeners() {
  // Listener para errores de red
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('Invalid Refresh Token') ||
           event.reason.message.includes('Refresh Token Not Found'))) {
        
        console.log('🔄 Error de token detectado en unhandledrejection');
        event.preventDefault();
        
        // Limpiar sesión corrupta
        clearCorruptedSession().catch(console.error);
      }
    });
  }
} 