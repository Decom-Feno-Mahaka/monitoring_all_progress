'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { projectsApi, activitiesApi } from '@/lib/api';
import { Project, Activity, CATEGORY_CONFIG, HEALTH_CONFIG } from '@/lib/types';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { MilestoneManager } from '@/components/admin/MilestoneManager';
import { ActivityLogger } from '@/components/admin/ActivityLogger';
import {
  ArrowLeft, Edit, ExternalLink, RefreshCw,
  AlertCircle, Calendar, Clock, Target, GitBranch, Star,
  GitCommit, GitPullRequest, TrendingUp, Save, Activity as ActivityIcon,
  Flag, Settings, LayoutDashboard,
} from 'lucide-react';
import { formatDate, getDaysRemaining, getProgressColor } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'milestones' | 'activities' | 'settings';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminProjectDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [quickProgress, setQuickProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressChanged, setProgressChanged] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await projectsApi.getOne(id);
      setProject(res.data);
      setActivities(res.data.activities || []);
      setQuickProgress(res.data.overallProgress);
      setProgressChanged(false);
    } catch { }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleProgressChange = (val: number) => {
    setQuickProgress(val);
    setProgressChanged(val !== project?.overallProgress);
  };

  const handleSaveProgress = async () => {
    if (!project || !progressChanged) return;
    setSavingProgress(true);
    try {
      await projectsApi.update(id, { overallProgress: quickProgress });
      await fetchProject();
    } catch { }
    setSavingProgress(false);
  };

  if (loading) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton h-7 w-64" />
        </div>
        <div className="card p-6 skeleton h-44" />
        <div className="card p-6 skeleton h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-[rgb(var(--text-muted))] mb-4" />
        <p className="text-[rgb(var(--text-secondary))] mb-4">Project tidak ditemukan</p>
        <Link href="/admin/projects" className="btn-ghost">← Kembali</Link>
      </div>
    );
  }

  const daysLeft = project.targetDate ? getDaysRemaining(project.targetDate) : null;
  const progressColor = getProgressColor(quickProgress);
  const progressData = (project.progressSnapshots || []).slice(-14).map(s => ({
    date: formatDate(s.takenAt, 'dd/MM'),
    progress: s.progress,
  }));
  const completedMilestones = (project.milestones || []).filter(m => m.status === 'COMPLETED').length;
  const totalMilestones = (project.milestones || []).length;

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'overview', icon: <LayoutDashboard size={14} />, label: 'Overview' },
    { key: 'milestones', icon: <Flag size={14} />, label: `Milestones (${completedMilestones}/${totalMilestones})` },
    { key: 'activities', icon: <ActivityIcon size={14} />, label: `Activities (${activities.length})` },
    { key: 'settings', icon: <Settings size={14} />, label: 'Settings' },
  ];

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/projects" className="btn-ghost p-2 flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <HealthBadge status={project.healthStatus} size="sm" />
              <CategoryBadge category={project.category} size="sm" />
              {project.status === 'COMPLETED' && (
                <span className="badge text-xs" style={{ background: 'rgb(16 185 129 / 0.12)', color: '#00C951' }}>✓ Completed</span>
              )}
            </div>
            <h1 className="text-lg font-bold mt-1 leading-tight">{project.name}</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href={`/projects/${project.slug}`}
            target="_blank"
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <ExternalLink size={13} /> Public View
          </a>
          <Link href={`/admin/projects/${id}/edit`} className="btn-primary text-xs px-3 py-1.5">
            <Edit size={13} /> Edit Project
          </Link>
        </div>
      </div>

      {/* Progress Control Card */}
      <div className="card p-5">
        <div className="flex items-start gap-5">
          {/* Circular progress */}
          <div className="flex-shrink-0">
            <CircularProgress value={quickProgress} size={80} strokeWidth={7} color={progressColor} />
          </div>

          {/* Slider + Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold">Update Progress</p>
                <p className="text-xs text-[rgb(var(--text-muted))]">Geser slider untuk memperbarui</p>
              </div>
              <AnimatePresence>
                {progressChanged && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleSaveProgress}
                    disabled={savingProgress}
                    className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                  >
                    {savingProgress
                      ? <><RefreshCw size={12} className="animate-spin" /> Saving...</>
                      : <><Save size={12} /> Simpan {quickProgress}%</>
                    }
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <input
              type="range" min={0} max={100} step={5}
              value={quickProgress}
              onChange={e => handleProgressChange(Number(e.target.value))}
              className="w-full mb-3"
              style={{ accentColor: progressColor }}
            />

            <div className="flex flex-wrap gap-2">
              {daysLeft !== null && project.status !== 'COMPLETED' && (
                <StatPill
                  icon={<Clock size={11} />}
                  label={daysLeft < 0 ? `${Math.abs(daysLeft)}h overdue` : `${daysLeft}h tersisa`}
                  color={daysLeft < 0 ? '#ef4444' : daysLeft < 14 ? '#f59e0b' : '#94a3b8'}
                />
              )}
              {daysLeft !== null && project.status === 'COMPLETED' && (
                <StatPill
                  icon={<Clock size={11} />}
                  label="Selesai"
                  color="#00C951"
                />
              )}
              {project.startDate && (
                <StatPill icon={<Calendar size={11} />} label={`Mulai ${formatDate(project.startDate, 'dd MMM yyyy')}`} />
              )}
              {totalMilestones > 0 && (
                <StatPill
                  icon={<Target size={11} />}
                  label={`${completedMilestones}/${totalMilestones} milestones`}
                  color={completedMilestones === totalMilestones ? '#00C951' : undefined}
                />
              )}
              <StatPill icon={<ActivityIcon size={11} />} label={`${activities.length} aktivitas`} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'rgb(var(--surface-0))' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              tab === t.key
                ? 'bg-[#00B9D9] text-white shadow-sm'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Description */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-2">Deskripsi Project</h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                {project.description || <span className="italic text-[rgb(var(--text-muted))]">Tidak ada deskripsi</span>}
              </p>
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[rgb(var(--border))]">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgb(var(--surface-2))', color: 'rgb(var(--text-muted))' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Chart */}
            {progressData.length > 1 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-4">Riwayat Progress (14 hari terakhir)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="pg_admin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={progressColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={progressColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [`${v}%`, 'Progress']}
                    />
                    <Area type="monotone" dataKey="progress" stroke={progressColor} strokeWidth={2} fill="url(#pg_admin)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* GitHub Stats */}
            {project.githubIntegration && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <GitBranch size={14} /> GitHub Stats
                  </h3>
                  {project.githubRepoUrl && (
                    <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#00B9D9] hover:text-[#009BB8] flex items-center gap-1">
                      <ExternalLink size={11} /> Buka Repo
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <GitCommit size={15} />, label: 'Commits', value: project.githubIntegration.commitCount, color: '#00B9D9' },
                    { icon: <GitPullRequest size={15} />, label: 'Open PRs', value: project.githubIntegration.openPRs, color: '#a855f7' },
                    { icon: <AlertCircle size={15} />, label: 'Issues', value: project.githubIntegration.openIssues, color: '#f59e0b' },
                    { icon: <Star size={15} />, label: 'Stars', value: project.githubIntegration.stars, color: '#f97316' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'rgb(var(--surface-1))' }}>
                      <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-[11px] text-[rgb(var(--text-muted))]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activities Preview */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Aktivitas Terbaru</h3>
                <button onClick={() => setTab('activities')} className="text-xs text-[#00B9D9] hover:text-[#009BB8]">
                  Lihat semua ({activities.length}) →
                </button>
              </div>
              {activities.slice(0, 3).length === 0 ? (
                <p className="text-xs text-[rgb(var(--text-muted))] text-center py-4">Belum ada aktivitas</p>
              ) : (
                <div className="space-y-2">
                  {activities.slice(0, 3).map(act => {
                    const c = ACTIVITY_CONFIG_ICONS[act.type] || { icon: '📝', color: '#94a3b8' };
                    return (
                      <div key={act.id} className="flex items-center gap-3 py-2 border-b border-[rgb(var(--border))] last:border-0">
                        <span className="text-base">{c.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{act.title}</p>
                          <p className="text-[11px] text-[rgb(var(--text-muted))]">{formatDate(act.createdAt, 'dd MMM yyyy')}</p>
                        </div>
                        {act.progressAfter != null && (
                          <span className="text-xs font-semibold" style={{ color: '#00C951' }}>{act.progressAfter}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* === MILESTONES TAB === */}
        {tab === 'milestones' && (
          <motion.div key="milestones" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card p-5">
              <MilestoneManager
                projectId={id}
                milestones={project.milestones || []}
                onRefresh={fetchProject}
              />
            </div>
          </motion.div>
        )}

        {/* === ACTIVITIES TAB === */}
        {tab === 'activities' && (
          <motion.div key="activities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card p-5">
              <ActivityLogger
                projectId={id}
                currentProgress={project.overallProgress}
                activities={activities}
                onRefresh={fetchProject}
              />
            </div>
          </motion.div>
        )}

        {/* === SETTINGS TAB === */}
        {tab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Project Settings</h3>

              {/* Quick info */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Project ID', value: project.id, mono: true },
                  { label: 'Slug', value: project.slug, mono: true },
                  { label: 'Visibility', value: project.visibility },
                  { label: 'Dibuat oleh', value: project.createdBy?.name || '-' },
                  { label: 'Tanggal dibuat', value: formatDate(project.createdAt) },
                  { label: 'Terakhir diupdate', value: formatDate(project.updatedAt) },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: 'rgb(var(--surface-1))' }}>
                    <p className="text-[11px] text-[rgb(var(--text-muted))]">{label}</p>
                    <p className={cn('text-xs mt-0.5 truncate', mono && 'font-mono')}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link href={`/admin/projects/${id}/edit`} className="btn-primary flex-1 justify-center">
                  <Edit size={14} /> Edit Project
                </Link>
                <a href={`/projects/${project.slug}`} target="_blank" className="btn-ghost flex-1 justify-center">
                  <ExternalLink size={14} /> Public View
                </a>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card p-5 border border-red-500/20">
              <h3 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>
              <p className="text-xs text-[rgb(var(--text-muted))] mb-3">
                Menghapus project akan menghapus semua milestone, aktivitas, dan evidence secara permanen.
              </p>
              <button
                onClick={async () => {
                  if (!confirm(`Hapus project "${project.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
                  await projectsApi.delete(id);
                  router.push('/admin/projects');
                }}
                className="text-xs px-4 py-2 rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              >
                Hapus Project Ini
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple stat pill
function StatPill({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
      style={{ background: 'rgb(var(--surface-2))', color: color || 'rgb(var(--text-muted))' }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

// Inline activity icons (avoid importing the full config again)
const ACTIVITY_CONFIG_ICONS: Record<string, { icon: string; color: string }> = {
  UPDATE: { icon: '📝', color: '#3b82f6' },
  MILESTONE_REACHED: { icon: '🏆', color: '#00C951' },
  EVIDENCE_ADDED: { icon: '📎', color: '#00B9D9' },
  STATUS_CHANGED: { icon: '🔄', color: '#f59e0b' },
  PROGRESS_UPDATE: { icon: '📈', color: '#00C951' },
  NOTE: { icon: '💬', color: '#94a3b8' },
  MEETING: { icon: '🤝', color: '#8b5cf6' },
  DEPLOYMENT: { icon: '🚀', color: '#06b6d4' },
  REVIEW: { icon: '👁️', color: '#f97316' },
};
