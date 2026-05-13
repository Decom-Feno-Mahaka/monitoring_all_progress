'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { analyticsApi } from '@/lib/api';
import { DashboardStats, HEALTH_CONFIG, CATEGORY_CONFIG, HealthStatus, ProjectCategory } from '@/lib/types';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { formatDate, getDaysRemaining } from '@/lib/utils';
import {
  FolderKanban, TrendingUp, CheckCircle2, Activity, Calendar, Clock,
  BarChart3, ArrowUp, ArrowDown,
} from 'lucide-react';
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-5 skeleton h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="card p-5 skeleton h-64" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const healthData = Object.entries(stats.byHealth || {}).map(([k, v]) => ({
    name: HEALTH_CONFIG[k as HealthStatus]?.label || k, value: v, color: HEALTH_COLORS[k],
  })).filter(d => d.value > 0);

  const categoryData = Object.entries(stats.byCategory || {}).map(([k, v]) => ({
    name: CATEGORY_CONFIG[k as ProjectCategory]?.label || k, value: v, fill: CAT_COLORS[k] || '#94a3b8',
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-[rgb(var(--text-muted))]">Overview all projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <FolderKanban size={20} />, label: 'Total Projects', value: stats.totalProjects, color: '#00B9D9', sub: `${stats.byStatus?.IN_PROGRESS || 0} active` },
          { icon: <TrendingUp size={20} />, label: 'Avg Progress', value: `${stats.avgProgress}%`, color: '#00C951', sub: 'across all projects' },
          { icon: <CheckCircle2 size={20} />, label: 'Done this month', value: stats.completedThisMonth, color: '#f59e0b', sub: 'projects completed' },
          { icon: <Activity size={20} />, label: 'At Risk / Behind', value: (stats.byHealth?.AT_RISK || 0) + (stats.byHealth?.BEHIND || 0), color: '#ef4444', sub: 'need attention' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
                <p className="text-xs font-medium text-[rgb(var(--text-secondary))] mt-0.5">{s.label}</p>
                <p className="text-[11px] text-[rgb(var(--text-muted))] mt-0.5">{s.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
                {s.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Health Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Health Distribution</h2>
          {healthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {healthData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8 }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">No data</div>
          )}
        </motion.div>

        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Projects by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8 }}
                  cursor={{ fill: 'rgb(var(--surface-2))' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">No data</div>
          )}
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activities */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Recent Activities</h2>
          <ActivityFeed activities={stats.recentActivities || []} limit={5} />
        </motion.div>

        {/* Upcoming Milestones */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card p-5">
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
  );
}
