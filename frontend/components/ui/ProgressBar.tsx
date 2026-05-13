'use client';

import { cn, getProgressColor } from '@/lib/utils';

interface Props {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({ value, size = 'md', showLabel = true, animated = true, className }: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const color = getProgressColor(clamped);

  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[rgb(var(--text-muted))]">Progress</span>
          <span className="text-sm font-semibold" style={{ color }}>{clamped}%</span>
        </div>
      )}
      <div className={cn('progress-track', heights[size])}>
        <div
          className={cn('progress-fill', animated ? 'transition-all duration-1000' : '')}
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          }}
        />
      </div>
    </div>
  );
}
