import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // Scholar's Tea rank badges
        'rank-gold': 'border-transparent bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-700 border-yellow-400/50',
        'rank-silver': 'border-transparent bg-gradient-to-r from-slate-300/30 to-slate-400/30 text-slate-700 border-slate-400/50',
        'rank-bronze': 'border-transparent bg-gradient-to-r from-orange-400/20 to-amber-700/20 text-amber-800 border-orange-400/50',
        // Scholar's Tea zone badges
        journal: 'border-transparent bg-journal-primary/10 text-journal-primary border-journal-primary/30',
        tea: 'border-transparent bg-tea-primary/10 text-tea-primary border-tea-primary/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
