import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-16 flex flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-surface mb-4">
        <Icon size={28} className="text-accent" />
      </div>
      <h2 className="text-heading-2 text-text-primary mb-2">{title}</h2>
      {description && (
        <p className="text-sm text-text-secondary mb-4">{description}</p>
      )}
      {action && action.href && (
        <a href={action.href} className="btn-accent">
          {action.label}
        </a>
      )}
      {action && action.onClick && !action.href && (
        <button onClick={action.onClick} className="btn-accent">
          {action.label}
        </button>
      )}
    </div>
  );
}
