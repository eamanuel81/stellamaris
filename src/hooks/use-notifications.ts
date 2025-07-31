import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Notification {
  id: string;
  userid: string; // Changed from userId to userid
  title: string;
  message: string;
  type: 'task_assigned' | 'task_modified' | 'task_completed' | 'system';
  isread: boolean; // Changed from isRead to isread
  createdat: string; // Changed from createdAt to createdat
  data?: {
    assignmentId?: string;
    taskId?: string;
    employeeId?: string;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setError('Error de autenticación');
        setNotifications([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userid', user.id)
        .order('createdat', { ascending: false });
        
      if (error) {
        setError(`Error cargando notificaciones: ${error.message}`);
        setNotifications([]);
      } else {
        const notificationsData = (data as unknown as Notification[]) || [];
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.isread).length);
        setError(null);
      }
    } catch (err) {
      setError(`Error inesperado al cargar las notificaciones: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Polling para actualizar notificaciones cada 30 segundos
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ isread: true }) // Changed from isRead to isread
        .eq('id', notificationId);
        
      if (error) {
        return { error };
      } else {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isread: true } : n) // Changed from isRead to isread
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return { error: null };
      }
    } catch (err) {
      return { error: new Error('Error inesperado') };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Usuario no autenticado') };

      const { error } = await supabase
        .from('notifications')
        .update({ isread: true }) // Changed from isRead to isread
        .eq('userid', user.id) // Changed from userId to userid
        .eq('isread', false); // Changed from isRead to isread
        
      if (error) {
        return { error };
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isread: true }))); // Changed from isRead to isread
        setUnreadCount(0);
        return { error: null };
      }
    } catch (err) {
      return { error: new Error('Error inesperado') };
    }
  }, []);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdat'>) => { // Changed from createdAt to createdat
    try {
      
      // Validar que todos los campos requeridos estén presentes
      if (!notification.userid) {
        return { data: null, error: new Error('userid is required') };
      }
      
      if (!notification.title) {
        return { data: null, error: new Error('title is required') };
      }
      
      if (!notification.message) {
        return { data: null, error: new Error('message is required') };
      }
      
      if (!notification.type) {
        return { data: null, error: new Error('type is required') };
      }
      
      // Verificar autenticación antes de insertar
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        return { data: null, error: authError };
      }
      
      if (!user) {
        return { data: null, error: new Error('No authenticated user') };
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select();
        
      if (error) {
        return { data: null, error };
      } else if (data && data.length > 0) {
        const newNotification = data[0] as unknown as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.isread) { // Changed from isRead to isread
          setUnreadCount(prev => prev + 1);
        }
        return { data: newNotification, error: null };
      } else {
        return { data: null, error: new Error('No data returned from insert') };
      }
    } catch (err) {
      return { data: null, error: new Error('Error inesperado') };
    }
    
    return { data: null, error: new Error('No se pudo crear la notificación') };
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) {
        return { error };
      } else {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.isread) { // Changed from isRead to isread
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return { error: null };
      }
    } catch (err) {
      return { error: new Error('Error inesperado') };
    }
  }, [notifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Usuario no autenticado') };

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('userid', user.id); // Changed from userId to userid
        
      if (error) {
        return { error };
      } else {
        setNotifications([]);
        setUnreadCount(0);
        return { error: null };
      }
    } catch (err) {
      return { error: new Error('Error inesperado') };
    }
  }, []);

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    clearAllNotifications,
    refetch: fetchNotifications
  };
} 