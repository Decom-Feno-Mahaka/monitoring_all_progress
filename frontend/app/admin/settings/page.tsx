'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { usersApi } from '@/lib/api-extra';
import { User } from '@/lib/types';
import { Settings, Users, Shield, Zap, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-[rgb(var(--text-muted))]">Platform configuration</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users size={15} /> My Profile
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#00B9D9]/20 flex items-center justify-center text-xl font-bold text-[#00B9D9]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-[rgb(var(--text-muted))]">{user?.email}</p>
            <span className="badge cat-SOFTWARE text-xs mt-1">{user?.role}</span>
          </div>
        </div>
      </motion.div>

      {/* Platform Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap size={15} /> Platform Info
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Platform', value: 'DFM Project Monitor' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Backend', value: 'NestJS + PostgreSQL' },
            { label: 'Frontend', value: 'Next.js 14 + TailwindCSS' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[rgb(var(--border))] last:border-0">
              <span className="text-sm text-[rgb(var(--text-muted))]">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Links */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Globe size={15} /> Quick Links
        </h2>
        <div className="space-y-2">
          <a href="/" target="_blank" className="flex items-center justify-between p-3 rounded-xl hover:bg-[rgb(var(--surface-1))] transition-colors group">
            <span className="text-sm">Public Dashboard</span>
            <span className="text-xs text-[#00B9D9] group-hover:text-[#009BB8]">Open →</span>
          </a>
          <a href="/admin/projects/new" className="flex items-center justify-between p-3 rounded-xl hover:bg-[rgb(var(--surface-1))] transition-colors group">
            <span className="text-sm">Create New Project</span>
            <span className="text-xs text-[#00B9D9] group-hover:text-[#009BB8]">Open →</span>
          </a>
          <a href="/admin/analytics" className="flex items-center justify-between p-3 rounded-xl hover:bg-[rgb(var(--surface-1))] transition-colors group">
            <span className="text-sm">Analytics Dashboard</span>
            <span className="text-xs text-[#00B9D9] group-hover:text-[#009BB8]">Open →</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
