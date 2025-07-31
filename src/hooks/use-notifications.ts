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
        console.error('Error getting user:', userError);
        setError('Error de autenticación');
        setNotifications([]);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        console.log('No user found, setting empty notifications');
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      console.log('Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userid', user.id) // Changed from userId to userid
        .order('createdat', { ascending: false }); // Changed from createdAt to createdat
        
      if (error) {
        console.error('Error fetching notifications:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`Error cargando notificaciones: ${error.message} (${error.code})`);
        setNotifications([]);
      } else {
        console.log('Notifications fetched successfully:', data);
        const notificationsData = (data as unknown as Notification[]) || [];
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.isread).length); // Changed from isRead to isread
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching notifications:', err);
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
        console.error('Error marking notification as read:', error);
        return { error };
      } else {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isread: true } : n) // Changed from isRead to isread
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error marking notification as read:', err);
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
        console.error('Error marking all notifications as read:', error);
        return { error };
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isread: true }))); // Changed from isRead to isread
        setUnreadCount(0);
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error marking all notifications as read:', err);
      return { error: new Error('Error inesperado') };
    }
  }, []);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdat'>) => { // Changed from createdAt to createdat
    try {
      console.log('Creating notification:', notification);
      
      // Validar que todos los campos requeridos estén presentes
      if (!notification.userid) {
        console.error('Error: userid is missing');
        return { data: null, error: new Error('userid is required') };
      }
      
      if (!notification.title) {
        console.error('Error: title is missing');
        return { data: null, error: new Error('title is required') };
      }
      
      if (!notification.message) {
        console.error('Error: message is missing');
        return { data: null, error: new Error('message is required') };
      }
      
      if (!notification.type) {
        console.error('Error: type is missing');
        return { data: null, error: new Error('type is required') };
      }
      
      console.log('Notification data validated, inserting into database...');
      
      // Verificar autenticación antes de insertar
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error before insert:', authError);
        return { data: null, error: authError };
      }
      
      if (!user) {
        console.error('No authenticated user found');
        return { data: null, error: new Error('No authenticated user') };
      }
      
      console.log('User authenticated:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select();
        
      if (error) {
        console.error('Error creating notification:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { data: null, error };
      } else if (data && data.length > 0) {
        const newNotification = data[0] as unknown as Notification;
        console.log('Notification created successfully:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.isread) { // Changed from isRead to isread
          setUnreadCount(prev => prev + 1);
        }
        return { data: newNotification, error: null };
      } else {
        console.error('No data returned from insert');
        return { data: null, error: new Error('No data returned from insert') };
      }
    } catch (err) {
      console.error('Unexpected error creating notification:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
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
        console.error('Error deleting notification:', error);
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
      console.error('Unexpected error deleting notification:', err);
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
        console.error('Error clearing all notifications:', error);
        return { error };
      } else {
        setNotifications([]);
        setUnreadCount(0);
        return { error: null };
      }
    } catch (err) {
      console.error('Unexpected error clearing all notifications:', err);
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