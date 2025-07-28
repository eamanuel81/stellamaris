import { supabase, supabaseAdmin } from './supabaseClient';

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
    console.log('Fallback to admin client for password change');
    
    const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
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
  console.log('Clearing avatar state due to user change');
} 