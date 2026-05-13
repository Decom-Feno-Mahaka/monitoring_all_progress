'use client';

import { motion } from 'framer-motion';
import { Activity, ACTIVITY_CONFIG } from '@/lib/types';
import { formatRelative } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  activities: Activity[];
  limit?: number;
}

export function ActivityFeed({ activities, limit = 10 }: Props) {
  const items = activities.slice(0, limit);

  if (!items.length) {
    return (
      <div className="text-center py-8 text-[rgb(var(--text-muted))] text-sm">
        No activities yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((activity, i) => {
        const config = ACTIVITY_CONFIG[activity.type];
        const hasProgress = activity.progressBefore !== null && activity.progressBefore !== undefined
          && activity.progressAfter !== null && activity.progressAfter !== undefined;
        const progressDelta = hasProgress ? (activity.progressAfter! - activity.progressBefore!) : 0;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-3 group"
          >
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
              style={{ background: `${config.color}18`, color: config.color }}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-[rgb(var(--text-muted))] flex-shrink-0 mt-0.5">
                  {formatRelative(activity.createdAt)}
                </span>
              </div>

              {/* Progress delta */}
              {hasProgress && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[11px] text-[rgb(var(--text-muted))]">
                    {activity.progressBefore}%
                  </span>
                  <span className="text-[11px] text-[rgb(var(--text-muted))]">→</span>
                  <span
                    className="text-[11px] font-semibold flex items-center gap-0.5"
                    style={{ color: progressDelta >= 0 ? '#00C951' : '#ef4444' }}
                  >
                    {progressDelta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {activity.progressAfter}%
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: progressDelta >= 0 ? '#00C951' : '#ef4444' }}
                  >
                    ({progressDelta >= 0 ? '+' : ''}{progressDelta}%)
                  </span>
                </div>
              )}

              {/* Evidences */}
              {activity.evidences && activity.evidences.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-[rgb(var(--text-muted))]">📎</span>
                  <span className="text-[11px] text-[rgb(var(--text-muted))]">
                    {activity.evidences.length} attachment{activity.evidences.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}


            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
