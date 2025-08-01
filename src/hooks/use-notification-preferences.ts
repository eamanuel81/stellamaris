import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface NotificationPreferences {
  enabled: boolean;
  taskAssignments: boolean;
  taskModifications: boolean;
  taskCompletions: boolean;
  systemNotifications: boolean;
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    taskAssignments: true,
    taskModifications: true,
    taskCompletions: true,
    systemNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('Error de autenticación');
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Intentar obtener preferencias desde la tabla user_preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching notification preferences:', error);
        setError(`Error cargando preferencias: ${error.message}`);
      } else if (data && data.notification_preferences) {
        // Verificar que notification_preferences tiene la estructura correcta
        const prefs = data.notification_preferences as any;
        if (prefs && typeof prefs === 'object' && 'enabled' in prefs) {
          setPreferences(prefs as NotificationPreferences);
        } else {
          // Si la estructura no es correcta, usar valores por defecto
          setPreferences({
            enabled: true,
            taskAssignments: true,
            taskModifications: true,
            taskCompletions: true,
            systemNotifications: true,
          });
        }
      }
      // Si no hay datos, usar los valores por defecto
    } catch (err) {
      console.error('Unexpected error fetching notification preferences:', err);
      setError(`Error inesperado al cargar las preferencias: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuario no autenticado');
        return { error: new Error('Usuario no autenticado') };
      }

      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Intentar actualizar o insertar en user_preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error updating notification preferences:', error);
        setError(error.message);
        return { error };
      } else {
        setPreferences(updatedPreferences);
        setError(null);
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error updating notification preferences:', err);
      setError('Error inesperado al actualizar las preferencias');
      return { error: new Error('Error inesperado') };
    }
  }, [preferences]);

  const toggleNotifications = useCallback(async (enabled: boolean) => {
    return updatePreferences({ enabled });
  }, [updatePreferences]);

  const toggleTaskAssignments = useCallback(async (enabled: boolean) => {
    return updatePreferences({ taskAssignments: enabled });
  }, [updatePreferences]);

  const toggleTaskModifications = useCallback(async (enabled: boolean) => {
    return updatePreferences({ taskModifications: enabled });
  }, [updatePreferences]);

  const toggleTaskCompletions = useCallback(async (enabled: boolean) => {
    return updatePreferences({ taskCompletions: enabled });
  }, [updatePreferences]);

  const toggleSystemNotifications = useCallback(async (enabled: boolean) => {
    return updatePreferences({ systemNotifications: enabled });
  }, [updatePreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    toggleNotifications,
    toggleTaskAssignments,
    toggleTaskModifications,
    toggleTaskCompletions,
    toggleSystemNotifications,
    refetch: fetchPreferences
  };
} 