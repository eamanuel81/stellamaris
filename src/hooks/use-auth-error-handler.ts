import { useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';

export function useAuthErrorHandler() {
  const [authError, setAuthError] = useState<string | null>(null);
  const { clearCorruptedSession, logout } = useAuth();

  const handleAuthError = useCallback((error: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔐 Error de autenticación detectado:', error);
    }
    
    let errorMessage = 'Error de autenticación desconocido';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error_description) {
      errorMessage = error.error_description;
    }

    setAuthError(errorMessage);
    
    // Detectar errores específicos de token
    if (errorMessage.includes('Invalid Refresh Token') || 
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('TOKEN_REFRESH_FAILED')) {
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Error de token de actualización detectado, limpiando sesión...');
      }
      
      // Limpiar sesión corrupta automáticamente
      clearCorruptedSession().catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error limpiando sesión:', error);
        }
      });
    }
  }, [clearCorruptedSession]);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const handleClearSession = useCallback(async () => {
    try {
      await clearCorruptedSession();
      setAuthError(null);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error limpiando sesión:', error);
      }
      return false;
    }
  }, [clearCorruptedSession]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setAuthError(null);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error en logout:', error);
      }
      return false;
    }
  }, [logout]);

  return {
    authError,
    setAuthError,
    handleAuthError,
    clearError,
    handleClearSession,
    handleLogout,
    isRefreshTokenError: authError?.includes('Invalid Refresh Token') || 
                         authError?.includes('Refresh Token Not Found') ||
                         authError?.includes('TOKEN_REFRESH_FAILED')
  };
}

