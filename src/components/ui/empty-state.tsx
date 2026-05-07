import * as React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: 'journal' | 'tea';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'journal',
  className,
  ...props
}: EmptyStateProps) {
  const isJournal = variant === 'journal';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full mb-4',
          isJournal ? 'bg-journal-primary/10' : 'bg-tea-primary/10'
        )}
      >
        <Icon
          className={cn(
            'h-8 w-8',
            isJournal ? 'text-journal-primary' : 'text-tea-primary'
          )}
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'text-lg font-semibold mb-1',
          isJournal ? 'font-serif' : ''
        )}
      >
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description}
      </p>

      {/* Action */}
      {action && (
        action.href ? (
          <Button variant={isJournal ? 'default' : 'default'} asChild>
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button
            variant={isJournal ? 'default' : 'default'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
