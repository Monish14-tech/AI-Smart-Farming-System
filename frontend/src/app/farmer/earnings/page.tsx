'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function FarmerEarnings() {
  const { user, loading } = useRequireRole('farmer');
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/farmer/earnings').then(({ data }) => setData(data)).catch(() => toast.error('Failed to load earnings')).finally(() => setFetching(false));
  }, [user]);

  // Group by month for chart
  const monthlyData = data?.orders?.reduce((acc: Record<string, number>, o: any) => {
    const month = new Date(o.createdAt).toLocaleString('en-IN', { month: 'short' });
    acc[month] = (acc[month] || 0) + o.totalPrice;
    return acc;
  }, {});
  const chartData = Object.entries(monthlyData || {}).map(([month, amount]) => ({ month, amount }));

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ marginBottom: 32 }}>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Earnings</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Your income from crop sales</p>
          </div>

          {fetching ? (
            <div className="shimmer" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                <div className="glass stat-glow-gold" style={{ padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>TOTAL EARNINGS</div>
                  <div className="font-display" style={{ fontSize: 40, fontWeight: 900, color: 'var(--color-gold-light)' }}>₹{(data?.totalEarnings || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>THIS MONTH</div>
                  <div className="font-display" style={{ fontSize: 40, fontWeight: 900, color: 'var(--color-leaf)' }}>₹{(data?.thisMonthEarnings || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Monthly Earnings</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Earnings']} contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                      <Bar dataKey="amount" fill="#D4A017" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="glass" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>Completed Orders</h2>
                </div>
                {(data?.orders?.length || 0) === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>No completed orders yet</div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Crop</th><th>Quantity</th><th>Amount</th><th>Date</th></tr></thead>
                    <tbody>
                      {data.orders.map((o: any) => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 600 }}>{o.listing.cropName}</td>
                          <td>{o.quantityKg} kg</td>
                          <td className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>₹{o.totalPrice.toLocaleString('en-IN')}</td>
                          <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
