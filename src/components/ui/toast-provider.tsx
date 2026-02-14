'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/toast-store';

export default function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: (id: string) => void;
}

function ToastItem({ id, message, type, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const icons = {
    success: <CheckCircle size={18} className="text-success" />,
    error: <XCircle size={18} className="text-error" />,
    info: <Info size={18} className="text-info" />,
  };

  const borders = {
    success: 'border-l-[3px] border-l-success',
    error: 'border-l-[3px] border-l-error',
    info: 'border-l-[3px] border-l-info',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl bg-bg-card px-4 py-3 animate-slide-up',
        'border border-border-default',
        borders[type]
      )}
      style={{ boxShadow: 'var(--shadow-lg)', minWidth: 280 }}
    >
      {icons[type]}
      <p className="flex-1 text-sm text-text-primary">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-text-tertiary hover:text-text-primary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
