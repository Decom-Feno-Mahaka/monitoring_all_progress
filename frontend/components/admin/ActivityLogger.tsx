'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ACTIVITY_CONFIG, ActivityType } from '@/lib/types';
import { activitiesApi, uploadsApi } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import {
  Plus, Trash2, X, Save, Paperclip, Link, Upload,
  TrendingUp, TrendingDown, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
  currentProgress: number;
  activities: Activity[];
  onRefresh: () => void;
}

export function ActivityLogger({ projectId, currentProgress, activities, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'UPDATE' as ActivityType,
    title: '',
    description: '',
    updateProgress: false,
    progressAfter: currentProgress,
  });

  const [evidences, setEvidences] = useState<
    { type: 'LINK' | 'FILE'; title: string; url: string; uploading?: boolean }[]
  >([]);
  const [newEvidence, setNewEvidence] = useState({ title: '', url: '' });

  const progressDelta = form.progressAfter - currentProgress;

  const handleAddLinkEvidence = () => {
    if (!newEvidence.title || !newEvidence.url) return;
    setEvidences(prev => [...prev, { type: 'LINK', ...newEvidence }]);
    setNewEvidence({ title: '', url: '' });
  };

  const handleFileUpload = async (file: File) => {
    const placeholder = { type: 'FILE' as const, title: file.name, url: '', uploading: true };
    setEvidences(prev => [...prev, placeholder]);
    try {
      const res = await uploadsApi.uploadFile(file);
      const url = res.data.url;
      setEvidences(prev =>
        prev.map(e => (e.uploading && e.title === file.name ? { ...e, url, uploading: false } : e))
      );
    } catch {
      setEvidences(prev => prev.filter(e => !(e.uploading && e.title === file.name)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    try {
      const activityRes = await activitiesApi.create(projectId, {
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        progressBefore: form.updateProgress ? currentProgress : undefined,
        progressAfter: form.updateProgress ? form.progressAfter : undefined,
      });

      if (evidences.length > 0 && activityRes.data?.id) {
        await activitiesApi.addEvidence(
          projectId,
          activityRes.data.id,
          evidences
            .filter(e => e.url && !e.uploading)
            .map(e => ({ type: e.type, title: e.title, url: e.url }))
        );
      }

      setForm({ type: 'UPDATE', title: '', description: '', updateProgress: false, progressAfter: currentProgress });
      setEvidences([]);
      setShowForm(false);
      onRefresh();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus aktivitas ini?')) return;
    setDeletingId(id);
    try {
      await activitiesApi.delete(projectId, id);
      onRefresh();
    } catch (e) { console.error(e); }
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Activity Log</h3>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{activities.length} aktivitas tercatat</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs px-3 py-1.5">
          <Plus size={13} /> Log Aktivitas
        </button>
      </div>

      {/* Log Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            onSubmit={handleSubmit}
            className="p-4 rounded-xl space-y-3 border border-[#00B9D9]/30"
            style={{ background: 'rgb(0 185 217 / 0.05)' }}
          >
            <p className="text-xs font-semibold text-[#00B9D9]">Catat Aktivitas Baru</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-[rgb(var(--text-secondary))]">Tipe</label>
                <select
                  className="input-base text-sm"
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as ActivityType }))}
                >
                  {Object.entries(ACTIVITY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[rgb(var(--text-secondary))]">Judul *</label>
                <input
                  className="input-base text-sm"
                  placeholder="Apa yang terjadi?"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-[rgb(var(--text-secondary))]">Deskripsi</label>
              <textarea
                className="input-base text-sm resize-none"
                rows={2}
                placeholder="Detail lebih lanjut..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Progress Update Toggle */}
            <div
              className="p-3 rounded-xl cursor-pointer"
              style={{ background: 'rgb(var(--surface-2))' }}
              onClick={() => setForm(p => ({ ...p, updateProgress: !p.updateProgress }))}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Update Progress Project</span>
                <div className={cn(
                  'w-8 h-4 rounded-full transition-all relative',
                  form.updateProgress ? 'bg-[#00B9D9]' : 'bg-[rgb(var(--surface-3))]'
                )}>
                  <div className={cn(
                    'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all',
                    form.updateProgress ? 'left-4' : 'left-0.5'
                  )} />
                </div>
              </div>
              {form.updateProgress && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      {currentProgress}% →
                    </span>
                    <span
                      className="text-sm font-bold flex items-center gap-1"
                      style={{ color: progressDelta >= 0 ? '#00C951' : '#ef4444' }}
                    >
                      {progressDelta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {form.progressAfter}%
                      <span className="text-xs font-normal">
                        ({progressDelta >= 0 ? '+' : ''}{progressDelta}%)
                      </span>
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5}
                    className="w-full accent-[#00B9D9]"
                    value={form.progressAfter}
                    onChange={e => setForm(p => ({ ...p, progressAfter: Number(e.target.value) }))}
                  />
                </div>
              )}
            </div>

            {/* Evidence Section */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                Evidence / Lampiran
              </p>

              {/* Existing evidences */}
              {evidences.length > 0 && (
                <div className="space-y-1">
                  {evidences.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: 'rgb(var(--surface-2))' }}
                    >
                      {e.type === 'LINK' ? <Link size={12} /> : <Paperclip size={12} />}
                      <span className="flex-1 truncate">{e.title}</span>
                      {e.uploading && (
                        <span className="text-[rgb(var(--text-muted))]">uploading...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setEvidences(prev => prev.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Link */}
              <div className="flex gap-2">
                <input
                  className="input-base text-xs flex-1"
                  placeholder="Judul link"
                  value={newEvidence.title}
                  onChange={e => setNewEvidence(p => ({ ...p, title: e.target.value }))}
                />
                <input
                  className="input-base text-xs flex-1"
                  placeholder="https://..."
                  value={newEvidence.url}
                  onChange={e => setNewEvidence(p => ({ ...p, url: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={handleAddLinkEvidence}
                  disabled={!newEvidence.title || !newEvidence.url}
                  className="btn-ghost text-xs px-2 disabled:opacity-40"
                >
                  <Link size={14} />
                </button>
              </div>

              {/* Upload File */}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border border-dashed border-[rgb(var(--border))] hover:border-[#00B9D9]/50 transition-colors text-xs text-[rgb(var(--text-muted))]">
                <Upload size={13} />
                <span>Upload file (gambar, dokumen...)</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEvidences([]); }}
                className="btn-ghost text-xs px-3 py-1.5"
              >
                <X size={13} /> Batal
              </button>
              <button
                type="submit"
                disabled={saving || !form.title}
                className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : <><Save size={13} /> Simpan Aktivitas</>}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-10 text-[rgb(var(--text-muted))] text-sm">
          <Plus size={32} className="mx-auto mb-2 opacity-30" />
          Belum ada aktivitas. Log aktivitas pertama!
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, i) => {
            const config = ACTIVITY_CONFIG[activity.type];
            const hasDelta = activity.progressBefore != null && activity.progressAfter != null;
            const delta = hasDelta ? (activity.progressAfter! - activity.progressBefore!) : 0;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 p-3 rounded-xl group"
                style={{ background: 'rgb(var(--surface-1))' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: `${config.color}18`, color: config.color }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{activity.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-[rgb(var(--text-muted))]">
                        {formatRelative(activity.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        disabled={deletingId === activity.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress delta */}
                  {hasDelta && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-[rgb(var(--text-muted))]">{activity.progressBefore}%</span>
                      <span className="text-[11px] text-[rgb(var(--text-muted))]">→</span>
                      <span
                        className="text-[11px] font-semibold flex items-center gap-0.5"
                        style={{ color: delta >= 0 ? '#00C951' : '#ef4444' }}
                      >
                        {activity.progressAfter}%
                        <span className="font-normal">({delta >= 0 ? '+' : ''}{delta}%)</span>
                      </span>
                    </div>
                  )}

                  {/* Evidences */}
                  {activity.evidences && activity.evidences.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {activity.evidences.map(ev => (
                        <a
                          key={ev.id}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
                          style={{ background: 'rgb(var(--surface-2))', color: 'rgb(var(--text-secondary))' }}
                        >
                          <Paperclip size={10} />
                          {ev.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
