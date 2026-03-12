import { useEffect, useState, useCallback } from 'react';

export interface NotificationPreferences {
  enabled: boolean;
  taskAssignments: boolean;
  taskModifications: boolean;
  taskCompletions: boolean;
  systemNotifications: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  taskAssignments: true,
  taskModifications: true,
  taskCompletions: true,
  systemNotifications: true,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Error cargando preferencias');
      const data = await res.json();
      if (data.preferences && typeof data.preferences === 'object' && 'enabled' in data.preferences) {
        setPreferences(data.preferences as NotificationPreferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPreferences(); }, [fetchPreferences]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences: updatedPreferences }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Error actualizando preferencias');
        return { error: new Error(err.error) };
      }
      setPreferences(updatedPreferences);
      setError(null);
      return { error: null };
    } catch (err) {
      setError('Error inesperado al actualizar las preferencias');
      return { error: new Error('Error inesperado') };
    }
  }, [preferences]);

  const toggleNotifications = useCallback((enabled: boolean) => updatePreferences({ enabled }), [updatePreferences]);
  const toggleTaskAssignments = useCallback((enabled: boolean) => updatePreferences({ taskAssignments: enabled }), [updatePreferences]);
  const toggleTaskModifications = useCallback((enabled: boolean) => updatePreferences({ taskModifications: enabled }), [updatePreferences]);
  const toggleTaskCompletions = useCallback((enabled: boolean) => updatePreferences({ taskCompletions: enabled }), [updatePreferences]);
  const toggleSystemNotifications = useCallback((enabled: boolean) => updatePreferences({ systemNotifications: enabled }), [updatePreferences]);

  return {
    preferences, isLoading, error,
    updatePreferences, toggleNotifications, toggleTaskAssignments,
    toggleTaskModifications, toggleTaskCompletions, toggleSystemNotifications,
    refetch: fetchPreferences,
  };
}
