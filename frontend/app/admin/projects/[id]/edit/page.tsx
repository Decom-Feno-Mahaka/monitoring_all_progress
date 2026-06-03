'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { Project, ProjectCategory, ProjectStatus, HealthStatus, ProjectVisibility, CATEGORY_CONFIG } from '@/lib/types';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

const STATUSES: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const HEALTH: HealthStatus[] = ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED', 'ON_HOLD'];

export default function EditProjectPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', category: 'SOFTWARE' as ProjectCategory,
    status: 'PLANNING' as ProjectStatus, healthStatus: 'ON_TRACK' as HealthStatus,
    visibility: 'PUBLIC' as ProjectVisibility, overallProgress: 0,
    startDate: '', targetDate: '', actualEndDate: '', tags: [] as string[], githubRepoUrl: '',
  });

  useEffect(() => {
    projectsApi.getOne(id).then(res => {
      const p: Project = res.data;
      setForm({
        name: p.name, description: p.description || '', category: p.category,
        status: p.status, healthStatus: p.healthStatus, visibility: p.visibility,
        overallProgress: p.overallProgress,
        startDate: p.startDate ? p.startDate.split('T')[0] : '',
        targetDate: p.targetDate ? p.targetDate.split('T')[0] : '',
        actualEndDate: p.actualEndDate ? p.actualEndDate.split('T')[0] : '',
        tags: p.tags, githubRepoUrl: p.githubRepoUrl || '',
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof typeof form, val: any) => setForm(f => ({ ...f, [key]: val }));

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag]);
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await projectsApi.update(id, {
        ...form,
        startDate: form.startDate || undefined,
        targetDate: form.targetDate || undefined,
        actualEndDate: form.actualEndDate || undefined,
        githubRepoUrl: form.githubRepoUrl || undefined,
        overallProgress: Number(form.overallProgress),
      });
      router.push(`/admin/projects/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update');
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-2xl space-y-4"><div className="skeleton h-8 w-1/3" /><div className="card p-6 skeleton h-96" /></div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/projects/${id}`} className="btn-ghost p-2"><ArrowLeft size={16} /></Link>
        <div><h1 className="text-xl font-bold">Edit Project</h1><p className="text-sm text-[rgb(var(--text-muted))]">{form.name}</p></div>
      </div>

      <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 rounded-xl text-sm text-red-400" style={{ background: 'rgb(239 68 68 / 0.08)' }}>{error}</div>}

        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Basic Information</h2>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Project Name *</label>
            <input className="input-base" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Description</label>
            <textarea className="input-base resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Category</label>
              <select className="input-base" value={form.category} onChange={e => set('category', e.target.value as ProjectCategory)}>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Visibility</label>
              <select className="input-base" value={form.visibility} onChange={e => set('visibility', e.target.value as ProjectVisibility)}>
                <option value="PUBLIC">🌐 Public</option>
                <option value="INTERNAL">🔒 Internal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Status & Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Status</label>
              <select className="input-base" value={form.status} onChange={e => set('status', e.target.value as ProjectStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Health</label>
              <select className="input-base" value={form.healthStatus} onChange={e => set('healthStatus', e.target.value as HealthStatus)}>
                {HEALTH.map(h => <option key={h} value={h}>{h.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
              Progress: <span className="text-[#00B9D9] font-bold">{form.overallProgress}%</span>
            </label>
            <input type="range" min={0} max={100} step={5} value={form.overallProgress} onChange={e => set('overallProgress', Number(e.target.value))} className="w-full accent-[#00B9D9]" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Timeline</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['startDate', 'Start Date'], ['targetDate', 'Target Date'], ['actualEndDate', 'Actual End']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">{label}</label>
                <input type="date" className="input-base text-xs" value={(form as any)[key]} onChange={e => set(key as any, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Tags</h2>
          <div className="flex gap-2">
            <input className="input-base flex-1 text-sm" placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
            <button type="button" onClick={addTag} className="btn-ghost px-3"><Plus size={16} /></button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgb(var(--surface-2))' }}>
                  #{tag}
                  <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3">GitHub Integration</h2>
          <input className="input-base" value={form.githubRepoUrl} onChange={e => set('githubRepoUrl', e.target.value)} placeholder="https://github.com/owner/repo" />
        </div>

        <div className="flex gap-3">
          <Link href={`/admin/projects/${id}`} className="btn-ghost flex-1 justify-center">Cancel</Link>
          <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.98 }} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
