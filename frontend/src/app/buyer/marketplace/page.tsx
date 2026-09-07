'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import { getCropImageUrl } from '@/lib/cropImages';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Listing {
  id: string; cropName: string; qualityGrade: string; quantityKg: number;
  pricePerKg: number; status: string; images: string[]; createdAt: string;
  description: string;
  farmer: { id: string; name: string; address: string; avgRating: string | null; latitude: number; longitude: number };
}

const CROP_FILTERS = ['All', 'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Chilli', 'Brinjal'];

export default function BuyerMarketplace() {
  const { user, loading } = useRequireRole('buyer');
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ crop: '', minPrice: '', maxPrice: '', grade: '' });
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderModal, setOrderModal] = useState<Listing | null>(null);
  const [orderForm, setOrderForm] = useState({ quantityKg: '', deliveryAddress: '', notes: '' });

  const loadListings = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '12' });
      if (filters.crop) params.append('crop', filters.crop);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.grade) params.append('grade', filters.grade);

      const { data } = await api.get(`/buyer/marketplace?${params}`);
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load marketplace'); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (user) loadListings(); }, [user, page, filters]);

  const handleOrder = async () => {
    if (!orderModal || !orderForm.quantityKg || !orderForm.deliveryAddress) {
      toast.error('Please fill all required fields');
      return;
    }
    setOrdering(orderModal.id);
    try {
      await api.post('/buyer/orders', {
        listingId: orderModal.id,
        quantityKg: parseFloat(orderForm.quantityKg),
        deliveryAddress: orderForm.deliveryAddress,
        notes: orderForm.notes,
      });
      toast.success('Order placed! Payment held in escrow. 🎉');
      setOrderModal(null);
      setOrderForm({ quantityKg: '', deliveryAddress: '', notes: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Order failed');
    } finally {
      setOrdering(null);
    }
  };

  const filteredBySearch = listings.filter(l =>
    !search || l.cropName.toLowerCase().includes(search.toLowerCase()) || l.farmer.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Marketplace</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{total} fresh listings directly from verified farmers</p>
          </div>

          {/* Search + Filters */}
          <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 120px', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Search</label>
                <input className="input-field" placeholder="Search crop or farmer name..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Min Price (₹/kg)</label>
                <input className="input-field" type="number" placeholder="0" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Max Price (₹/kg)</label>
                <input className="input-field" type="number" placeholder="∞" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Grade</label>
                <select className="input-field" value={filters.grade} onChange={e => setFilters(f => ({ ...f, grade: e.target.value }))}>
                  <option value="">All</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
              </div>
            </div>

            {/* Crop quick filters */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {CROP_FILTERS.map(c => (
                <button key={c} onClick={() => setFilters(f => ({ ...f, crop: c === 'All' ? '' : c }))}
                  className={(c === 'All' && !filters.crop) || filters.crop === c ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: 12, padding: '6px 14px' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Also link to AI chat */}
          <div className="glass" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(155, 89, 182, 0.08)', borderColor: 'rgba(155, 89, 182, 0.2)' }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Try AI-powered search</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Describe what you need in natural language and let our AI find the best options for you</div>
            </div>
            <Link href="/buyer/chat" className="btn-primary" style={{ fontSize: 13, padding: '8px 18px', whiteSpace: 'nowrap' }}>Ask AI →</Link>
          </div>

          {/* Listings Grid */}
          {fetching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(9)].map((_, i) => <div key={i} className="shimmer" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : filteredBySearch.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontWeight: 700 }}>No listings found</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredBySearch.map((l, i) => (
                <div key={l.id} className="glass glass-hover animate-fade-in" style={{ overflow: 'hidden', animationDelay: `${i * 0.05}s` }}>
                  {/* Image */}
                  <div style={{ position: 'relative', height: 170, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                    <img
                      src={getCropImageUrl(l.cropName, l.images)}
                      alt={l.cropName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      onError={(e: any) => { e.currentTarget.src = '/crops/rice.jpg'; }}
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                      {l.qualityGrade && <span className="badge badge-gold">Grade {l.qualityGrade}</span>}
                    </div>
                  </div>

                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{l.cropName}</h3>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                      🧑‍🌾 {l.farmer.name}
                      {l.farmer.avgRating && <span style={{ marginLeft: 8 }}>⭐ {l.farmer.avgRating}</span>}
                      {l.farmer.address && <span style={{ display: 'block', marginTop: 2 }}>📍 {l.farmer.address}</span>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-gold-light)' }}>₹{l.pricePerKg}/kg</span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{l.quantityKg.toLocaleString('en-IN')} kg available</span>
                    </div>

                    {l.description && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {l.description}
                      </p>
                    )}

                    <button
                      className="btn-primary"
                      style={{ width: '100%', fontSize: 13 }}
                      onClick={() => { setOrderModal(l); setOrderForm(f => ({ ...f, quantityKg: Math.min(100, l.quantityKg).toString() })); }}
                    >
                      🛒 Order Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {Math.ceil(total / 12) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32 }}>
              <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span style={{ padding: '12px 20px', fontSize: 14, color: 'var(--color-text-secondary)' }}>Page {page} of {Math.ceil(total / 12)}</span>
              <button className="btn-secondary" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </main>

      {/* Order Modal */}
      {orderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24, backdropFilter: 'blur(4px)' }}>
          <div className="glass animate-fade-in" style={{ maxWidth: 480, width: '100%', padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Place Order</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
              {orderModal.cropName} (Grade {orderModal.qualityGrade}) from {orderModal.farmer.name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Quantity (kg) *</label>
                <input className="input-field" type="number" step="0.1" max={orderModal.quantityKg} value={orderForm.quantityKg} onChange={e => setOrderForm(f => ({ ...f, quantityKg: e.target.value }))} />
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Max: {orderModal.quantityKg} kg available</div>
              </div>

              {orderForm.quantityKg && (
                <div className="glass stat-glow-gold" style={{ padding: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total Amount</span>
                  <span className="font-display" style={{ fontWeight: 800, color: 'var(--color-gold-light)', fontSize: 20 }}>
                    ₹{(parseFloat(orderForm.quantityKg || '0') * orderModal.pricePerKg).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Delivery Address *</label>
                <input className="input-field" placeholder="Full delivery address" value={orderForm.deliveryAddress} onChange={e => setOrderForm(f => ({ ...f, deliveryAddress: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Notes (optional)</label>
                <input className="input-field" placeholder="Delivery instructions, packaging preferences..." value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="glass" style={{ padding: 14, fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 10, background: 'rgba(74,144,217,0.08)', borderColor: 'rgba(74,144,217,0.2)' }}>
                🔒 <span>Payment is held in escrow and released only after you confirm delivery via OTP. Safe and secure.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setOrderModal(null)}>Cancel</button>
              <button className="btn-gold" style={{ flex: 2 }} onClick={handleOrder} disabled={!!ordering}>
                {ordering ? 'Placing Order...' : '🛒 Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
