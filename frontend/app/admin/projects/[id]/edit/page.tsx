'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { projectsApi, activitiesApi, uploadsApi } from '@/lib/api';
import { Project, ProjectCategory, ProjectStatus, HealthStatus, ProjectVisibility, ProjectPriority, CATEGORY_CONFIG, PRIORITY_CONFIG } from '@/lib/types';
import { ArrowLeft, Save, Plus, X, Link as LinkIcon, FileText, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = Object.entries(CATEGORY_CONFIG);
const STATUSES: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const HEALTH: HealthStatus[] = ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED', 'ON_HOLD'];

type EvidenceType = 'LINK' | 'DOCUMENT' | 'IMAGE';

interface EvidenceItem {
  id: string; // temp local id
  type: EvidenceType;
  title: string;
  url: string;       // for LINK type
  file?: File;       // for DOCUMENT / IMAGE type
  uploading?: boolean;
  uploadedUrl?: string;
  preview?: string;  // data URL preview for images
}

interface Props { params: Promise<{ id: string }> }

export default function EditProjectPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [newEvidType, setNewEvidType] = useState<EvidenceType>('LINK');
  const [newEvidTitle, setNewEvidTitle] = useState('');
  const [newEvidUrl, setNewEvidUrl] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'SOFTWARE' as ProjectCategory,
    status: 'PLANNING' as ProjectStatus,
    healthStatus: 'ON_TRACK' as HealthStatus,
    visibility: 'PUBLIC' as ProjectVisibility,
    priority: 'NORMAL' as ProjectPriority,
    overallProgress: 0,
    startDate: '',
    targetDate: '',
    actualEndDate: '',
    tags: [] as string[],
    githubRepoUrl: '',
  });

  useEffect(() => {
    projectsApi.getOne(id).then(res => {
      const p: Project = res.data;
      setForm({
        name: p.name, description: p.description || '', category: p.category,
        status: p.status, healthStatus: p.healthStatus, visibility: p.visibility, priority: p.priority,
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
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  // ── Evidence handlers ──────────────────────────────
  const addLinkEvidence = () => {
    if (!newEvidTitle.trim() || !newEvidUrl.trim()) return;
    setEvidences(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'LINK',
      title: newEvidTitle.trim(),
      url: newEvidUrl.trim(),
    }]);
    setNewEvidTitle('');
    setNewEvidUrl('');
  };

  const handleFileEvidence = async (e: React.ChangeEvent<HTMLInputElement>, type: 'DOCUMENT' | 'IMAGE') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems: EvidenceItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      type,
      title: file.name,
      url: '',
      file,
      uploading: false,
      preview: type === 'IMAGE' ? URL.createObjectURL(file) : undefined,
    }));
    setEvidences(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removeEvidence = (id: string) => {
    setEvidences(prev => prev.filter(e => e.id !== id));
  };

  // ── Submit ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // 1. Update project
      const payload = {
        ...form,
        startDate: form.startDate || undefined,
        targetDate: form.targetDate || undefined,
        actualEndDate: form.actualEndDate || undefined,
        githubRepoUrl: form.githubRepoUrl || undefined,
        overallProgress: Number(form.overallProgress),
      };
      await projectsApi.update(id, payload);

      // 2. Upload files & attach evidences if any added during edit
      if (evidences.length > 0) {
        // Upload files first
        const uploaded = await Promise.all(evidences.map(async ev => {
          if (ev.type === 'LINK') return ev;
          if (ev.file) {
            try {
              const upRes = await uploadsApi.uploadFile(ev.file);
              return { ...ev, uploadedUrl: upRes.data.url };
            } catch {
              return { ...ev, uploadedUrl: '' };
            }
          }
          return ev;
        }));

        // Create an EVIDENCE_ADDED activity
        const actRes = await activitiesApi.create(id, {
          type: 'EVIDENCE_ADDED',
          title: 'Evidence Ditambahkan (Edit)',
          description: `${uploaded.length} evidence item(s) ditambahkan saat edit project.`,
        });
        const activityId: string = actRes.data.id;

        // Attach evidences to activity
        const evidencePayload = uploaded
          .filter(ev => ev.type === 'LINK' ? !!ev.url : !!ev.uploadedUrl)
          .map(ev => ({
            type: ev.type,
            title: ev.title,
            url: ev.type === 'LINK' ? ev.url : ev.uploadedUrl!,
          }));

        if (evidencePayload.length > 0) {
          await activitiesApi.addEvidence(id, activityId, evidencePayload);
        }
      }

      router.push(`/admin/projects/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to update project'));
      setSaving(false);
    }
  };

  const evidenceTypeIcon = (type: EvidenceType) => {
    if (type === 'IMAGE') return <ImageIcon size={14} />;
    if (type === 'LINK') return <LinkIcon size={14} />;
    return <FileText size={14} />;
  };

  if (loading) return <div className="max-w-2xl space-y-4"><div className="skeleton h-8 w-1/3" /><div className="card p-6 skeleton h-96" /></div>;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/projects/${id}`} className="btn-ghost p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Edit Project</h1>
          <p className="text-sm text-[rgb(var(--text-muted))]">{form.name}</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {error && (
          <div className="p-3 rounded-xl text-sm text-red-400" style={{ background: 'rgb(239 68 68 / 0.08)' }}>
            {error}
          </div>
        )}

        {/* ─── 2-column grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Basic Info */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Basic Information</h2>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Project Name *</label>
                <input
                  className="input-base"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g., AI Document Intelligence Platform"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Description</label>
                <textarea
                  className="input-base resize-none"
                  rows={4}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Brief description of the project..."
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Category</label>
                  <select className="input-base" value={form.category} onChange={e => set('category', e.target.value as ProjectCategory)}>
                    {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Visibility</label>
                  <select className="input-base" value={form.visibility} onChange={e => set('visibility', e.target.value as ProjectVisibility)}>
                    <option value="PUBLIC">🌐 Public</option>
                    <option value="INTERNAL">🔒 Internal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Tingkat Prioritas</label>
                  <select className="input-base" value={form.priority} onChange={e => set('priority', e.target.value as ProjectPriority)}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Status & Progress */}
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
                  <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Health Status</label>
                  <select className="input-base" value={form.healthStatus} onChange={e => set('healthStatus', e.target.value as HealthStatus)}>
                    {HEALTH.map(h => <option key={h} value={h}>{h.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                  Overall Progress: <span className="text-[#00B9D9] font-bold">{form.overallProgress}%</span>
                </label>
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={form.overallProgress}
                  onChange={e => set('overallProgress', Number(e.target.value))}
                  className="w-full accent-[#00B9D9]"
                />
                <div className="flex justify-between text-[11px] text-[rgb(var(--text-muted))] mt-0.5">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Timeline</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Start Date</label>
                  <input type="date" className="input-base" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Target Date</label>
                  <input type="date" className="input-base" value={form.targetDate} onChange={e => set('targetDate', e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">Actual Date</label>
                  <input type="date" className="input-base" value={form.actualEndDate} onChange={e => set('actualEndDate', e.target.value)} />
                </div>
              </div>
            </div>

            {/* GitHub */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3">GitHub Integration</h2>
              <input
                className="input-base"
                value={form.githubRepoUrl}
                onChange={e => set('githubRepoUrl', e.target.value)}
                placeholder="https://github.com/owner/repo"
              />
              <p className="text-[11px] text-[rgb(var(--text-muted))] mt-1.5">Optional — Link a GitHub repo to auto-fetch commit stats</p>
            </div>

          </div>{/* end LEFT */}

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Tags */}
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Tags</h2>
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="Add tag (e.g. Python, React, Docker...)"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button type="button" onClick={addTag} className="btn-ghost px-3">
                  <Plus size={16} />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgb(var(--surface-2))', color: 'rgb(var(--text-secondary))' }}>
                      #{tag}
                      <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}>
                        <X size={11} className="text-[rgb(var(--text-muted))] hover:text-red-400" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence */}
            <div className="card p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Evidence & Lampiran</h2>
                <p className="text-[11px] text-[rgb(var(--text-muted))] mt-0.5">Tambahkan link, dokumen, atau foto sebagai bukti awal project</p>
              </div>

              {/* Type selector */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgb(var(--surface-0))' }}>
                {(['LINK', 'DOCUMENT', 'IMAGE'] as EvidenceType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewEvidType(t)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      newEvidType === t ? 'bg-[#00B9D9] text-white' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]'
                    }`}
                  >
                    {t === 'LINK' && <LinkIcon size={12} />}
                    {t === 'DOCUMENT' && <FileText size={12} />}
                    {t === 'IMAGE' && <ImageIcon size={12} />}
                    {t === 'LINK' ? 'Link' : t === 'DOCUMENT' ? 'Dokumen' : 'Foto'}
                  </button>
                ))}
              </div>

              {/* Link input */}
              {newEvidType === 'LINK' && (
                <div className="space-y-2">
                  <input
                    className="input-base text-sm"
                    placeholder="Judul / nama link"
                    value={newEvidTitle}
                    onChange={e => setNewEvidTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      className="input-base text-sm flex-1"
                      placeholder="https://..."
                      value={newEvidUrl}
                      onChange={e => setNewEvidUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLinkEvidence())}
                    />
                    <button
                      type="button"
                      onClick={addLinkEvidence}
                      disabled={!newEvidTitle || !newEvidUrl}
                      className="btn-primary px-3 text-sm disabled:opacity-40"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Document upload */}
              {newEvidType === 'DOCUMENT' && (
                <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-[rgb(var(--border))] hover:border-[#00B9D9]/50 transition-colors cursor-pointer text-center">
                  <Upload size={24} className="text-[rgb(var(--text-muted))]" />
                  <span className="text-xs text-[rgb(var(--text-secondary))]">Klik untuk pilih dokumen <span className="text-[rgb(var(--text-muted))]">(PDF, DOCX, XLSX, dll)</span></span>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" multiple onChange={e => handleFileEvidence(e, 'DOCUMENT')} />
                </label>
              )}

              {/* Image upload */}
              {newEvidType === 'IMAGE' && (
                <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-[rgb(var(--border))] hover:border-[#00B9D9]/50 transition-colors cursor-pointer text-center">
                  <ImageIcon size={24} className="text-[rgb(var(--text-muted))]" />
                  <span className="text-xs text-[rgb(var(--text-secondary))]">Klik untuk pilih foto <span className="text-[rgb(var(--text-muted))]">(JPG, PNG, WebP)</span></span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleFileEvidence(e, 'IMAGE')} />
                </label>
              )}

              {/* Evidence list */}
              {evidences.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-[rgb(var(--text-muted))]">{evidences.length} item akan dilampirkan</p>
                  {evidences.map(ev => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl"
                      style={{ background: 'rgb(var(--surface-1))' }}
                    >
                      {ev.type === 'IMAGE' && ev.preview ? (
                        <img src={ev.preview} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[#00B9D9]" style={{ background: 'rgb(0 185 217 / 0.1)' }}>
                          {evidenceTypeIcon(ev.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{ev.title}</p>
                        <p className="text-[11px] text-[rgb(var(--text-muted))] truncate">
                          {ev.type === 'LINK' ? ev.url : ev.file ? `${(ev.file.size / 1024).toFixed(0)} KB` : ''}
                        </p>
                      </div>
                      <button type="button" onClick={() => removeEvidence(ev.id)} className="text-[rgb(var(--text-muted))] hover:text-red-400 transition-colors flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>{/* end RIGHT */}
        </div>{/* end grid */}

        {/* Submit — full width */}
        <div className="flex gap-3">
          <Link href="/admin/projects" className="btn-ghost flex-1 justify-center">Cancel</Link>
          <motion.button
            type="submit"
            disabled={saving || !form.name}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                {evidences.length > 0 ? 'Uploading evidence & Saving...' : 'Saving...'}
              </span>
            ) : (
              <><Save size={16} /> Save Changes {evidences.length > 0 && `(+${evidences.length} evidence)`}</>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

