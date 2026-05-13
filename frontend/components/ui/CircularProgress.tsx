'use client';

import { cn } from '@/lib/utils';

interface Props {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  className,
  showLabel = true,
  color,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  const progressColor = color || (
    clamped >= 80 ? '#00C951' :
      clamped >= 50 ? '#00B9D9' :
        clamped >= 25 ? '#f59e0b' :
          '#ef4444'
  );

  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgb(var(--surface-3))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-xs font-bold"
          style={{ color: progressColor }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
