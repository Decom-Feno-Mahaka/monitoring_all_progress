'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { Project, Activity, CATEGORY_CONFIG, HEALTH_CONFIG } from '@/lib/types';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { MilestoneTimeline } from '@/components/milestone/MilestoneTimeline';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { formatDate, formatRelative, getDaysRemaining } from '@/lib/utils';
import {
  ArrowLeft, Calendar, Clock, GitBranch, Star,
  GitCommit, GitPullRequest, ExternalLink, AlertCircle,
  Paperclip, Link as LinkIcon, FileText, Image,
  Target, Activity as ActivityIcon, Flag,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'milestones' | 'activities';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function PublicProjectPage({ params }: Props) {
  const { slug } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    projectsApi.getPublicOne(slug)
      .then(res => {
        setProject(res.data);
        setActivities(res.data.activities || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <PublicNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="skeleton h-8 w-1/2 rounded-xl" />
          <div className="card p-6 skeleton h-48" />
          <div className="card p-6 skeleton h-64" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen">
        <PublicNavbar />
        <div className="flex flex-col items-center justify-center py-24">
          <AlertCircle size={48} className="text-[rgb(var(--text-muted))] mb-4" />
          <h2 className="text-lg font-bold mb-2">Project tidak ditemukan</h2>
          <Link href="/" className="btn-ghost mt-2">← Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  const daysLeft = project.targetDate ? getDaysRemaining(project.targetDate) : null;
  const progressData = (project.progressSnapshots || []).slice(-14).map(s => ({
    date: formatDate(s.takenAt, 'dd/MM'),
    progress: s.progress,
  }));
  const completedMilestones = (project.milestones || []).filter(m => m.status === 'COMPLETED').length;

  // Collect all evidences from activities
  const allEvidences = activities.flatMap(a =>
    (a.evidences || []).map(ev => ({ ...ev, activityTitle: a.title, activityDate: a.createdAt }))
  );

  const tabs = [
    { key: 'overview' as Tab, icon: '📊', label: 'Overview' },
    { key: 'milestones' as Tab, icon: '🏁', label: `Milestones (${completedMilestones}/${project.milestones?.length || 0})` },
    { key: 'activities' as Tab, icon: '📋', label: `Aktivitas (${activities.length})` },
  ];

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        {/* ─── Project Header Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-5"
        >
          <div className="flex items-start gap-4">
            {/* Left: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <HealthBadge status={project.healthStatus} />
                <CategoryBadge category={project.category} />
                {project.status === 'COMPLETED' && (
                  <span className="badge text-xs" style={{ background: 'rgb(16 185 129 / 0.12)', color: '#00C951' }}>
                    ✓ Completed
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold leading-tight mb-2">{project.name}</h1>

              {project.description && (
                <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed mb-3">
                  {project.description}
                </p>
              )}

              {/* Tags */}
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: 'rgb(var(--surface-2))', color: 'rgb(var(--text-muted))' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Circular Progress */}
            <div className="flex-shrink-0">
              <CircularProgress value={project.overallProgress} size={88} strokeWidth={7} />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <ProgressBar value={project.overallProgress} size="lg" />
          </div>

          {/* Meta info pills */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--text-muted))]">
            {project.startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>Mulai {formatDate(project.startDate)}</span>
              </div>
            )}
            {project.targetDate && (
              <div
                className="flex items-center gap-1.5"
                style={{
                  color: daysLeft !== null && daysLeft < 0 ? '#ef4444'
                    : daysLeft !== null && daysLeft < 14 ? '#f59e0b'
                      : undefined
                }}
              >
                <Clock size={12} />
                <span>
                  {daysLeft !== null
                    ? daysLeft < 0 ? `${Math.abs(daysLeft)} hari terlambat`
                      : daysLeft === 0 ? 'Jatuh tempo hari ini'
                        : `${daysLeft} hari tersisa`
                    : formatDate(project.targetDate)}
                </span>
              </div>
            )}
            {project.milestones && (
              <div className="flex items-center gap-1.5">
                <Target size={12} />
                <span>{completedMilestones}/{project.milestones.length} milestones selesai</span>
              </div>
            )}
            {activities.length > 0 && (
              <div className="flex items-center gap-1.5">
                <ActivityIcon size={12} />
                <span>{activities.length} aktivitas</span>
              </div>
            )}
          </div>

          {/* GitHub Stats */}
          {project.githubIntegration && (
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-[rgb(var(--border))]">
              {[
                { icon: <GitCommit size={12} />, val: project.githubIntegration.commitCount, label: 'commits', color: '#00B9D9' },
                { icon: <GitPullRequest size={12} />, val: project.githubIntegration.openPRs, label: 'open PRs', color: '#a855f7' },
                { icon: <Star size={12} />, val: project.githubIntegration.stars, label: 'stars', color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-xs" style={{ color: s.color }}>
                  {s.icon}
                  <span className="font-semibold text-[rgb(var(--text-primary))]">{s.val}</span>
                  <span className="text-[rgb(var(--text-muted))]">{s.label}</span>
                </div>
              ))}
              {project.githubRepoUrl && (
                <a
                  href={project.githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#00B9D9] hover:text-[#009BB8] transition-colors ml-auto"
                >
                  <GitBranch size={12} /> GitHub <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
        </motion.div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgb(var(--surface-0))' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                tab === t.key
                  ? 'bg-[#00B9D9] text-white shadow-sm'
                  : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
              )}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Progress Trend */}
              {progressData.length > 1 && (
                <div className="card p-5">
                  <h2 className="text-sm font-semibold mb-4">Tren Progress</h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient id="pub_pg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00B9D9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00B9D9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: any) => [`${v}%`, 'Progress']}
                      />
                      <Area type="monotone" dataKey="progress" stroke="#00B9D9" strokeWidth={2} fill="url(#pub_pg)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Milestone Summary */}
              {project.milestones && project.milestones.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold">Milestones</h2>
                    <button
                      onClick={() => setTab('milestones')}
                      className="text-xs text-[#00B9D9] hover:text-[#009BB8] transition-colors"
                    >
                      Lihat semua →
                    </button>
                  </div>
                  <MilestoneTimeline milestones={project.milestones.slice(0, 4)} compact />
                </div>
              )}

              {/* Evidence Gallery */}
              {allEvidences.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-semibold mb-4">Evidence & Lampiran ({allEvidences.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allEvidences.map(ev => (
                      <a
                        key={ev.id}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors group"
                        style={{ background: 'rgb(var(--surface-1))' }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgb(0 185 217 / 0.1)', color: '#00B9D9' }}
                        >
                          {ev.type === 'IMAGE' ? <Image size={15} /> : ev.type === 'LINK' ? <LinkIcon size={15} /> : <FileText size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate group-hover:text-[#00B9D9] transition-colors">{ev.title}</p>
                          <p className="text-[11px] text-[rgb(var(--text-muted))] truncate">{ev.activityTitle}</p>
                        </div>
                        <ExternalLink size={12} className="text-[rgb(var(--text-muted))] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold">Aktivitas Terbaru</h2>
                  {activities.length > 3 && (
                    <button
                      onClick={() => setTab('activities')}
                      className="text-xs text-[#00B9D9] hover:text-[#009BB8] transition-colors"
                    >
                      Lihat semua →
                    </button>
                  )}
                </div>
                <ActivityFeed activities={activities.slice(0, 3)} />
              </div>
            </motion.div>
          )}

          {/* MILESTONES */}
          {tab === 'milestones' && (
            <motion.div key="milestones" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-5">Semua Milestones</h2>
                <MilestoneTimeline milestones={project.milestones || []} />
              </div>
            </motion.div>
          )}

          {/* ACTIVITIES */}
          {tab === 'activities' && (
            <motion.div key="activities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-5">Semua Aktivitas</h2>
                <ActivityFeed activities={activities} limit={50} />

                {/* Evidence Section */}
                {allEvidences.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-[rgb(var(--border))]">
                    <h3 className="text-sm font-semibold mb-3">Semua Evidence ({allEvidences.length})</h3>
                    <div className="space-y-1.5">
                      {allEvidences.map(ev => (
                        <a
                          key={ev.id}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors group"
                        >
                          <Paperclip size={13} className="text-[#00B9D9] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium group-hover:text-[#00B9D9] transition-colors">{ev.title}</span>
                            <span className="text-[11px] text-[rgb(var(--text-muted))] ml-2">
                              dari "{ev.activityTitle}" · {formatDate(ev.activityDate, 'dd MMM yyyy')}
                            </span>
                          </div>
                          <ExternalLink size={11} className="text-[rgb(var(--text-muted))] opacity-0 group-hover:opacity-100 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
