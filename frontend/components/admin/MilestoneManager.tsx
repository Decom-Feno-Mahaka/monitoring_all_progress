'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milestone, MilestoneStatus } from '@/lib/types';
import { milestonesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle2, Circle, Clock, AlertCircle, XCircle,
  Plus, Trash2, ChevronDown, ChevronUp, Save, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CYCLE: MilestoneStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];

const STATUS_ICON: Record<MilestoneStatus, { icon: React.ReactNode; color: string; label: string }> = {
  COMPLETED: { icon: <CheckCircle2 size={18} />, color: '#00C951', label: 'Completed' },
  IN_PROGRESS: { icon: <Clock size={18} />, color: '#00B9D9', label: 'In Progress' },
  PENDING: { icon: <Circle size={18} />, color: '#94a3b8', label: 'Pending' },
  DELAYED: { icon: <AlertCircle size={18} />, color: '#f59e0b', label: 'Delayed' },
  CANCELLED: { icon: <XCircle size={18} />, color: '#ef4444', label: 'Cancelled' },
};

interface Props {
  projectId: string;
  milestones: Milestone[];
  onRefresh: () => void;
}

export function MilestoneManager({ projectId, milestones, onRefresh }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newMs, setNewMs] = useState({
    title: '',
    description: '',
    targetDate: '',
    weight: 10,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await milestonesApi.create(projectId, {
        ...newMs,
        weight: Number(newMs.weight),
        targetDate: newMs.targetDate || undefined,
        order: milestones.length,
      });
      setNewMs({ title: '', description: '', targetDate: '', weight: 10 });
      setShowAddForm(false);
      onRefresh();
    } catch (e) { console.error(e); }
    setAdding(false);
  };

  const handleToggleStatus = async (ms: Milestone) => {
    setTogglingId(ms.id);
    try {
      const currentIdx = STATUS_CYCLE.indexOf(ms.status as MilestoneStatus);
      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
      await milestonesApi.update(projectId, ms.id, {
        status: nextStatus,
        actualDate: nextStatus === 'COMPLETED' ? new Date().toISOString() : null,
      });
      onRefresh();
    } catch (e) { console.error(e); }
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus milestone ini?')) return;
    setDeletingId(id);
    try {
      await milestonesApi.delete(projectId, id);
      onRefresh();
    } catch (e) { console.error(e); }
    setDeletingId(null);
  };

  const completedCount = milestones.filter(m => m.status === 'COMPLETED').length;
  const completionPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Milestones</h3>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
            {completedCount}/{milestones.length} selesai ({completionPct}%)
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-xs px-3 py-1.5"
        >
          <Plus size={13} /> Tambah Milestone
        </button>
      </div>

      {/* Progress bar */}
      {milestones.length > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--surface-3))' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00B9D9, #00C951)' }}
          />
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            onSubmit={handleAdd}
            className="p-4 rounded-xl space-y-3 border border-[#00B9D9]/30"
            style={{ background: 'rgb(0 185 217 / 0.05)' }}
          >
            <p className="text-xs font-semibold text-[#00B9D9]">Milestone Baru</p>
            <div>
              <label className="block text-xs font-medium mb-1 text-[rgb(var(--text-secondary))]">Judul *</label>
              <input
                className="input-base text-sm"
                placeholder="e.g., Finalisasi API Integration"
                value={newMs.title}
                onChange={e => setNewMs(p => ({ ...p, title: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[rgb(var(--text-secondary))]">Deskripsi</label>
              <input
                className="input-base text-sm"
                placeholder="Detail singkat..."
                value={newMs.description}
                onChange={e => setNewMs(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-[rgb(var(--text-secondary))]">Target Date</label>
                <input
                  type="date"
                  className="input-base text-sm"
                  value={newMs.targetDate}
                  onChange={e => setNewMs(p => ({ ...p, targetDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[rgb(var(--text-secondary))]">
                  Bobot: <span className="text-[#00B9D9] font-bold">{newMs.weight}%</span>
                </label>
                <input
                  type="range" min={5} max={50} step={5}
                  className="w-full accent-[#00B9D9]"
                  value={newMs.weight}
                  onChange={e => setNewMs(p => ({ ...p, weight: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-ghost text-xs px-3 py-1.5"
              >
                <X size={13} /> Batal
              </button>
              <button
                type="submit"
                disabled={adding || !newMs.title}
                className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
              >
                {adding ? 'Menyimpan...' : <><Save size={13} /> Simpan</>}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Milestone List */}
      {milestones.length === 0 ? (
        <div className="text-center py-10 text-[rgb(var(--text-muted))] text-sm">
          <Circle size={32} className="mx-auto mb-2 opacity-30" />
          Belum ada milestone. Tambahkan milestone pertama!
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((ms, i) => {
            const s = STATUS_ICON[ms.status];
            return (
              <motion.div
                key={ms.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3 rounded-xl group transition-all"
                style={{ background: 'rgb(var(--surface-1))' }}
              >
                {/* Status Toggle Button */}
                <button
                  onClick={() => handleToggleStatus(ms)}
                  disabled={togglingId === ms.id}
                  className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110 disabled:opacity-50"
                  style={{ color: s.color }}
                  title={`Status: ${s.label} — Klik untuk ganti`}
                >
                  {togglingId === ms.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : s.icon}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn(
                        'text-sm font-medium leading-tight',
                        ms.status === 'COMPLETED' && 'line-through opacity-60'
                      )}>
                        {ms.title}
                      </p>
                      {ms.description && (
                        <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{ms.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(ms.id)}
                      disabled={deletingId === ms.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[rgb(var(--text-muted))]">
                    <span
                      className="px-1.5 py-0.5 rounded-md font-medium"
                      style={{ background: `${s.color}18`, color: s.color }}
                    >
                      {s.label}
                    </span>
                    {ms.targetDate && (
                      <span>📅 {formatDate(ms.targetDate, 'dd MMM yyyy')}</span>
                    )}
                    {ms.actualDate && (
                      <span style={{ color: '#00C951' }}>✓ {formatDate(ms.actualDate, 'dd MMM yyyy')}</span>
                    )}
                    <span className="ml-auto">bobot {ms.weight}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
