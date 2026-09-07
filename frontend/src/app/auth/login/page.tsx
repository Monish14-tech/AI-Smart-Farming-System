'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 32 }}>🌿</span>
            <span className="font-display gradient-text" style={{ fontSize: 26, fontWeight: 800 }}>AgriNova</span>
          </Link>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 8 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Email Address</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" id="login-submit" disabled={loading} style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <hr className="divider" style={{ margin: '24px 0' }} />

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Don't have an account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--color-leaf)', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
        </p>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
          System Administrator?{' '}
          <Link href="/admin/login" style={{ color: '#B39DDB', fontWeight: 600, textDecoration: 'none' }}>Access Admin Portal →</Link>
        </p>
      </div>
    </main>
  );
}
