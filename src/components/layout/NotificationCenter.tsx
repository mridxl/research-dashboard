import { useEffect, useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, AlertTriangle, Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type Notification, useNotificationStore } from '@/stores/notificationStore';

export const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAllRead,
    clearNotifications,
    markAsRead,
    markTestHighlighted,
    cleanupOldNotifications,
  } = useNotificationStore(
    useShallow(state => ({
      notifications: state.notifications,
      unreadCount: state.unreadCount,
      markAllRead: state.markAllRead,
      clearNotifications: state.clearNotifications,
      markAsRead: state.markAsRead,
      markTestHighlighted: state.markTestHighlighted,
      cleanupOldNotifications: state.cleanupOldNotifications,
    }))
  );

  useEffect(() => {
    cleanupOldNotifications();
  }, [cleanupOldNotifications]);

  const handleNotificationClick = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    markAsRead(notification.id);
    markTestHighlighted(notification.testId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] rounded-full border-2 border-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80 sm:w-96" align="end" alignOffset={-8}>
        <div className="flex justify-between items-center p-3 sm:px-4">
          <h4 className="font-semibold leading-none">Notifications</h4>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => markAllRead()}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="mr-1 w-3.5 h-3.5" />
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => clearNotifications()}
              >
                <Trash2 className="mr-1 w-3.5 h-3.5" />
                Clear all
              </Button>
            </div>
          )}
        </div>
        <Separator />

        <ScrollArea className="h-[300px] sm:h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-[200px] text-muted-foreground">
              <Bell className="mb-2 w-8 h-8 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    'relative flex px-4 py-3 gap-3 border-b cursor-pointer hover:bg-muted/50 transition-colors last:border-0',
                    !notification.read && 'bg-muted/10'
                  )}
                  onClick={e => handleNotificationClick(e, notification)}
                >
                  <div
                    className={cn(
                      'shrink-0 mt-1 w-2 h-2 rounded-full',
                      !notification.read ? 'bg-primary' : 'bg-transparent'
                    )}
                  />

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p
                        className={cn(
                          'text-sm font-medium leading-none truncate pr-4',
                          !notification.read ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {notification.patientName || `Test ${notification.testId.slice(0, 8)}...`}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {notification.status === 'completed' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : notification.status === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <p
                        className={cn(
                          'text-xs leading-none',
                          notification.status === 'completed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : notification.status === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Stripe */}
                  <div
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-0.5',
                      notification.status === 'completed'
                        ? 'bg-emerald-500/50'
                        : notification.status === 'warning'
                          ? 'bg-amber-500/50'
                          : 'bg-red-500/50',
                      notification.read ? 'opacity-30' : 'opacity-100'
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-2 bg-muted/30 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Notifications are automatically cleared after 3 days.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
