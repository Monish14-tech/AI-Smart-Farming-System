'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BuyerDashboard() {
  const { user, loading } = useRequireRole('buyer');
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recommendedCrops, setRecommendedCrops] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get('/buyer/orders').then(({ data }) => {
      const orders = data.orders || [];
      setRecentOrders(orders.slice(0, 5));
      setStats({
        total: orders.length,
        pending: orders.filter((o: any) => o.status === 'pending').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
        totalSpent: orders.filter((o: any) => o.paymentStatus === 'paid').reduce((s: number, o: any) => s + o.totalPrice, 0),
      });
    }).catch(() => toast.error('Failed to load data'));

    // Fetch ML recommendations
    api.get('/ml/buyer/recommendations').then(({ data }) => {
      setRecommendedCrops((data.recommendations || []).slice(0, 3));
    }).catch(() => {});
  }, [user]);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div className="animate-fade-in" style={{ marginBottom: 32 }}>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              Welcome, <span className="gradient-text">{user.name.split(' ')[0]}</span>! 🛒
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Fresh produce directly from verified farmers with ML price insights</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Orders', value: stats.total, icon: '📦', color: '#52A352' },
              { label: 'Pending', value: stats.pending, icon: '⏳', color: '#E8941A' },
              { label: 'Delivered', value: stats.delivered, icon: '✅', color: '#4A90D9' },
              { label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString('en-IN')}`, icon: '💰', color: '#D4A017' },
            ].map((s, i) => (
              <div key={i} className="glass animate-fade-in" style={{ padding: 22, animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ML Recommended Crops Strip */}
          {recommendedCrops.length > 0 && (
            <div className="glass" style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(212, 160, 23, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>✨</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>ML Best Value Crop Recommendations</h3>
                </div>
                <Link href="/buyer/marketplace" style={{ fontSize: 13, color: 'var(--color-gold)', textDecoration: 'none', fontWeight: 600 }}>
                  Explore All →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {recommendedCrops.map(c => (
                  <div key={c.cropName} style={{ padding: 14, background: 'var(--color-surface-2)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.cropName}</span>
                      <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>Score {c.valueScore}/100</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                      Avg: <b style={{ color: 'var(--color-gold)' }}>₹{c.avgMarketplacePrice}/kg</b> (Fair: ₹{c.predictedFairPrice})
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                      {c.totalQuantityKg.toLocaleString('en-IN')} kg available from verified farmers
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Orders</h2>
                <Link href="/buyer/orders" style={{ fontSize: 13, color: 'var(--color-leaf)', textDecoration: 'none' }}>View All →</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                  <p style={{ color: 'var(--color-text-secondary)' }}>No orders yet</p>
                  <Link href="/buyer/marketplace" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex', fontSize: 13 }}>Browse Marketplace</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentOrders.map(o => (
                    <div key={o.id} style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{o.listing.cropName}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{o.quantityKg} kg · {new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>₹{o.totalPrice.toLocaleString('en-IN')}</span>
                        <span className={`badge ${o.status === 'delivered' ? 'badge-green' : o.status === 'cancelled' ? 'badge-red' : 'badge-gold'}`} style={{ fontSize: 10 }}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link href="/buyer/marketplace" className="btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>🛒 Browse Marketplace</Link>
                  <Link href="/buyer/orders" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>📦 Track Orders</Link>
                  <Link href="/buyer/chat" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>🤖 AI Shopping Assistant</Link>
                </div>
              </div>

              <div className="glass" style={{ padding: 22, background: 'rgba(155,89,182,0.06)', borderColor: 'rgba(155,89,182,0.2)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>AI Shopping Assistant</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>Tell me what you need in plain language. "500kg Grade A tomatoes under ₹25/kg near Pune"</p>
                <Link href="/buyer/chat" className="btn-primary" style={{ justifyContent: 'center', fontSize: 13, width: '100%' }}>Start Chatting →</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
