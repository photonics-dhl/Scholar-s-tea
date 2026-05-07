import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const skeletonVariants = cva('rounded-md', {
  variants: {
    variant: {
      default: 'animate-pulse bg-muted',
      shimmer: 'animate-shimmer bg-muted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function Skeleton({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

// Skeleton group for message-like content
function MessageSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex gap-3', className)} {...props}>
      <Skeleton variant="shimmer" className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton variant="shimmer" className="h-4 w-32" />
        <Skeleton variant="shimmer" className="h-16 w-full" />
      </div>
    </div>
  );
}

// Card skeleton for content cards
function CardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-lg border bg-card p-5 flex flex-col gap-3', className)} {...props}>
      <div className="flex gap-3">
        <Skeleton variant="shimmer" className="h-9 w-9 rounded-lg" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton variant="shimmer" className="h-5 w-3/4" />
          <Skeleton variant="shimmer" className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton variant="shimmer" className="h-12 w-full" />
      <div className="flex gap-4">
        <Skeleton variant="shimmer" className="h-3 w-16" />
        <Skeleton variant="shimmer" className="h-3 w-16" />
      </div>
    </div>
  );
}

export { Skeleton, MessageSkeleton, CardSkeleton };
