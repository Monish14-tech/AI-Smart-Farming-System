'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      if (data.user.role !== 'admin') {
        toast.error('Access Denied: This portal is restricted to AgriNova administrators.');
        setLoading(false);
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await refreshUser();

      toast.success('Admin authentication verified. Welcome back!');
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login error:', err);
      if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err?.message === 'Network Error' || !err?.response) {
        toast.error(`Network Error: Frontend cannot reach "${api.defaults.baseURL}". Verify backend is awake and NEXT_PUBLIC_API_URL is configured in Vercel.`);
      } else {
        toast.error(err?.message || 'Admin authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'radial-gradient(ellipse at top, #1c0f2b 0%, #0c0814 60%, #050308 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow elements */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155, 89, 182, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '44px 40px',
          borderColor: 'rgba(155, 89, 182, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(155, 89, 182, 0.1)',
        }}
      >
        {/* Header / Badge */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #9B59B6, #6C3483)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              marginBottom: 16,
              boxShadow: '0 8px 24px rgba(155, 89, 182, 0.35)',
            }}
          >
            🛡️
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>🌿</span>
            <span
              className="font-display"
              style={{
                fontSize: 22,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #B39DDB, #E1BEE7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AgriNova
            </span>
          </div>

          <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, margin: '4px 0', color: '#EDE7F6' }}>
            Admin Control Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
            Restricted access for system administrators & moderators
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#D1C4E9' }}>
              Administrator Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@agrinova.test"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                borderColor: 'rgba(155, 89, 182, 0.25)',
                background: 'rgba(15, 10, 24, 0.7)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#D1C4E9' }}>
              Master Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                borderColor: 'rgba(155, 89, 182, 0.25)',
                background: 'rgba(15, 10, 24, 0.7)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: '14px 24px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #9B59B6, #6C3483)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(155, 89, 182, 0.35)',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Verifying Credentials...' : '🔐 Authenticate Admin →'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0', borderColor: 'rgba(155, 89, 182, 0.2)' }} />

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <Link href="/auth/login" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            ← User Sign In
          </Link>
          <Link href="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            Return Home 🏠
          </Link>
        </div>
      </div>
    </main>
  );
}
