'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@dfm.id');
  const [password, setPassword] = useState('admin123456');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'rgb(var(--surface-1))' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #00B9D9, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm relative"
      >
        <div className="card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-30 h-30 mx-auto mb-4 overflow-hidden flex items-center justify-center p-2">
              <Image src="/logo.png" alt="DECOM Logo" width={100} height={100} className="object-contain w-full h-full" />
            </div>
            <h1 className="text-xl font-bold">DFM Project Monitor</h1>
            <p className="text-sm text-[rgb(var(--text-muted))] mt-1">Admin Panel Login</p>
          </div>

          {/* Demo hint */}
          <div className="flex items-start gap-2 p-3 rounded-xl mb-6 text-xs" style={{ background: 'rgb(0 185 217 / 0.08)', color: '#00B9D9' }}>
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Demo credentials are pre-filled. Make sure the backend is running.</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  className="input-base"
                  style={{ paddingLeft: '2.25rem' }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@dfm.id"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="input-base"
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-xl"
                style={{ background: 'rgb(239 68 68 / 0.08)' }}
              >
                <AlertCircle size={13} />
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-xs text-[rgb(var(--text-muted))] mt-6">
            <a href="/" className="hover:text-[rgb(var(--text-primary))] transition-colors">
              ← Back to Public Dashboard
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
