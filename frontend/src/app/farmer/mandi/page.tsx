'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function MandiPrices() {
  const { user, loading } = useRequireRole('farmer');
  const [prices, setPrices] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/farmer/mandi-prices').then(({ data }) => setPrices(data.prices || [])).catch(() => toast.error('Failed to load prices')).finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ marginBottom: 32 }}>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Mandi Prices</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Live market prices from Agmarknet / data.gov.in</p>
          </div>
          <div className="glass" style={{ overflow: 'hidden' }}>
            {fetching ? (
              <div style={{ padding: 24 }}>{[...Array(8)].map((_, i) => <div key={i} className="shimmer" style={{ height: 40, borderRadius: 8, marginBottom: 8 }} />)}</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Crop</th><th>Market</th><th>State</th><th>Min Price</th><th>Max Price</th><th>Modal Price</th></tr></thead>
                <tbody>
                  {prices.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{p.commodity}</td>
                      <td>{p.market}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{p.state}</td>
                      <td>₹{p.min_price}/q</td>
                      <td>₹{p.max_price}/q</td>
                      <td className="font-display" style={{ fontWeight: 800, color: 'var(--color-gold-light)', fontSize: 16 }}>₹{p.modal_price}/q</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
            Source: data.gov.in Agmarknet API · Prices in ₹/quintal (100kg) · Updated daily
          </p>
        </div>
      </main>
    </div>
  );
}
