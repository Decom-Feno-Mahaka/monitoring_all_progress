'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { analyticsApi } from '@/lib/api';
import { HEALTH_CONFIG, CATEGORY_CONFIG, HealthStatus, ProjectCategory } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const HEALTH_COLORS: Record<string, string> = {
  ON_TRACK: '#00C951', AT_RISK: '#f59e0b', BEHIND: '#ef4444', COMPLETED: '#00B9D9', ON_HOLD: '#94a3b8',
};

export default function AdminAnalyticsPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [milestoneStats, setMilestoneStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getTrends(30),
      analyticsApi.getHeatmap(90),
      analyticsApi.getMilestones(),
    ]).then(([t, h, m]) => {
      // Process trends data - group by date
      const trendMap: Record<string, { date: string;[key: string]: any }> = {};
      t.data.forEach((s: any) => {
        const date = formatDate(s.takenAt, 'dd/MM');
        if (!trendMap[date]) trendMap[date] = { date };
        trendMap[date][s.project?.name || 'Project'] = s.progress;
      });
      setTrends(Object.values(trendMap).slice(-14));
      setHeatmap(h.data);
      setMilestoneStats(m.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const milestoneData = Object.entries(milestoneStats).map(([k, v]) => ({
    name: k.replace('_', ' '),
    value: v,
    color: k === 'COMPLETED' ? '#00C951' : k === 'IN_PROGRESS' ? '#00B9D9' : k === 'DELAYED' ? '#f59e0b' : k === 'CANCELLED' ? '#ef4444' : '#94a3b8',
  }));

  // Heatmap calendar
  const today = new Date();
  const last90Days = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (89 - i));
    return {
      date: d.toISOString().split('T')[0],
      count: heatmap[d.toISOString().split('T')[0]] || 0,
    };
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-sm text-[rgb(var(--text-muted))]">Project metrics and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Milestone Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Milestone Status</h2>
          {milestoneData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={milestoneData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3} dataKey="value">
                  {milestoneData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">No data</div>
          )}
        </motion.div>

        {/* Progress Trends */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Progress Trends (30 days)</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B9D9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00B9D9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--text-muted))' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgb(var(--surface-0))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[rgb(var(--text-muted))] text-sm">No trend data yet</div>
          )}
        </motion.div>
      </div>

      {/* Activity Heatmap */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card p-5">
        <h2 className="text-sm font-semibold mb-4">Activity Heatmap (Last 90 Days)</h2>
        <div className="flex gap-1 flex-wrap">
          {last90Days.map(d => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count} activities`}
              className="w-3.5 h-3.5 rounded-sm transition-all"
              style={{
                background: d.count === 0
                  ? 'rgb(var(--surface-2))'
                  : d.count <= 2
                    ? 'rgb(0 185 217 / 0.3)'
                    : d.count <= 5
                      ? 'rgb(0 185 217 / 0.6)'
                      : 'rgb(0 185 217)',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-[rgb(var(--text-muted))]">
          <span>Less</span>
          {[0.15, 0.3, 0.6, 1].map(op => (
            <div key={op} className="w-3 h-3 rounded-sm" style={{ background: `rgb(0 185 217 / ${op})` }} />
          ))}
          <span>More</span>
        </div>
      </motion.div>
    </div>
  );
}
