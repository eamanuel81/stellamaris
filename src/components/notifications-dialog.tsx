"use client"

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationsDialogProps {
  children?: React.ReactNode;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'task_assigned':
      return '📋';
    case 'task_modified':
      return '✏️';
    case 'task_completed':
      return '✅';
    case 'system':
      return '🔔';
    default:
      return '📢';
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'task_assigned':
      return 'bg-blue-50 border-blue-200';
    case 'task_modified':
      return 'bg-yellow-50 border-yellow-200';
    case 'task_completed':
      return 'bg-green-50 border-green-200';
    case 'system':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export function NotificationsDialog({ children }: NotificationsDialogProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications, isLoading } = useNotifications();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markAsRead(notificationId);
    if (result.error) {
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.error) {
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las notificaciones como leídas.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Notificaciones marcadas como leídas",
        description: "Todas las notificaciones han sido marcadas como leídas.",
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    if (result.error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada.",
      });
    }
  };

  const handleClearAll = async () => {
    const result = await clearAllNotifications();
    if (result.error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar todas las notificaciones.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Notificaciones eliminadas",
        description: "Todas las notificaciones han sido eliminadas.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Notificaciones</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-8 px-2"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar todas como leídas
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {unreadCount > 0 ? `${unreadCount} notificación${unreadCount === 1 ? '' : 'es'} sin leer` : 'Todas las notificaciones han sido leídas'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p>No hay notificaciones</p>
              <p className="text-sm">Las notificaciones aparecerán aquí cuando tengas nuevas tareas asignadas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                    !notification.isread ? 'ring-2 ring-primary/20' : '' // Changed from isRead to isread
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.isread && ( // Changed from isRead to isread
                            <Badge variant="secondary" className="text-xs">
                              Nuevo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdat), "dd 'de' MMMM 'a las' HH:mm", { locale: es })} {/* Changed from createdAt to createdat */}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.isread && ( // Changed from isRead to isread
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 