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

      console.log('Fetching preferences for user:', user.id);

      // Intentar obtener preferencias desde la tabla user_preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching notification preferences:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Si hay error PGRST116 (no rows found), usar valores por defecto
        if (error.code === 'PGRST116') {
          console.log('No preferences found for user, using defaults');
          setPreferences({
            enabled: true,
            taskAssignments: true,
            taskModifications: true,
            taskCompletions: true,
            systemNotifications: true,
          } as NotificationPreferences);
          setError(null);
        } else if (error.code === '406') {
          console.log('Using default preferences due to 406 error');
          setPreferences({
            enabled: true,
            taskAssignments: true,
            taskModifications: true,
            taskCompletions: true,
            systemNotifications: true,
          } as NotificationPreferences);
          setError(null);
        } else {
          console.log('Using default preferences due to error:', error.code);
          setPreferences({
            enabled: true,
            taskAssignments: true,
            taskModifications: true,
            taskCompletions: true,
            systemNotifications: true,
          } as NotificationPreferences);
          setError(null);
        }
      } else if (data && data.notification_preferences) {
        console.log('Preferences loaded successfully:', data.notification_preferences);
        setPreferences(data.notification_preferences as NotificationPreferences);
        setError(null);
      } else {
        // Si no hay datos, usar los valores por defecto
        console.log('No preferences found, using defaults');
        setPreferences({
          enabled: true,
          taskAssignments: true,
          taskModifications: true,
          taskCompletions: true,
          systemNotifications: true,
        } as NotificationPreferences);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching notification preferences:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'No message');
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      console.error('Full error object:', JSON.stringify(err, null, 2));
      
      // En caso de cualquier error inesperado, usar valores por defecto
      setPreferences({
        enabled: true,
        taskAssignments: true,
        taskModifications: true,
        taskCompletions: true,
        systemNotifications: true,
      } as NotificationPreferences);
      setError(null);
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