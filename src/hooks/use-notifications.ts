import { useEffect, useState, useCallback, useMemo } from 'react';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_modified' | 'task_completed' | 'system';
  isRead: boolean;
  createdAt: string;
  assignmentId?: string;
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
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Error cargando notificaciones');
      const data: any[] = await res.json();
      // Normalize field names from DB (isRead, userId)
      const mapped: Notification[] = data.map(n => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead ?? false,
        createdAt: n.createdAt,
        assignmentId: n.assignmentId ?? undefined,
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.isRead).length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) return { error: new Error('Error marcando notificación') };
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return { error: null };
    } catch {
      return { error: new Error('Error inesperado') };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) return { error: new Error('Error marcando notificaciones') };
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return { error: null };
    } catch {
      return { error: new Error('Error inesperado') };
    }
  }, []);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });
      if (!res.ok) return { data: null, error: new Error('Error creando notificación') };
      const data = await res.json();
      setNotifications(prev => [data, ...prev]);
      if (!data.isRead) setUnreadCount(prev => prev + 1);
      return { data, error: null };
    } catch {
      return { data: null, error: new Error('Error inesperado') };
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      const res = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      if (!res.ok) return { error: new Error('Error eliminando notificación') };
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      return { error: null };
    } catch {
      return { error: new Error('Error inesperado') };
    }
  }, [notifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/all', { method: 'DELETE' });
      if (!res.ok) return { error: new Error('Error limpiando notificaciones') };
      setNotifications([]);
      setUnreadCount(0);
      return { error: null };
    } catch {
      return { error: new Error('Error inesperado') };
    }
  }, []);

  return useMemo(() => ({
    notifications, isLoading, error, unreadCount,
    markAsRead, markAllAsRead, createNotification, deleteNotification, clearAllNotifications,
    refetch: fetchNotifications,
  }), [notifications, isLoading, error, unreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification, clearAllNotifications, fetchNotifications]);
}
