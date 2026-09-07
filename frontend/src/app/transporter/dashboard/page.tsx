'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function TransporterDashboard() {
  const { user, loading } = useRequireRole('transporter');
  const [stats, setStats] = useState({ available: 0, activeJobs: 0, totalDeliveries: 0, totalEarnings: 0 });
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/transporter/jobs'),
      api.get('/transporter/active'),
      api.get('/transporter/earnings'),
    ]).then(([jobsRes, activeRes, earningsRes]) => {
      setStats({
        available: jobsRes.data.jobs?.length || 0,
        activeJobs: activeRes.data.jobs?.length || 0,
        totalDeliveries: earningsRes.data.jobs?.length || 0,
        totalEarnings: earningsRes.data.totalEarnings || 0,
      });
    }).catch(() => toast.error('Failed to load dashboard'));
    setIsAvailable(user.transporterProfile?.isAvailable ?? true);
  }, [user]);

  const toggleAvailability = async () => {
    try {
      await api.put('/transporter/availability', { isAvailable: !isAvailable });
      setIsAvailable(a => !a);
      toast.success(isAvailable ? 'You are now offline' : 'You are now online!');
    } catch { toast.error('Failed to update availability'); }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div className="animate-fade-in" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                Welcome, <span className="gradient-text">{user.name.split(' ')[0]}</span>! 🚛
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>{user.transporterProfile?.vehicleType || 'Transport Vehicle'} · {user.transporterProfile?.vehicleNumber || 'No plate'}</p>
            </div>
            <button onClick={toggleAvailability} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: isAvailable ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', border: `1px solid ${isAvailable ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`, color: isAvailable ? '#81C784' : '#EF9A9A', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAvailable ? '#81C784' : '#EF9A9A', animation: isAvailable ? 'pulse-green 2s infinite' : 'none' }} />
              {isAvailable ? '● Available' : '○ Offline'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Available Jobs', value: stats.available, icon: '📋', color: '#52A352' },
              { label: 'Active Trips', value: stats.activeJobs, icon: '🗺️', color: '#E8941A' },
              { label: 'Total Deliveries', value: stats.totalDeliveries, icon: '✅', color: '#4A90D9' },
              { label: 'Total Earnings', value: `₹${stats.totalEarnings.toLocaleString('en-IN')}`, icon: '💰', color: '#D4A017' },
            ].map((s, i) => (
              <div key={i} className="glass animate-fade-in" style={{ padding: 22, animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🗺️ Route Optimizer</h2>
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
                <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Smart VRP Route Planner</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                  Accept multiple jobs and let our AI route optimizer (Nearest Neighbor VRP algorithm) plan the most efficient multi-pickup route — saving you fuel and time.
                </p>
                <Link href="/transporter/jobs" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Browse Available Jobs →</Link>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link href="/transporter/jobs" className="btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>📋 Available Jobs</Link>
                  <Link href="/transporter/active" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>🗺️ Active Trip Map</Link>
                  <Link href="/transporter/earnings" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>💰 Earnings</Link>
                </div>
              </div>

              <div className="glass" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📍 Live GPS</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Your location is shared with buyers when you're on an active delivery.</p>
                <div className="badge badge-green" style={{ width: '100%', justifyContent: 'center' }}>GPS Active</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
