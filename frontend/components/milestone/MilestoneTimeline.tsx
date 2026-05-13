'use client';

import { motion } from 'framer-motion';
import { Milestone, MilestoneStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_ICON: Record<MilestoneStatus, { icon: React.ReactNode; color: string }> = {
  COMPLETED: { icon: <CheckCircle2 size={18} />, color: '#00C951' },
  IN_PROGRESS: { icon: <Clock size={18} />, color: '#00B9D9' },
  PENDING: { icon: <Circle size={18} />, color: '#94a3b8' },
  DELAYED: { icon: <AlertCircle size={18} />, color: '#f59e0b' },
  CANCELLED: { icon: <XCircle size={18} />, color: '#ef4444' },
};

interface Props {
  milestones: Milestone[];
  compact?: boolean;
}

export function MilestoneTimeline({ milestones, compact = false }: Props) {
  if (!milestones.length) {
    return (
      <div className="text-center py-8 text-[rgb(var(--text-muted))] text-sm">
        No milestones defined yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {milestones.map((ms, i) => {
        const { icon, color } = STATUS_ICON[ms.status];
        const isLast = i === milestones.length - 1;

        return (
          <motion.div
            key={ms.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-4"
          >
            {/* Line & Icon */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div style={{ color }}>{icon}</div>
              {!isLast && (
                <div
                  className="w-0.5 flex-1 mt-1"
                  style={{
                    background: ms.status === 'COMPLETED'
                      ? 'rgb(16 185 129 / 0.3)'
                      : 'rgb(var(--border))',
                    minHeight: compact ? '24px' : '32px',
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium leading-tight',
                      ms.status === 'COMPLETED' && 'line-through opacity-70'
                    )}
                  >
                    {ms.title}
                  </p>
                  {ms.description && !compact && (
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{ms.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {ms.actualDate ? (
                    <span className="text-[11px]" style={{ color: '#00C951' }}>
                      ✓ {formatDate(ms.actualDate, 'dd MMM')}
                    </span>
                  ) : ms.targetDate ? (
                    <span className="text-[11px] text-[rgb(var(--text-muted))]">
                      {formatDate(ms.targetDate, 'dd MMM yyyy')}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Weight bar */}
              {!compact && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'rgb(var(--surface-3))' }}>
                    <div
                      className="h-1 rounded-full transition-all duration-500"
                      style={{
                        width: ms.status === 'COMPLETED' ? '100%' : ms.status === 'IN_PROGRESS' ? '50%' : '0%',
                        background: color,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[rgb(var(--text-muted))]">{ms.weight}%</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
