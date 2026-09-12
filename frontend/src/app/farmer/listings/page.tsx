'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import { getCropImageUrl } from '@/lib/cropImages';
import toast from 'react-hot-toast';

interface Listing {
  id: string; cropName: string; qualityGrade: string; quantityKg: number;
  pricePerKg: number; status: string; images: string[]; createdAt: string;
  orders: Array<{ id: string; status: string; quantityKg: number; totalPrice: number; buyer: { name: string; phone: string } }>;
}

interface HighDemandCrop {
  cropName: string;
  demandScore: number;
  demandTier: string;
  avgRealizedPrice: number;
  recommendedTargetPrice: number;
  seasonality: string;
  profitabilityRating: string;
  platformOrderCount: number;
}

export default function FarmerListings() {
  const { user, loading } = useRequireRole('farmer');
  const [listings, setListings] = useState<Listing[]>([]);
  const [demandCrops, setDemandCrops] = useState<HighDemandCrop[]>([]);
  const [fetching, setFetching] = useState(true);

  const loadData = async () => {
    try {
      const [listingsRes, demandRes] = await Promise.all([
        api.get('/farmer/listings'),
        api.get('/ml/farmer/crop-demand').catch(() => ({ data: { crops: [] } }))
      ]);
      setListings(listingsRes.data.listings || []);
      setDemandCrops((demandRes.data.crops || []).slice(0, 4));
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this listing?')) return;
    try {
      await api.delete(`/farmer/listings/${id}`);
      toast.success('Listing cancelled');
      loadData();
    } catch { toast.error('Failed to cancel listing'); }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>My Listings</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{listings.length} produce listings active</p>
            </div>
            <Link href="/farmer/listings/new" className="btn-primary">+ Add Listing</Link>
          </div>

          {/* ML High-Demand Crop Intelligence */}
          {demandCrops.length > 0 && (
            <div className="glass" style={{ padding: 20, marginBottom: 24, border: '1px solid rgba(212, 160, 23, 0.25)', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.7) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🧠</span>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                      ML High-Demand Crop Intelligence
                    </h2>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      What verified buyers are purchasing with highest margins on AgriNova
                    </span>
                  </div>
                </div>
                <span className="badge badge-gold" style={{ fontSize: 11 }}>Market Demand Forecast</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {demandCrops.map(c => (
                  <div key={c.cropName} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.cropName}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24' }}>
                        {c.demandTier}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Target Price:</span>
                      <span className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>
                        ₹{c.recommendedTargetPrice}/kg
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Margin:</span>
                      <span style={{ color: '#34D399', fontWeight: 600 }}>{c.profitabilityRating}</span>
                    </div>

                    <Link
                      href="/farmer/listings/new"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '5px 8px',
                        background: 'rgba(212, 160, 23, 0.15)',
                        color: 'var(--color-gold)',
                        borderRadius: 6,
                        textDecoration: 'none',
                        border: '1px solid rgba(212, 160, 23, 0.3)'
                      }}
                    >
                      + Create Listing for {c.cropName}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fetching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
              <h2 style={{ fontWeight: 700, marginBottom: 8 }}>No listings yet</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Start selling your produce by creating your first listing</p>
              <Link href="/farmer/listings/new" className="btn-primary">Create First Listing</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {listings.map(l => (
                <div key={l.id} className="glass glass-hover animate-fade-in" style={{ overflow: 'hidden' }}>
                  {/* Image */}
                  <div style={{ position: 'relative', height: 160, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                    <img
                      src={getCropImageUrl(l.cropName, l.images)}
                      alt={l.cropName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e: any) => { e.currentTarget.src = '/crops/rice.jpg'; }}
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                      <span className={`badge ${l.status === 'active' ? 'badge-green' : l.status === 'sold' ? 'badge-blue' : 'badge-red'}`}>
                        {l.status}
                      </span>
                      {l.qualityGrade && <span className="badge badge-gold">Grade {l.qualityGrade}</span>}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{l.cropName}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>QUANTITY</div>
                        <div style={{ fontWeight: 600 }}>{l.quantityKg.toLocaleString('en-IN')} kg</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>PRICE</div>
                        <div className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold)' }}>₹{l.pricePerKg}/kg</div>
                      </div>
                    </div>

                    {l.orders?.length > 0 && (
                      <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: 6, fontSize: 12, color: '#34D399' }}>
                        📦 {l.orders.length} buyer order(s) placed
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <Link href={`/farmer/listings/${l.id}/edit`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: 12, padding: '6px 12px' }}>
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(l.id)} className="btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
