'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#52A352', '#4A90D9', '#E8941A', '#9B59B6', '#D4A017', '#e74c3c', '#1abc9c', '#34495e'];

export default function AdminDashboard() {
  const { user, loading } = useRequireRole('admin');
  const [analytics, setAnalytics] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/admin/analytics')
      .then(({ data }) => setAnalytics(data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) return null;

  const roleData = analytics?.usersByRole?.map((r: any) => ({ name: r.role, value: r._count })) || [];
  const orderData = analytics?.ordersByStatus?.map((o: any) => ({ name: o.status.replace('_', ' '), value: o._count })) || [];
  const cropData = analytics?.topCrops?.slice(0, 6).map((c: any) => ({ name: c.cropName, listings: c._count.cropName, kg: Math.round(c._sum.quantityKg || 0) })) || [];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div className="animate-fade-in" style={{ marginBottom: 32 }}>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800 }}>Admin Analytics</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Platform overview and business intelligence</p>
          </div>

          {fetching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : (
            <>
              {/* Overview cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'Total Users', value: analytics?.overview?.totalUsers, icon: '👥', color: '#52A352' },
                  { label: 'Total Listings', value: analytics?.overview?.totalListings, icon: '📋', color: '#4A90D9' },
                  { label: 'Total Orders', value: analytics?.overview?.totalOrders, icon: '📦', color: '#E8941A' },
                  { label: 'Revenue', value: `₹${(analytics?.overview?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#D4A017' },
                ].map((s, i) => (
                  <div key={i} className="glass animate-fade-in" style={{ padding: 24, animationDelay: `${i * 0.1}s` }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value ?? '—'}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 32 }}>
                {/* Users by role pie */}
                <div className="glass" style={{ padding: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Users by Role</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                        {roleData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Orders by status */}
                <div className="glass" style={{ padding: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Orders by Status</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={orderData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                      <Bar dataKey="value" fill="#52A352" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top crops */}
                <div className="glass" style={{ padding: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Top Crops by Listings</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={cropData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                      <Bar dataKey="listings" fill="#D4A017" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent orders table */}
              <div className="glass" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Recent Orders</h2>
                <table className="data-table">
                  <thead>
                    <tr><th>Order ID</th><th>Buyer</th><th>Crop</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {(analytics?.recentOrders || []).map((o: any) => (
                      <tr key={o.id}>
                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{o.id.slice(0, 8)}...</td>
                        <td style={{ fontWeight: 500 }}>{o.buyer.name}</td>
                        <td>{o.listing.cropName}</td>
                        <td className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>₹{o.totalPrice?.toLocaleString('en-IN')}</td>
                        <td><span className={`badge ${o.status === 'delivered' ? 'badge-green' : o.status === 'cancelled' ? 'badge-red' : 'badge-gold'}`}>{o.status}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
