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

export default function FarmerListings() {
  const { user, loading } = useRequireRole('farmer');
  const [listings, setListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(true);

  const loadListings = async () => {
    try {
      const { data } = await api.get('/farmer/listings');
      setListings(data.listings || []);
    } catch { toast.error('Failed to load listings'); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (user) loadListings(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this listing?')) return;
    try {
      await api.delete(`/farmer/listings/${id}`);
      toast.success('Listing cancelled');
      loadListings();
    } catch { toast.error('Failed to cancel listing'); }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>My Listings</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{listings.length} listings total</p>
            </div>
            <Link href="/farmer/listings/new" className="btn-primary">+ Add Listing</Link>
          </div>

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
                      <div className="badge badge-amber" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                        📦 {l.orders.filter(o => o.status === 'pending').length} pending order(s)
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/farmer/listings/${l.id}/edit`} className="btn-secondary" style={{ flex: 1, fontSize: 12, padding: '7px 12px', justifyContent: 'center' }}>Edit</Link>
                      <button onClick={() => handleDelete(l.id)} className="btn-danger" style={{ flex: 1, fontSize: 12, padding: '7px 12px', justifyContent: 'center' }}>
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
