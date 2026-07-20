import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Global state for shared notifications polling
let globalNotifications: NotificationItem[] = [];
let globalLoading = false;
const listeners = new Set<(state: { notifications: NotificationItem[], loading: boolean }) => void>();
let globalInterval: any = null;

const updateGlobalNotifications = (newNotifications: NotificationItem[]) => {
  globalNotifications = newNotifications;
  listeners.forEach(l => l({ notifications: globalNotifications, loading: globalLoading }));
};

const fetchNotifications = async () => {
  if (globalLoading) return;
  globalLoading = true;
  listeners.forEach(l => l({ notifications: globalNotifications, loading: true }));
  try {
    const data = await api.getNotifications();
    if (Array.isArray(data)) {
      globalNotifications = data;
    } else {
      globalNotifications = [];
    }
  } catch (err) {
    console.warn("Failed to load notifications from backend", err);
    globalNotifications = [];
  } finally {
    globalLoading = false;
    listeners.forEach(l => l({ notifications: globalNotifications, loading: false }));
  }
};

const startGlobalPolling = () => {
  if (!globalInterval) {
    fetchNotifications();
    globalInterval = setInterval(fetchNotifications, 60000); // 60 seconds interval
  }
};

const stopGlobalPolling = () => {
  if (globalInterval && listeners.size === 0) {
    clearInterval(globalInterval);
    globalInterval = null;
  }
};

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(globalNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(globalLoading);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 12, // 12px offset for mt-3 spacing
        right: window.innerWidth - rect.right
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = (state: { notifications: NotificationItem[], loading: boolean }) => {
      setNotifications(state.notifications);
      setLoading(state.loading);
    };
    
    listeners.add(handleUpdate);
    startGlobalPolling();
    
    return () => {
      listeners.delete(handleUpdate);
      stopGlobalPolling();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    updateGlobalNotifications(globalNotifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await api.markNotificationAsRead(id);
    } catch (err) {
      console.warn("Failed to mark notification as read on backend", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    updateGlobalNotifications(globalNotifications.map(n => ({ ...n, isRead: true })));
    try {
      await api.markAllNotificationsAsRead();
    } catch (err) {
      console.warn("Failed to mark all notifications as read on backend", err);
    }
  };

  const handleDelete = async (id: string) => {
    updateGlobalNotifications(globalNotifications.filter(n => n.id !== id));
    try {
      await api.deleteNotification(id);
    } catch (err) {
      console.warn("Failed to delete notification on backend", err);
    }
  };

  const handleClearAll = async () => {
    updateGlobalNotifications([]);
    try {
      await api.clearAllNotifications();
    } catch (err) {
      console.warn("Failed to clear notifications on backend", err);
    }
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all active:scale-95 group relative text-zinc-400 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 group-hover:scale-115 transition-transform" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center px-1 text-[9px] font-black text-black">
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && coords && createPortal(
        <div 
          ref={portalRef}
          style={{ position: 'fixed', top: `${coords.top}px`, right: `${coords.right}px` }}
          className="w-80 sm:w-96 glass-panel-dark border border-white/10 rounded-[1.5rem] p-4 shadow-2xl animate-ios-slide-up z-[9999] max-h-[500px] flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3 shrink-0">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Notification Protocol</p>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Active Alerts</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-blue-400 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center opacity-50">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hydrating feed...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nominal Status. Feed Clear.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex gap-3 relative group ${
                    item.isRead 
                      ? 'bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100' 
                      : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-xs font-black uppercase tracking-tight truncate ${item.isRead ? 'text-zinc-400' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[8px] font-mono text-zinc-650 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-400 leading-normal mb-2">
                      {item.message}
                    </p>
                    
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark as Read
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors self-start opacity-0 group-hover:opacity-100"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-white/5 pt-3 mt-3 shrink-0 flex justify-between items-center">
              <span className="text-[8px] font-mono text-zinc-650 uppercase">
                {notifications.length} logged events
              </span>
              <button
                onClick={handleClearAll}
                className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear Feed
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationCenter;
