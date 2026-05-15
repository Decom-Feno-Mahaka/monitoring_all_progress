'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Project, CATEGORY_CONFIG } from '@/lib/types';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { formatRelative, formatDate, getDaysRemaining } from '@/lib/utils';
import { Calendar, Activity, GitBranch, Clock } from 'lucide-react';

interface Props {
  project: Project;
  index?: number;
  isAdmin?: boolean;
}

export function ProjectCard({ project, index = 0, isAdmin = false }: Props) {
  const daysLeft = project.targetDate ? getDaysRemaining(project.targetDate) : null;
  const href = isAdmin ? `/admin/projects/${project.id}` : `/projects/${project.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <Link href={href} className="block">
        <div className="card p-5 cursor-pointer group">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${getCategoryGradient(project.category)})` }}
              >
                {CATEGORY_CONFIG[project.category].icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-[#00B9D9] transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 line-clamp-2">
                  {project.description || 'No description'}
                </p>
              </div>
            </div>
            <CircularProgress value={project.overallProgress} size={52} strokeWidth={5} />
          </div>

          {/* Progress */}
          <ProgressBar value={project.overallProgress} showLabel={false} size="sm" className="mb-3" />

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <HealthBadge status={project.healthStatus} size="sm" />
            <CategoryBadge category={project.category} size="sm" showIcon={false} />
            {project.status === 'COMPLETED' && (
              <span className="badge" style={{ background: 'rgb(16 185 129 / 0.1)', color: 'rgb(16 185 129)' }}>
                ✓ Done
              </span>
            )}
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {project.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="text-[11px] px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgb(var(--surface-2))', color: 'rgb(var(--text-muted))' }}
                >
                  #{tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ color: 'rgb(var(--text-muted))' }}>
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-[rgb(var(--text-muted))] pt-3 border-t border-[rgb(var(--border))]">
            <div className="flex items-center gap-1">
              <Activity size={11} />
              <span>{project._count?.activities ?? 0} activities</span>
            </div>
            {project.targetDate && (
              <div className="flex items-center gap-1">
                <Clock size={11} />
                <span style={{ color: project.status !== 'COMPLETED' && daysLeft !== null && daysLeft < 0 ? '#ef4444' : project.status !== 'COMPLETED' && daysLeft !== null && daysLeft < 14 ? '#f59e0b' : undefined }}>
                  {project.status === 'COMPLETED'
                    ? 'Selesai'
                    : daysLeft !== null
                      ? daysLeft < 0
                        ? `${Math.abs(daysLeft)}d overdue`
                        : `${daysLeft}d left`
                      : formatDate(project.targetDate)}
                </span>
              </div>
            )}
            {project.milestones && (
              <div className="flex items-center gap-1">
                <Calendar size={11} />
                <span>
                  {project.milestones.filter(m => m.status === 'COMPLETED').length}/{project.milestones.length} milestones
                </span>
              </div>
            )}
          </div>

          {/* Updated */}
          <p className="text-[11px] text-[rgb(var(--text-muted))] mt-2">
            Updated {formatRelative(project.updatedAt)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function getCategoryGradient(cat: string): string {
  const gradients: Record<string, string> = {
    SOFTWARE: 'rgb(0 185 217 / 0.2), rgb(0 185 217 / 0.05)',
    AI_ML: 'rgb(168 85 247 / 0.2), rgb(168 85 247 / 0.05)',
    IOT: 'rgb(34 197 94 / 0.2), rgb(34 197 94 / 0.05)',
    RESEARCH: 'rgb(6 182 212 / 0.2), rgb(6 182 212 / 0.05)',
    DOCUMENTATION: 'rgb(245 158 11 / 0.2), rgb(245 158 11 / 0.05)',
    DEVELOPMENT: 'rgb(249 115 22 / 0.2), rgb(249 115 22 / 0.05)',
    INFRASTRUCTURE: 'rgb(239 68 68 / 0.2), rgb(239 68 68 / 0.05)',
    DESIGN: 'rgb(236 72 153 / 0.2), rgb(236 72 153 / 0.05)',
    OTHER: 'rgb(148 163 184 / 0.2), rgb(148 163 184 / 0.05)',
  };
  return gradients[cat] || gradients.OTHER;
}
