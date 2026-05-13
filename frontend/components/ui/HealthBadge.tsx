'use client';

import { HealthStatus, HEALTH_CONFIG } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  status: HealthStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function HealthBadge({ status, size = 'md', className }: Props) {
  const config = HEALTH_CONFIG[status];
  return (
    <span
      className={cn(
        'badge',
        config.bgClass,
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : '',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
