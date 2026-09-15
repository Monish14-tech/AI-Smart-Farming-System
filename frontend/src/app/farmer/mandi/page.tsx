'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const COMMODITIES = [
  'All',
  'Tomato',
  'Onion',
  'Potato',
  'Wheat',
  'Rice',
  'Green Chilli',
  'Cotton',
  'Soybean',
  'Carrot',
  'Cauliflower',
  'Groundnut',
  'Sugarcane',
];

export default function MandiPrices() {
  const { user, loading } = useRequireRole('farmer');
  const [prices, setPrices] = useState<any[]>([]);
  const [source, setSource] = useState<string>('Agmarknet APMC Benchmarks');
  const [fetching, setFetching] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPrices = async (commodity: string) => {
    setFetching(true);
    try {
      const params = commodity !== 'All' ? { commodity } : {};
      const { data } = await api.get('/farmer/mandi-prices', { params });
      setPrices(data.prices || []);
      if (data.source) setSource(data.source);
    } catch {
      toast.error('Failed to load mandi prices');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchPrices(selectedCommodity);
  }, [user, selectedCommodity]);

  const filteredPrices = useMemo(() => {
    if (!searchQuery.trim()) return prices;
    const q = searchQuery.toLowerCase();
    return prices.filter(
      (p) =>
        p.commodity?.toLowerCase().includes(q) ||
        p.market?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q)
    );
  }, [prices, searchQuery]);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          {/* Header */}
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                📊 Mandi Prices
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                Real-time benchmark & APMC market arrival rates across Indian Mandis
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-green">Live APMC</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{source}</span>
            </div>
          </div>

          {/* Search & Commodity Filters */}
          <div className="glass" style={{ padding: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: '1 1 260px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search crop, mandi market, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--color-border, #E2E8F0)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--color-border, #E2E8F0)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>

            {/* Commodity Chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COMMODITIES.map((c) => {
                const isActive = selectedCommodity === c;
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCommodity(c)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'var(--color-primary, #059669)' : 'rgba(0,0,0,0.04)',
                      color: isActive ? '#FFFFFF' : 'var(--color-text-primary, #1E293B)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Container */}
          <div className="glass" style={{ overflow: 'hidden' }}>
            {fetching ? (
              <div style={{ padding: 24 }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: 44, borderRadius: 8, marginBottom: 10 }} />
                ))}
              </div>
            ) : filteredPrices.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Market</th>
                    <th>State</th>
                    <th>Min Price</th>
                    <th>Max Price</th>
                    <th>Modal Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{p.commodity}</td>
                      <td>{p.market}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{p.state}</td>
                      <td>₹{p.min_price?.toLocaleString('en-IN')}/q</td>
                      <td>₹{p.max_price?.toLocaleString('en-IN')}/q</td>
                      <td className="font-display" style={{ fontWeight: 800, color: 'var(--color-gold, #D97706)', fontSize: 16 }}>
                        ₹{p.modal_price?.toLocaleString('en-IN')}/q
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No mandi price records found</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                  Try choosing a different crop or clearing your search keywords.
                </p>
              </div>
            )}
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 14 }}>
            Source: {source} · All prices are in ₹/quintal (100 kg) · Updated continuously with APMC mandi arrivals
          </p>
        </div>
      </main>
    </div>
  );
}
