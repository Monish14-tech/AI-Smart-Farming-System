'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TransporterEarnings() {
  const { user, loading } = useRequireRole('transporter');
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/transporter/earnings').then(({ data }) => setData(data)).catch(() => toast.error('Failed to load earnings')).finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ marginBottom: 32 }}>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Earnings</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Your transport earnings</p>
          </div>
          {fetching ? <div className="shimmer" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} /> : (
            <>
              <div className="glass stat-glow-gold" style={{ padding: 28, textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>TOTAL EARNINGS</div>
                <div className="font-display" style={{ fontSize: 40, fontWeight: 900, color: 'var(--color-gold-light)' }}>₹{(data?.totalEarnings || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="glass" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>Trip History</h2>
                </div>
                {(data?.jobs?.length || 0) === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>No completed trips yet</div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Crop</th><th>Pickup → Drop</th><th>Earning</th><th>Delivered</th></tr></thead>
                    <tbody>
                      {data.jobs.map((j: any) => (
                        <tr key={j.id}>
                          <td style={{ fontWeight: 600 }}>{j.order.listing.cropName}</td>
                          <td style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{j.pickupAddress || 'Farm'} → {j.dropAddress || 'Buyer'}</td>
                          <td className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>₹{(j.earningAmount || 0).toLocaleString('en-IN')}</td>
                          <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{j.deliveredAt ? new Date(j.deliveredAt).toLocaleDateString('en-IN') : '—'}</td>
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
