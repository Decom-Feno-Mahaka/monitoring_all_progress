'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuthStore } from '@/lib/store';
import { Bell, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else {
      fetchMe();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'rgb(var(--surface-1))' }}>
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-[rgb(var(--border))] flex-shrink-0" style={{ background: 'rgb(var(--surface-0))' }}>
          <div />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors px-2 py-1 rounded-lg hover:bg-[rgb(var(--surface-2))]"
            >
              <ExternalLink size={13} />
              Public View
            </Link>
            <ThemeToggle />
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
