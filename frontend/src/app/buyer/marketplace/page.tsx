'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import { getCropImageUrl } from '@/lib/cropImages';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface MLDeal {
  listingId: string;
  cropName: string;
  actualPricePerKg: number;
  fairPricePerKg: number;
  differencePct: number;
  dealRating: 'GREAT_DEAL' | 'FAIR_PRICE' | 'ABOVE_MARKET';
  dealBadge: string;
  savingsPerKg: number;
  score: number;
}

interface Listing {
  id: string; cropName: string; qualityGrade: string; quantityKg: number;
  pricePerKg: number; status: string; images: string[]; createdAt: string;
  description: string;
  farmer: { id: string; name: string; address: string; avgRating: string | null; latitude: number; longitude: number };
  mlDeal?: MLDeal;
}

interface CropRecommendation {
  cropName: string;
  totalQuantityKg: number;
  listingsCount: number;
  avgMarketplacePrice: number;
  predictedFairPrice: number;
  discountVsFairPct: number;
  valueScore: number;
  rationale: string;
}

const CROP_FILTERS = ['All', 'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Chilli', 'Brinjal'];

export default function BuyerMarketplace() {
  const { user, loading } = useRequireRole('buyer');
  const [listings, setListings] = useState<Listing[]>([]);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [fetchingML, setFetchingML] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ crop: '', minPrice: '', maxPrice: '', grade: '' });
  const [onlyGreatDeals, setOnlyGreatDeals] = useState(false);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderModal, setOrderModal] = useState<Listing | null>(null);
  const [orderForm, setOrderForm] = useState({ quantityKg: '', deliveryAddress: '', notes: '' });

  const loadListings = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '16' });
      if (filters.crop) params.append('crop', filters.crop);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.grade) params.append('grade', filters.grade);

      // Load marketplace listings
      const { data } = await api.get(`/buyer/marketplace?${params}`);
      const rawListings: Listing[] = data.listings || [];

      // Fetch ML deal evaluations
      try {
        const mlRes = await api.get('/ml/buyer/deals');
        const mlMap: Record<string, MLDeal> = {};
        (mlRes.data.listings || []).forEach((item: any) => {
          if (item.id && item.mlDeal) mlMap[item.id] = item.mlDeal;
        });

        // Merge ML deal data
        const enriched = rawListings.map(l => ({
          ...l,
          mlDeal: mlMap[l.id] || undefined
        }));
        setListings(enriched);
      } catch {
        setListings(rawListings);
      }

      setTotal(data.total || 0);
    } catch { toast.error('Failed to load marketplace'); }
    finally { setFetching(false); }
  };

  const loadMLRecommendations = async () => {
    setFetchingML(true);
    try {
      const { data } = await api.get('/ml/buyer/recommendations');
      setRecommendations(data.recommendations || []);
    } catch {
      // Fallback gracefully
    } finally {
      setFetchingML(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadListings();
      loadMLRecommendations();
    }
  }, [user, page, filters]);

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

  let filteredListings = listings.filter(l =>
    !search || l.cropName.toLowerCase().includes(search.toLowerCase()) || l.farmer.name.toLowerCase().includes(search.toLowerCase())
  );

  if (onlyGreatDeals) {
    filteredListings = filteredListings.filter(l => l.mlDeal?.dealRating === 'GREAT_DEAL');
  }

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                  Marketplace <span style={{ fontSize: 18, color: 'var(--color-gold)', fontWeight: 600 }}>✦ ML Powered</span>
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  {total} fresh farmer listings evaluated with real-time price & crop intelligence
                </p>
              </div>

              {/* Toggle Great Deals */}
              <button
                onClick={() => setOnlyGreatDeals(!onlyGreatDeals)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: onlyGreatDeals ? '1px solid #10B981' : '1px solid var(--color-border)',
                  background: onlyGreatDeals ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-surface-2)',
                  color: onlyGreatDeals ? '#34D399' : 'var(--color-text-secondary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🔥</span>
                <span>{onlyGreatDeals ? 'Showing Great Deals Only' : 'Filter: Great Deals Only'}</span>
                {onlyGreatDeals && <span style={{ fontSize: 11, background: '#10B981', color: '#fff', padding: '2px 6px', borderRadius: 10 }}>Active</span>}
              </button>
            </div>
          </div>

          {/* ML Intelligence Banner: Best Value Crops to Buy */}
          {recommendations.length > 0 && (
            <div className="glass" style={{ padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(212, 160, 23, 0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🧠</span>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                      ML Best Crop & Price Recommendations
                    </h2>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Inferred from current farmer supply, historical mandi prices, and quality ratings
                    </span>
                  </div>
                </div>
                <span className="badge badge-gold" style={{ fontSize: 11 }}>
                  Live Market Analysis
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {recommendations.slice(0, 3).map((crop) => (
                  <div
                    key={crop.cropName}
                    onClick={() => setFilters(f => ({ ...f, crop: crop.cropName }))}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>{crop.cropName}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                        Score {crop.valueScore}/100
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Avg Market Price</span>
                        <span className="font-display" style={{ fontWeight: 800, color: 'var(--color-gold-light)', fontSize: 16 }}>₹{crop.avgMarketplacePrice}/kg</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Fair Est.</span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>₹{crop.predictedFairPrice}/kg</span>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                      {crop.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Listings Grid */}
          {fetching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(8)].map((_, i) => <div key={i} className="shimmer" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontWeight: 700 }}>No listings found</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 6 }}>
                {onlyGreatDeals ? 'No listings matched the Great Deals filter. Try toggling it off.' : 'Try adjusting your filters or search terms.'}
              </p>
              {onlyGreatDeals && (
                <button className="btn-secondary" style={{ marginTop: 14 }} onClick={() => setOnlyGreatDeals(false)}>
                  Show All Deals
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
              {filteredListings.map((l, i) => {
                const deal = l.mlDeal;
                const isGreatDeal = deal?.dealRating === 'GREAT_DEAL';
                const isFairDeal = deal?.dealRating === 'FAIR_PRICE';

                return (
                  <div
                    key={l.id}
                    className="glass glass-hover animate-fade-in"
                    style={{
                      overflow: 'hidden',
                      animationDelay: `${i * 0.04}s`,
                      border: isGreatDeal ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Image + Badges */}
                      <div style={{ position: 'relative', height: 170, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                        <img
                          src={getCropImageUrl(l.cropName, l.images)}
                          alt={l.cropName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                          onError={(e: any) => { e.currentTarget.src = '/crops/rice.jpg'; }}
                        />
                        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          {l.qualityGrade && <span className="badge badge-gold">Grade {l.qualityGrade}</span>}
                          {deal && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: 6,
                                backdropFilter: 'blur(8px)',
                                background: isGreatDeal
                                  ? 'rgba(16, 185, 129, 0.9)'
                                  : (isFairDeal ? 'rgba(59, 130, 246, 0.85)' : 'rgba(234, 88, 12, 0.85)'),
                                color: '#ffffff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                letterSpacing: '0.2px'
                              }}
                            >
                              {deal.dealBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <h3 style={{ fontWeight: 700, fontSize: 18 }}>{l.cropName}</h3>
                          {deal && (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              Fair Est: ₹{deal.fairPricePerKg}/kg
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                          🧑‍🌾 {l.farmer.name}
                          {l.farmer.avgRating && <span style={{ marginLeft: 8 }}>⭐ {l.farmer.avgRating}</span>}
                          {l.farmer.address && <span style={{ display: 'block', marginTop: 2, fontSize: 12 }}>📍 {l.farmer.address}</span>}
                        </div>

                        {/* Price & Quantity */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Farmer Price</span>
                            <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-gold-light)' }}>₹{l.pricePerKg}/kg</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Available Stock</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{l.quantityKg.toLocaleString('en-IN')} kg</span>
                          </div>
                        </div>

                        {l.description && (
                          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                            {l.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '0 16px 16px 16px' }}>
                      <button
                        className="btn-primary"
                        style={{ width: '100%', fontSize: 13 }}
                        onClick={() => { setOrderModal(l); setOrderForm(f => ({ ...f, quantityKg: Math.min(100, l.quantityKg).toString() })); }}
                      >
                        🛒 Order Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {Math.ceil(total / 16) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32 }}>
              <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span style={{ padding: '12px 20px', fontSize: 14, color: 'var(--color-text-secondary)' }}>Page {page} of {Math.ceil(total / 16)}</span>
              <button className="btn-secondary" disabled={page >= Math.ceil(total / 16)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </main>

      {/* Order Modal with ML Fair Price & Savings Gauge */}
      {orderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24, backdropFilter: 'blur(4px)' }}>
          <div className="glass animate-fade-in" style={{ maxWidth: 500, width: '100%', padding: 30, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Place Order</h2>
              {orderModal.mlDeal && (
                <span className="badge badge-gold" style={{ fontSize: 11 }}>
                  {orderModal.mlDeal.dealBadge}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
              {orderModal.cropName} (Grade {orderModal.qualityGrade || 'Standard'}) from {orderModal.farmer.name}
            </p>

            {/* ML Pricing Insight Card */}
            {orderModal.mlDeal && (
              <div style={{ padding: 14, background: 'rgba(59, 130, 246, 0.08)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>ML Fair Market Price:</span>
                  <span style={{ fontWeight: 600 }}>₹{orderModal.mlDeal.fairPricePerKg}/kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Farmer Listed Price:</span>
                  <span className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>₹{orderModal.pricePerKg}/kg</span>
                </div>
                {orderModal.mlDeal.differencePct < 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#34D399', fontWeight: 600, borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 6 }}>
                    <span>Estimated Buyer Advantage:</span>
                    <span>{Math.abs(orderModal.mlDeal.differencePct)}% below estimated market</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Quantity (kg) *</label>
                <input className="input-field" type="number" step="0.1" max={orderModal.quantityKg} value={orderForm.quantityKg} onChange={e => setOrderForm(f => ({ ...f, quantityKg: e.target.value }))} />
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Max: {orderModal.quantityKg} kg available</div>
              </div>

              {orderForm.quantityKg && (
                <div className="glass stat-glow-gold" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, display: 'block' }}>Total Order Amount</span>
                    <span className="font-display" style={{ fontWeight: 800, color: 'var(--color-gold-light)', fontSize: 22 }}>
                      ₹{(parseFloat(orderForm.quantityKg || '0') * orderModal.pricePerKg).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {orderModal.mlDeal && orderModal.mlDeal.savingsPerKg > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#34D399', display: 'block', fontWeight: 600 }}>Total Estimated Savings</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#34D399' }}>
                        ₹{Math.round(parseFloat(orderForm.quantityKg || '0') * orderModal.mlDeal.savingsPerKg).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
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

              <div className="glass" style={{ padding: 12, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', gap: 10, background: 'rgba(74,144,217,0.08)', borderColor: 'rgba(74,144,217,0.2)' }}>
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
