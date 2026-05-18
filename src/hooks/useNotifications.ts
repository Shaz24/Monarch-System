import { useState, useEffect, useCallback } from 'react';

export interface MonarchNotification {
  id: string;
  type: 'xp' | 'level' | 'streak' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  value?: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<MonarchNotification[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('monarch_notifications');
    if (raw) {
      try {
        setNotifications(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
  }, []);

  const addNotification = useCallback((
    type: MonarchNotification['type'],
    title: string,
    message: string,
    value?: number
  ) => {
    const newNotif: MonarchNotification = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      value
    };

    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, 20);
      localStorage.setItem('monarch_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('monarch_notifications');
  }, []);

  // Listen to custom window events for XP gains or Level up
  useEffect(() => {
    const handleXpGranted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { xpAdded, statNames } = customEvent.detail;
      const statsStr = statNames && statNames.length > 0 ? ` [${statNames.join(', ').toUpperCase()}]` : '';
      addNotification(
        'xp',
        'Directives Fulfilled',
        `Acquired +${xpAdded} XP${statsStr}`,
        xpAdded
      );
    };

    const handleLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { newLevel } = customEvent.detail;
      addNotification(
        'level',
        'SYSTEM LEVEL UP',
        `System integrity elevated to Level ${newLevel}!`,
        newLevel
      );
    };

    window.addEventListener('monarch-xp-granted', handleXpGranted);
    window.addEventListener('monarch-level-up-notif', handleLevelUp);

    return () => {
      window.removeEventListener('monarch-xp-granted', handleXpGranted);
      window.removeEventListener('monarch-level-up-notif', handleLevelUp);
    };
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    clearNotifications
  };
}
