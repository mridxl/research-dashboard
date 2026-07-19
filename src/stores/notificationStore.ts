import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  testId: string;
  patientName: string;
  status: 'completed' | 'failed' | 'warning';
  message: string;
  timestamp: string; // ISO string for persistence
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  highlightedTestIds: string[];

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  updateNotification: (
    id: string,
    updates: Partial<Omit<Notification, 'id' | 'timestamp'>>
  ) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;

  // Highlighting actions
  markTestHighlighted: (testId: string) => void;
  clearTestHighlight: (testId: string) => void;

  cleanupOldNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      highlightedTestIds: [],

      addNotification: notification => {
        const id = uuidv4();
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date().toISOString(),
          read: false,
        };

        set(state => {
          // Keep max 50 notifications
          const updatedNotifications = [newNotification, ...state.notifications].slice(0, 50);
          return {
            notifications: updatedNotifications,
            unreadCount: state.unreadCount + 1,
          };
        });

        return id;
      },

      updateNotification: (id, updates) => {
        set(state => ({
          notifications: state.notifications.map(n => (n.id === id ? { ...n, ...updates } : n)),
        }));
      },

      markAllRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      markAsRead: id => {
        set(state => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification && !notification.read) {
            return {
              notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          }
          return {};
        });
      },

      markTestHighlighted: testId => {
        set(state => ({
          highlightedTestIds: [...state.highlightedTestIds, testId],
        }));

        setTimeout(() => {
          get().clearTestHighlight(testId);
        }, 8000);
      },

      clearTestHighlight: testId => {
        set(state => ({
          highlightedTestIds: state.highlightedTestIds.filter(id => id !== testId),
        }));
      },

      cleanupOldNotifications: () => {
        set(state => {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          const filteredNotifications = state.notifications.filter(
            n => new Date(n.timestamp) > threeDaysAgo
          );

          if (filteredNotifications.length === state.notifications.length) {
            return {};
          }

          return {
            notifications: filteredNotifications,
            unreadCount: filteredNotifications.filter(n => !n.read).length,
          };
        });
      },
    }),
    {
      name: 'notification-storage',
      partialize: state => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
