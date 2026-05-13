'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useState } from 'react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-0))] relative flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgb(var(--border))]">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white">
          <Image src="/logo.png" alt="DECOM Logo" width={32} height={32} className="object-contain w-full h-full" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-bold text-sm">DFM Monitor</p>
            <p className="text-[10px] text-[rgb(var(--text-muted))]">Admin Panel</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'sidebar-item',
              isActive(item.href, item.exact) && 'active',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm"
              >
                {item.label}
              </motion.span>
            )}
          </Link>
        ))}
      </nav>

      {/* User & Collapse */}
      <div className="p-3 border-t border-[rgb(var(--border))] space-y-1">
        {user && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#00B9D9]/20 flex items-center justify-center text-xs font-bold text-[#00B9D9] flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className={cn(
            'sidebar-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-400',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'sidebar-item w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  );
}
