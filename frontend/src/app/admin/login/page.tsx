'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';

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

      toast.success('Admin authentication verified. Welcome back.');
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login error:', err);
      if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err?.message === 'Network Error' || !err?.response) {
        toast.error(`Network Error: Frontend cannot reach "${api.defaults.baseURL}". Verify backend is awake.`);
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
        background: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '40px 36px',
          background: '#1E293B',
          borderRadius: 8,
          border: '1px solid #334155',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 8,
              background: '#0D9488',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <ShieldCheck size={26} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span className="font-display" style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC' }}>
              Agri<span style={{ color: '#2DD4BF' }}>Nova</span>
            </span>
          </div>

          <h1 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: '4px 0', color: '#F1F5F9' }}>
            System Administration
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
            Restricted access for platform administrators and operations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#CBD5E1' }}>
              Administrator Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@agrinova.market"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                borderColor: '#475569',
                background: '#0F172A',
                color: '#F8FAFC',
                borderRadius: 6,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#CBD5E1' }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                borderColor: '#475569',
                background: '#0F172A',
                color: '#F8FAFC',
                borderRadius: 6,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '12px 20px',
              borderRadius: 6,
              background: '#0D9488',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.18s ease',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Lock size={15} />
            <span>{loading ? 'Verifying Credentials...' : 'Authenticate'}</span>
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0', borderColor: '#334155' }} />

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <Link href="/auth/login" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            User Sign In
          </Link>
          <Link href="/" style={{ color: '#2DD4BF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Return to Site</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </main>
  );
}
