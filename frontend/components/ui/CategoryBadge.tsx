'use client';

import { ProjectCategory, CATEGORY_CONFIG } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  category: ProjectCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryBadge({ category, showIcon = true, size = 'md', className }: Props) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span
      className={cn(
        'badge',
        config.cssClass,
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : '',
        className
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}
