'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from '@/components/project/ProjectCard';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { projectsApi, analyticsApi } from '@/lib/api';
import {
  Project, DashboardStats, CATEGORY_CONFIG, HEALTH_CONFIG,
  HealthStatus, ProjectCategory,
} from '@/lib/types';
import { FolderKanban, TrendingUp, CheckCircle2, Activity, Search, ChevronDown, X, Calendar } from 'lucide-react';
import { cn, getDaysRemaining } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const HEALTH_COLORS: Record<string, string> = {
  ON_TRACK: '#00C951', AT_RISK: '#f59e0b', BEHIND: '#ef4444', COMPLETED: '#00B9D9', ON_HOLD: '#94a3b8',
};

const CAT_COLORS: Record<string, string> = {
  SOFTWARE: '#00B9D9', AI_ML: '#a855f7', IOT: '#22c55e', RESEARCH: '#06b6d4',
  DOCUMENTATION: '#f59e0b', DEVELOPMENT: '#f97316', INFRASTRUCTURE: '#ef4444', DESIGN: '#ec4899', OTHER: '#94a3b8',
};

export default function PublicDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [health, setHealth] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        projectsApi.getPublic({
          ...(search && { search }),
          ...(category !== 'ALL' && { category }),
          ...(health !== 'ALL' && { healthStatus: health }),
          page,
          limit: 9,
        }),
        analyticsApi.getDashboard(),
      ]);
      setProjects(pRes.data.data);
      setTotal(pRes.data.total);
      setTotalPages(pRes.data.totalPages);
      setStats(sRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, category, health, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasFilters = category !== 'ALL' || health !== 'ALL' || search;

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      {/* ─── Executive Hero ─── */}
      <section className="border-b border-[rgb(var(--border))]" style={{ background: 'rgb(var(--surface-0))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Project Progress <span className="gradient-text">Monitor</span>
            </h1>
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-1.5">
              Dashboard monitoring project dari Decom Feno Mahaka untuk memantau progress, aktivitas development, milestone, dan evidence project secara realtime dan dinamis.
            </p>
          </motion.div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <FolderKanban size={18} />, label: 'Total Projects', value: stats.totalProjects, color: '#00B9D9', sub: `${stats.byStatus?.IN_PROGRESS || 0} aktif`, bg: '#dcf1fcff' },
                { icon: <TrendingUp size={18} />, label: 'Rata-rata Progress', value: `${stats.avgProgress}%`, color: '#00A172', sub: 'semua project', bg: '#dffcf4ff' },
                { icon: <CheckCircle2 size={18} />, label: 'Selesai Bulan Ini', value: stats.completedThisMonth, color: '#EB8D00', sub: 'project completed', bg: '#faefe2' },
                { icon: <Activity size={18} />, label: 'Attention Needed', value: (stats.byHealth?.AT_RISK || 0) + (stats.byHealth?.BEHIND || 0), color: '#FF2B3A', sub: 'at risk / behind', bg: '#fcdbdbff' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="card p-4"
                  style={{ background: s.bg, borderColor: 'transparent' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${s.color}20`, color: s.color }}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xl font-bold" style={{ color: '#000000ff' }}>{s.value}</p>
                      <p className="text-xs font-medium leading-tight" style={{ color: '#000000ff' }}>{s.label}</p>
                      <p className="text-[11px]" style={{ color: '#808693ff' }}>{s.sub}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Health Distribution Bar */}
          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 p-3 rounded-xl flex flex-wrap gap-x-5 gap-y-2"
              style={{ background: 'rgb(var(--surface-1))' }}
            >
              <span className="text-xs text-[rgb(var(--text-muted))] self-center">Status:</span>
              {(Object.entries(HEALTH_CONFIG) as [HealthStatus, typeof HEALTH_CONFIG[HealthStatus]][]).map(([k, cfg]) => {
                const count = stats.byHealth?.[k] || 0;
                if (!count) return null;
                return (
                  <button
                    key={k}
                    onClick={() => { setHealth(health === k ? 'ALL' : k); setPage(1); }}
                    className={cn(
                      'flex items-center gap-1.5 text-xs transition-all',
                      health === k ? 'opacity-100 font-semibold' : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full', cfg.dotColor)} />
                    <span>{cfg.label}</span>
                    <span className="font-bold">{count}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Dashboard Widgets ─── */}
      {stats && (() => {
        const healthData = Object.entries(stats.byHealth || {}).map(([k, v]) => ({
          name: HEALTH_CONFIG[k as HealthStatus]?.label || k, value: v as number, color: HEALTH_COLORS[k],
        })).filter(d => d.value > 0);

        const categoryData = Object.entries(stats.byCategory || {}).map(([k, v]) => ({
          name: CATEGORY_CONFIG[k as ProjectCategory]?.label || k, value: v as number, fill: CAT_COLORS[k] || '#94a3b8',
        })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

        return (
          <section className="border-b border-[rgb(var(--border))]" style={{ background: 'rgb(var(--surface-0))' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Health Distribution Pie */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card p-5">
                  <h2 className="text-sm font-semibold mb-4">Health Distribution</h2>
                  {healthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={healthData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                          {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} itemStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">No data</div>
                  )}
                </motion.div>

                {/* Category Bar Chart */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="card p-5">
                  <h2 className="text-sm font-semibold mb-4">Projects by Category</h2>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} width={90} />
                        <Tooltip contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} cursor={{ fill: 'rgb(var(--surface-2))' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">No data</div>
                  )}
                </motion.div>
              </div>

              {/* Activities + Milestones row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Activities */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card p-5">
                  <h2 className="text-sm font-semibold mb-4">Recent Activities</h2>
                  <ActivityFeed activities={stats.recentActivities || []} limit={5} />
                </motion.div>

                {/* Upcoming Milestones */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="card p-5">
                  <h2 className="text-sm font-semibold mb-4">Upcoming Milestones</h2>
                  {stats.upcomingMilestones?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.upcomingMilestones.map(ms => {
                        const days = ms.targetDate ? getDaysRemaining(ms.targetDate) : null;
                        return (
                          <div key={ms.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgb(var(--surface-1))' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[#00B9D9]" style={{ background: 'rgb(0 185 217 / 0.1)' }}>
                              <Calendar size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ms.title}</p>
                              <p className="text-xs text-[rgb(var(--text-muted))] truncate">{(ms as any).project?.name}</p>
                            </div>
                            {days !== null && (
                              <span className="text-xs flex-shrink-0" style={{ color: days < 7 ? '#ef4444' : days < 14 ? '#f59e0b' : '#94a3b8' }}>
                                {days}d
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[rgb(var(--text-muted))] text-sm">No upcoming milestones</div>
                  )}
                </motion.div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ─── Filter + Grid ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none z-10" />
            <input
              className="input-base text-sm"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Cari project, tag..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative">
            <select
              className="input-base text-sm appearance-none pr-7 cursor-pointer"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
            >
              <option value="ALL">Semua Kategori</option>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setCategory('ALL'); setHealth('ALL'); setPage(1); }}
              className="btn-ghost text-xs px-3 flex items-center gap-1.5 text-red-400 hover:bg-red-500/10"
            >
              <X size={13} /> Reset filter
            </button>
          )}
        </div>

        {/* Results info */}
        {!loading && (
          <p className="text-xs text-[rgb(var(--text-muted))] mb-4">
            Menampilkan {projects.length} dari {total} project
            {hasFilters && <span className="text-[#00B9D9]"> (terfilter)</span>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                  <div className="skeleton w-12 h-12 rounded-full" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
                <div className="flex gap-2">
                  <div className="skeleton h-5 w-16 rounded-md" />
                  <div className="skeleton h-5 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <FolderKanban size={48} className="text-[rgb(var(--text-muted))] mb-4 opacity-40" />
            <p className="text-[rgb(var(--text-secondary))] font-medium">Tidak ada project ditemukan</p>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Coba ubah filter pencarian</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${category}-${health}-${search}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-8">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                  page === i + 1 ? 'bg-[#00B9D9] text-white shadow-sm' : 'btn-ghost'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[rgb(var(--text-muted))] mt-10 pb-4">
          DFM Project Monitor · Data diperbarui secara realtime
        </p>
      </section>
    </div>
  );
}
