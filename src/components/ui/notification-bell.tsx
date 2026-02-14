'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, AlertTriangle, Info, AlertCircle, CheckCheck, X } from 'lucide-react';
import { useNotificationsStore, type Notification } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  switch (type) {
    case 'error':
      return <AlertCircle size={14} className="text-error flex-shrink-0" />;
    case 'warning':
      return <AlertTriangle size={14} className="text-warning flex-shrink-0" />;
    case 'info':
      return <Info size={14} className="text-info flex-shrink-0" />;
  }
}

function getTypeBg(type: Notification['type']): string {
  switch (type) {
    case 'error':
      return 'bg-error-surface';
    case 'warning':
      return 'bg-warning-surface';
    case 'info':
      return 'bg-info-surface';
  }
}

export default function NotificationBell() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationsStore();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const count = unreadCount();

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
    // Refetch every 5 minutes
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-sidebar-hover"
        title="Notificacoes"
      >
        <Bell size={18} className="text-sidebar-text" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: 'var(--error)',
              color: '#FFFFFF',
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute left-0 top-full mt-2 w-[340px] z-50 animate-scale-in"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <h3 className="text-sm font-semibold text-text-primary">Notificacoes</h3>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={13} />
                  Marcar lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-bg-hover transition-colors"
              >
                <X size={14} className="text-text-tertiary" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div
                  className="h-5 w-5 rounded-full border-2 border-t-transparent"
                  style={{
                    borderColor: 'var(--text-tertiary)',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
                <Bell size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Nenhuma notificacao</p>
                <p className="text-xs mt-1">Tudo em dia!</p>
              </div>
            )}

            {notifications.length > 0 && (
              <div className="py-1">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      'flex items-start gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-bg-hover',
                      !notification.read && 'bg-bg-hover/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 mt-0.5',
                        getTypeBg(notification.type)
                      )}
                    >
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'text-[13px] font-medium truncate',
                            notification.read ? 'text-text-secondary' : 'text-text-primary'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent)' }}
                          />
                        )}
                      </div>
                      <p className="text-[12px] text-text-secondary mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-text-tertiary mt-1">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border-default">
              <p className="text-[11px] text-text-tertiary text-center">
                {count > 0
                  ? `${count} nao ${count === 1 ? 'lida' : 'lidas'}`
                  : 'Todas lidas'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
