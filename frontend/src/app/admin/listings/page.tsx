'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import { getCropImageUrl } from '@/lib/cropImages';
import toast from 'react-hot-toast';

interface Listing {
  id: string;
  cropName: string;
  qualityGrade: string;
  quantityKg: number;
  pricePerKg: number;
  status: string;
  images: string[];
  createdAt: string;
  farmer: { name: string; email: string };
}

export default function AdminListings() {
  const { user, loading } = useRequireRole('admin');
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);

  const loadListings = async () => {
    setFetching(true);
    try {
      const { data } = await api.get(`/admin/listings?status=${statusFilter}&page=${page}`);
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) loadListings();
  }, [user, statusFilter, page]);

  const handleModerate = async (id: string, newStatus: 'active' | 'cancelled') => {
    try {
      await api.put(`/admin/listings/${id}/moderate`, { status: newStatus });
      toast.success(`Listing marked as ${newStatus}`);
      loadListings();
    } catch {
      toast.error('Failed to update listing');
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div className="animate-fade-in" style={{ marginBottom: 28 }}>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              Listing Moderation
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              Review, moderate, and manage platform crop listings ({total} total)
            </p>
          </div>

          {/* Filter tabs */}
          <div className="glass" style={{ padding: 12, marginBottom: 24, display: 'inline-flex', gap: 8 }}>
            {['active', 'sold', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={statusFilter === s ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: 13, padding: '8px 18px', textTransform: 'capitalize' }}
              >
                {s}
              </button>
            ))}
          </div>

          {fetching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shimmer" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h2 style={{ fontWeight: 700, marginBottom: 8 }}>No {statusFilter} listings</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>All caught up on moderation.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {listings.map(l => (
                <div key={l.id} className="glass glass-hover animate-fade-in" style={{ overflow: 'hidden' }}>
                  <div style={{ position: 'relative', height: 160, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                    <img
                      src={getCropImageUrl(l.cropName, l.images)}
                      alt={l.cropName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                      <span className={`badge ${l.status === 'active' ? 'badge-green' : l.status === 'sold' ? 'badge-blue' : 'badge-red'}`}>
                        {l.status}
                      </span>
                      {l.qualityGrade && <span className="badge badge-gold">Grade {l.qualityGrade}</span>}
                    </div>
                  </div>

                  <div style={{ padding: 18 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{l.cropName}</h3>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                      🧑‍🌾 Farmer: {l.farmer.name} ({l.farmer.email})
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                      <div style={{ padding: '10px 12px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>QUANTITY</div>
                        <div style={{ fontWeight: 700 }}>{l.quantityKg.toLocaleString('en-IN')} kg</div>
                      </div>
                      <div style={{ padding: '10px 12px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>PRICE</div>
                        <div className="font-display" style={{ fontWeight: 800, color: 'var(--color-gold)' }}>₹{l.pricePerKg}/kg</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {l.status === 'cancelled' ? (
                        <button
                          onClick={() => handleModerate(l.id, 'active')}
                          className="btn-primary"
                          style={{ flex: 1, fontSize: 12, padding: '8px' }}
                        >
                          ✓ Restore to Active
                        </button>
                      ) : (
                        <button
                          onClick={() => handleModerate(l.id, 'cancelled')}
                          className="btn-danger"
                          style={{ flex: 1, fontSize: 12, padding: '8px' }}
                        >
                          ✕ Cancel / Delist
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {Math.ceil(total / 20) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
              <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ← Previous
              </button>
              <span style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button className="btn-secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
