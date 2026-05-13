'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { Project, CATEGORY_CONFIG, HEALTH_CONFIG } from '@/lib/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import {
  Plus, Search, ChevronDown, LayoutGrid, List, RefreshCw,
  FolderKanban, Edit, Trash2, ExternalLink,
} from 'lucide-react';
import { formatRelative, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [health, setHealth] = useState('ALL');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getAll({
        ...(search && { search }),
        ...(category !== 'ALL' && { category }),
        ...(health !== 'ALL' && { healthStatus: health }),
        page, limit: 12,
      });
      setProjects(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, category, health, page]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await projectsApi.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTotal(t => t - 1);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-sm text-[rgb(var(--text-muted))]">{total} projects total</p>
        </div>
        <Link href="/admin/projects/new" className="btn-primary">
          <Plus size={16} /> New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
          <input
            className="input-base text-sm"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search projects..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="relative">
          <select
            className="input-base text-xs appearance-none cursor-pointer"
            style={{ paddingRight: '1.75rem', width: 'auto', minWidth: '8rem' }}
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
        </div>
        <div className="relative">
          <select
            className="input-base text-xs appearance-none cursor-pointer"
            style={{ paddingRight: '1.75rem', width: 'auto', minWidth: '7rem' }}
            value={health}
            onChange={e => { setHealth(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Health</option>
            {Object.entries(HEALTH_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgb(var(--surface-0))' }}>
          <button onClick={() => setView('grid')} className={cn('p-2 rounded-lg transition-all', view === 'grid' ? 'bg-[#00B9D9] text-white' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]')}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('list')} className={cn('p-2 rounded-lg transition-all', view === 'list' ? 'bg-[#00B9D9] text-white' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]')}>
            <List size={16} />
          </button>
          <button onClick={fetchProjects} className="p-2 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban size={48} className="mx-auto mb-4 text-[rgb(var(--text-muted))]" />
          <p className="text-[rgb(var(--text-secondary))] mb-4">No projects found</p>
          <Link href="/admin/projects/new" className="btn-primary">
            <Plus size={16} /> Create First Project
          </Link>
        </div>
      ) : view === 'grid' ? (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <div key={project.id} className="relative group">
                <ProjectCard project={project} index={i} isAdmin />
                {/* Admin overlay actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    onClick={e => e.stopPropagation()}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                    style={{ background: 'rgb(var(--surface-1))', color: 'rgb(var(--text-secondary))' }}
                  >
                    <Edit size={13} />
                  </Link>
                  <button
                    onClick={e => { e.preventDefault(); handleDelete(project.id); }}
                    disabled={deleting === project.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all text-red-400 hover:bg-red-500/10"
                    style={{ background: 'rgb(var(--surface-1))' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AnimatePresence>
      ) : (
        // List view
        <div className="space-y-2">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card px-4 py-3 flex items-center gap-4 group"
            >
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span className="text-xl">{CATEGORY_CONFIG[project.category]?.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <HealthBadge status={project.healthStatus} size="sm" />
                  </div>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Updated {formatRelative(project.updatedAt)}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-6">
                <div className="w-28">
                  <ProgressBar value={project.overallProgress} showLabel size="sm" />
                </div>
                <CategoryBadge category={project.category} size="sm" showIcon={false} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="btn-ghost text-xs px-2 py-1.5"
                >
                  <Edit size={13} />
                </Link>
                <Link
                  href={`/projects/${project.slug}`}
                  target="_blank"
                  className="btn-ghost text-xs px-2 py-1.5"
                >
                  <ExternalLink size={13} />
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="btn-ghost text-xs px-2 py-1.5 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-all', page === i + 1 ? 'bg-[#00B9D9] text-white' : 'btn-ghost')}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
