'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'framer-motion';

export function PublicNavbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-strong sticky top-0 z-50 border-b border-[rgb(var(--border))]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="DECOM Logo" width={32} height={32} className="object-contain w-full h-full" />
          </div>
          <div>
            <span className="font-bold text-sm leading-none">DFM Monitor</span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] block">Project Dashboard</span>
          </div>
        </Link>

        {/* Center - Live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgb(var(--surface-2))' }}>
          <div className="live-dot" />
          <span className="text-xs text-[rgb(var(--text-muted))]">Live Updates</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="btn-primary text-xs px-3 py-2 hidden sm:flex"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
