import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ArrowRight } from 'lucide-react';
import { Button } from './button';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: 'journal' | 'tea';
  titleAs?: 'h1' | 'h2' | 'h3';
}

export function SectionHeader({
  title,
  description,
  action,
  variant = 'journal',
  titleAs: TitleTag = 'h2',
  className,
  ...props
}: SectionHeaderProps) {
  const isJournal = variant === 'journal';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {/* Title */}
        <TitleTag
          className={cn(
            'leading-tight',
            isJournal
              ? 'font-serif text-2xl md:text-3xl tracking-tight'
              : 'text-xl md:text-2xl font-semibold'
          )}
        >
          {title}
        </TitleTag>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}

        {/* Underline accent for journal variant */}
        {isJournal && (
          <div className="mt-2 h-0.5 w-12 bg-journal-gold rounded-full" />
        )}
      </div>

      {/* Action */}
      {action && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex-shrink-0 gap-1',
            isJournal ? 'text-journal-primary hover:text-journal-primary' : 'text-tea-primary hover:text-tea-primary'
          )}
          asChild={!!action.href}
          onClick={action.onClick}
        >
          {action.href ? (
            <a href={action.href}>
              {action.label}
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          ) : (
            <>
              {action.label}
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
