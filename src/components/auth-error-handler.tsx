"use client"

import React, { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, LogOut, AlertTriangle } from 'lucide-react';

interface AuthErrorHandlerProps {
  error?: string;
  onRetry?: () => void;
}

export function AuthErrorHandler({ error, onRetry }: AuthErrorHandlerProps) {
  const { clearCorruptedSession, logout } = useAuth();
  const [isHandling, setIsHandling] = useState(false);

  // Detectar errores de token de actualización
  const isRefreshTokenError = error?.includes('Invalid Refresh Token') || 
                             error?.includes('Refresh Token Not Found') ||
                             error?.includes('TOKEN_REFRESH_FAILED');

  const handleClearSession = async () => {
    setIsHandling(true);
    try {
      await clearCorruptedSession();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Error limpiando sesión:', error);

      }
    } finally {
      setIsHandling(false);
    }
  };

  const handleLogout = async () => {
    setIsHandling(true);
    try {
      await logout();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {

        console.error('Error en logout:', error);

      }
      // Forzar recarga si falla
      window.location.reload();
    } finally {
      setIsHandling(false);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (!error) return null;

  return (
    <Alert className="mb-4 border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Error de Autenticación</AlertTitle>
      <AlertDescription className="text-red-700">
        <p className="mb-3">{error}</p>
        
        {isRefreshTokenError && (
          <p className="mb-3 text-sm">
            Este error indica un problema con la sesión. Puedes intentar limpiar la sesión corrupta o cerrar sesión completamente.
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isHandling}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}
          
          {isRefreshTokenError && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSession}
              disabled={isHandling}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpiar Sesión
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isHandling}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

