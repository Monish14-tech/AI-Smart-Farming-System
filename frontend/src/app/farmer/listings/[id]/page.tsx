'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import { getCropImageUrl } from '@/lib/cropImages';
import toast from 'react-hot-toast';

interface Listing {
  id: string;
  cropName: string;
  qualityGrade?: string;
  quantityKg: number;
  pricePerKg: number;
  harvestDate?: string;
  description?: string;
  status: string;
  images: string[];
  latitude?: number;
  longitude?: number;
  createdAt: string;
  orders?: Array<{
    id: string;
    quantityKg: number;
    totalPrice: number;
    status: string;
    buyer: { name: string; phone: string };
  }>;
}

export default function ListingDetailPage() {
  const { user, loading } = useRequireRole('farmer');
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [mlData, setMlData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user || !listingId) return;

    api.get(`/farmer/listings/${listingId}`)
      .then(async ({ data }) => {
        const l = data.listing;
        setListing(l);
        if (l) {
          try {
            const mlRes = await api.get(`/ml/buyer/fair-price?cropName=${encodeURIComponent(l.cropName)}&qualityGrade=${l.qualityGrade || 'A'}&quantityKg=${l.quantityKg}`);
            setMlData(mlRes.data);
          } catch { /* ignore ML error */ }
        }
      })
      .catch(() => {
        toast.error('Failed to load listing');
        router.push('/farmer/listings');
      })
      .finally(() => setFetching(false));
  }, [user, listingId, router]);

  const handleCancelListing = async () => {
    if (!confirm('Are you sure you want to cancel this listing?')) return;
    try {
      await api.delete(`/farmer/listings/${listingId}`);
      toast.success('Listing cancelled');
      router.push('/farmer/listings');
    } catch {
      toast.error('Failed to cancel listing');
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content" style={{ maxWidth: 980 }}>
          {/* Top navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <Link href="/farmer/listings" className="btn-secondary" style={{ fontSize: 13, textDecoration: 'none' }}>
              ← Back to My Listings
            </Link>
            {listing && listing.status === 'active' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Link href={`/farmer/listings/${listing.id}/edit`} className="btn-secondary" style={{ fontSize: 13, textDecoration: 'none' }}>
                  ✏️ Edit Listing
                </Link>
                <button onClick={handleCancelListing} className="btn-danger" style={{ fontSize: 13 }}>
                  Cancel Listing
                </button>
              </div>
            )}
          </div>

          {fetching ? (
            <div className="shimmer" style={{ height: 380, borderRadius: 16 }} />
          ) : !listing ? (
            <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
              <h2>Listing Not Found</h2>
              <Link href="/farmer/listings" className="btn-primary" style={{ marginTop: 14 }}>
                Return to Listings
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Hero Banner & Image */}
              <div className="glass" style={{ padding: 24, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                  {/* Photo */}
                  <div style={{ height: 260, borderRadius: 14, overflow: 'hidden', position: 'relative', background: 'var(--color-surface-2)' }}>
                    <img
                      src={getCropImageUrl(listing.cropName, listing.images)}
                      alt={listing.cropName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e: any) => { e.currentTarget.src = '/crops/rice.jpg'; }}
                    />
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                      <span className={`badge ${listing.status === 'active' ? 'badge-green' : listing.status === 'sold' ? 'badge-blue' : 'badge-red'}`}>
                        {listing.status.toUpperCase()}
                      </span>
                      {listing.qualityGrade && (
                        <span className="badge badge-gold" style={{ fontWeight: 800 }}>
                          Grade {listing.qualityGrade}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lot Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px 0' }}>
                        {listing.cropName}
                      </h1>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 18px 0', lineHeight: 1.5 }}>
                        {listing.description || 'Verified direct-from-farm produce lot available for wholesale acquisition.'}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 18 }}>
                        <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>AVAILABLE VOLUME</span>
                          <span style={{ fontSize: 20, fontWeight: 800 }}>{listing.quantityKg.toLocaleString('en-IN')} kg</span>
                        </div>
                        <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>UNIT PRICE</span>
                          <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-gold-light)' }}>
                            ₹{listing.pricePerKg}/kg
                          </span>
                        </div>
                        <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>ESTIMATED LOT VALUE</span>
                          <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>
                            ₹{(listing.quantityKg * listing.pricePerKg).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>HARVEST DATE</span>
                          <span style={{ fontSize: 15, fontWeight: 600 }}>
                            {listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString('en-IN') : 'Recent Harvest'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Listed on {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ML Intelligence Card */}
              {mlData?.prediction && (
                <div className="glass" style={{ padding: 22, borderRadius: 16, border: '1px solid #C7D2FE', background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 22 }}>🧠</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1E1B4B' }}>
                        Machine Learning Market Valuation
                      </h3>
                      <span style={{ fontSize: 12, color: '#4338CA' }}>
                        Algorithmic price benchmarking from APMC mandi arrivals and regression models
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <div style={{ padding: 12, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E0E7FF' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>MODEL FAIR BENCHMARK</span>
                      <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>
                        ₹{mlData.prediction.fairPricePerKg}/kg
                      </span>
                    </div>
                    <div style={{ padding: 12, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E0E7FF' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>SEASONALITY STATUS</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#047857' }}>
                        {mlData.prediction.seasonalityStatus}
                      </span>
                    </div>
                    <div style={{ padding: 12, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E0E7FF' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>RECOMMENDED RANGE</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>
                        ₹{mlData.prediction.priceRange.min} – ₹{mlData.prediction.priceRange.max}/kg
                      </span>
                    </div>
                    <div style={{ padding: 12, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E0E7FF' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>CONFIDENCE SCORE</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#D97706' }}>
                        {mlData.prediction.confidenceScore}% Calibrated
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order History on this Listing */}
              <div className="glass" style={{ padding: 22, borderRadius: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                  Buyer Orders Placed on This Lot ({listing.orders?.length || 0})
                </h3>

                {!listing.orders || listing.orders.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                    No buyer orders placed on this lot yet. Orders will appear here as soon as commercial buyers initiate checkout.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {listing.orders.map((o) => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--color-surface-2)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{o.buyer.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📞 {o.buyer.phone}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700 }}>{o.quantityKg} kg · ₹{o.totalPrice.toLocaleString('en-IN')}</div>
                          <span className="badge badge-blue" style={{ fontSize: 11 }}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
