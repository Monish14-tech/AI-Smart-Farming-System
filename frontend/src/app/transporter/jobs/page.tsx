'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface MLFreightSuggestion {
  distanceKm: number;
  cargoWeightKg: number;
  cropName?: string;
  vehicleType: string;
  suggestedFare: number;
  minViableCost: number;
  breakdown: {
    baseFare: number;
    distanceCharge: number;
    perKmRate: number;
    weightSurcharge: number;
    perishabilityHandling: number;
    fuelAdjustment: number;
  };
  confidence: number;
  priceRationale: string;
}

interface Job {
  id: string; status: string; earningAmount: number; createdAt: string;
  pickupAddress?: string; dropAddress?: string; estimatedKm?: number;
  pickupLat?: number; pickupLng?: number; dropLat?: number; dropLng?: number;
  order: {
    quantityKg: number; totalPrice: number;
    buyer: { name: string; phone: string; address: string };
    listing: { cropName: string; farmer: { name: string; phone: string; address: string; latitude?: number; longitude?: number } };
  };
  mlFreight?: MLFreightSuggestion;
}

export default function TransporterJobs() {
  const { user, loading } = useRequireRole('transporter');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/transporter/jobs');
      const rawJobs: Job[] = data.jobs || [];

      // Enrich jobs with ML Dynamic Freight rates
      const enrichedJobs = await Promise.all(
        rawJobs.map(async (j) => {
          try {
            const mlRes = await api.get(`/ml/transporter/rate-suggestion?jobId=${j.id}`);
            return {
              ...j,
              mlFreight: mlRes.data?.suggestion
            };
          } catch {
            return j;
          }
        })
      );

      setJobs(enrichedJobs);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { if (user) loadJobs(); }, [user]);

  const handleAccept = async (id: string) => {
    setAccepting(id);
    try {
      await api.post(`/transporter/jobs/${id}/accept`);
      toast.success('Job accepted! Collect OTP from buyer upon delivery to confirm.');
      loadJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to accept job');
    } finally {
      setAccepting(null);
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800 }}>
                  Available Jobs <span style={{ fontSize: 18, color: 'var(--color-gold)', fontWeight: 600 }}>✦ ML Dynamic Pricing</span>
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  {jobs.length} transport job(s) with multi-factor freight intelligence
                </p>
              </div>
              <span className="badge badge-gold" style={{ fontSize: 12 }}>
                Real-time Freight Regressor
              </span>
            </div>
          </div>

          {fetching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h2 style={{ fontWeight: 700 }}>No jobs available right now</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>New jobs appear when farmers confirm orders. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              {jobs.map(j => {
                const ml = j.mlFreight;
                const isExpanded = expandedBreakdown === j.id;

                return (
                  <div key={j.id} className="glass glass-hover animate-fade-in" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Crop & Pricing Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{j.order.listing.cropName}</h3>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            Weight: {j.order.quantityKg} kg
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="font-display" style={{ color: 'var(--color-gold)', fontWeight: 800, fontSize: 20, display: 'block' }}>
                            ₹{(ml ? ml.suggestedFare : (j.earningAmount || j.order.totalPrice * 0.05)).toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>
                            {ml ? '✨ ML Suggested Rate' : 'Platform Rate'}
                          </span>
                        </div>
                      </div>

                      {/* Pickup & Drop Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, fontSize: 13, color: 'var(--color-text-secondary)', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ color: 'var(--color-leaf)', fontWeight: 600 }}>📦 Pickup:</span>
                          <span style={{ color: '#F1F5F9' }}>{j.order.listing.farmer.name} · {j.order.listing.farmer.address}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ color: '#FFCC80', fontWeight: 600 }}>🏁 Drop:</span>
                          <span style={{ color: '#F1F5F9' }}>{j.order.buyer.name} · {j.order.buyer.address}</span>
                        </div>
                      </div>

                      {/* ML Dynamic Pricing Factor Breakdown */}
                      {ml && (
                        <div style={{ marginBottom: 16 }}>
                          <button
                            type="button"
                            onClick={() => setExpandedBreakdown(isExpanded ? null : j.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-gold)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: 0
                            }}
                          >
                            <span>{isExpanded ? '▼ Hide ML Pricing Factors' : '▶ Show ML Pricing Breakdown'}</span>
                          </button>

                          {isExpanded && (
                            <div style={{ marginTop: 10, padding: 12, background: 'rgba(212, 160, 23, 0.06)', borderRadius: 8, border: '1px solid rgba(212, 160, 23, 0.2)', fontSize: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Base Flag Fall:</span>
                                <span>₹{ml.breakdown.baseFare}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Distance ({ml.distanceKm.toFixed(1)} km @ ₹{ml.breakdown.perKmRate}/km):</span>
                                <span>₹{ml.breakdown.distanceCharge}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Cargo Weight Surcharge ({ml.cargoWeightKg} kg):</span>
                                <span>₹{ml.breakdown.weightSurcharge}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Perishability Premium ({j.order.listing.cropName}):</span>
                                <span>₹{ml.breakdown.perishabilityHandling}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 6, fontWeight: 700 }}>
                                <span style={{ color: 'var(--color-gold)' }}>Total ML Suggested Quote:</span>
                                <span style={{ color: 'var(--color-gold)' }}>₹{ml.suggestedFare}</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.3 }}>
                                💡 {ml.priceRationale}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      className="btn-gold"
                      style={{ width: '100%', fontSize: 13 }}
                      onClick={() => handleAccept(j.id)}
                      disabled={accepting === j.id}
                    >
                      {accepting === j.id ? 'Accepting...' : '✓ Accept Job'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
