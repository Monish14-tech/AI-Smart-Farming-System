'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import OpenStreetMap, { MapMarker } from '@/components/OpenStreetMap';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function TransporterActive() {
  const { user, loading } = useRequireRole('transporter');
  const [jobs, setJobs] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deliverModal, setDeliverModal] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Arrival & Dispute Counter states
  const [markingArrival, setMarkingArrival] = useState<string | null>(null);
  const [disputeModalJob, setDisputeModalJob] = useState<any | null>(null);
  const [counterNotes, setCounterNotes] = useState('');
  const [counterEvidenceUrls, setCounterEvidenceUrls] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/transporter/active');
      setJobs(data.jobs || []);
    } catch { toast.error('Failed to load active jobs'); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (user) loadJobs(); }, [user]);

  const handleArrive = async (jobId: string) => {
    setMarkingArrival(jobId);
    try {
      await api.post(`/transporter/jobs/${jobId}/arrive`);
      toast.success('Arrival recorded! 48-Hour auto-settlement countdown started.');
      loadJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to mark arrival');
    } finally {
      setMarkingArrival(null);
    }
  };

  const handleSubmitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalJob) return;

    setSubmittingCounter(true);
    try {
      const urls = counterEvidenceUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      await api.post(`/transporter/jobs/${disputeModalJob.id}/dispute-counter`, {
        notes: counterNotes,
        evidenceUrls: urls,
      });

      toast.success('Transit log and evidence submitted to arbitrator.');
      setDisputeModalJob(null);
      setCounterNotes('');
      setCounterEvidenceUrls('');
      loadJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit transit defense');
    } finally {
      setSubmittingCounter(false);
    }
  };

  // Start GPS broadcasting
  useEffect(() => {
    if (!user || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        api.post('/transporter/gps', { latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [user]);

  const handleDeliver = async () => {
    if (!deliverModal || !otp) { toast.error('Enter OTP'); return; }
    setDelivering(true);
    try {
      await api.post(`/transporter/jobs/${deliverModal}/deliver`, { otp });
      toast.success('Delivery confirmed! Payment released to farmer. 🎉');
      setDeliverModal(null);
      setOtp('');
      loadJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Delivery confirmation failed');
    } finally { setDelivering(false); }
  };

  const handleOptimizeRoute = async () => {
    if (jobs.length === 0) return;
    setOptimizing(true);
    try {
      const { data } = await api.post('/transporter/route-optimize', { jobIds: jobs.map(j => j.id) });
      setRoute(data);
      toast.success(`Route optimized! Saves ${data.route?.savings?.vsNaiveKm?.toFixed(1)} km`);
    } catch { toast.error('Route optimization failed'); }
    finally { setOptimizing(false); }
  };

  // Build markers for OpenStreetMap
  const mapMarkers: MapMarker[] = [];
  jobs.forEach(j => {
    const pLat = j.pickupLat || j.order?.listing?.farmer?.latitude;
    const pLng = j.pickupLng || j.order?.listing?.farmer?.longitude;
    if (pLat && pLng) {
      mapMarkers.push({
        lat: pLat,
        lng: pLng,
        type: 'pickup',
        label: `Pickup: ${j.order?.listing?.cropName}`,
        popupText: `Farmer: ${j.order?.listing?.farmer?.name} (${j.pickupAddress || j.order?.listing?.farmer?.address || 'Pickup Point'})`,
      });
    }

    const dLat = j.dropLat || j.order?.deliveryLat;
    const dLng = j.dropLng || j.order?.deliveryLng;
    if (dLat && dLng) {
      mapMarkers.push({
        lat: dLat,
        lng: dLng,
        type: 'drop',
        label: `Drop: ${j.order?.buyer?.name}`,
        popupText: `Buyer: ${j.order?.buyer?.name} (${j.dropAddress || j.order?.deliveryAddress || 'Drop Point'})`,
      });
    }
  });

  if (currentCoords) {
    mapMarkers.push({
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      type: 'transporter',
      label: 'Your Vehicle',
      popupText: 'Current Live GPS Location',
    });
  }

  const routePoints: [number, number][] = route?.route?.nodes
    ? route.route.nodes.map((n: any) => [n.lat, n.lng])
    : [];

  if (loading || !user) return null;

  if (!user.isVerified) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main className="layout-main">
          <div className="page-content" style={{ maxWidth: 700, margin: '40px auto 0' }}>
            <div
              className="glass animate-fade-in"
              style={{
                padding: '48px 36px',
                textAlign: 'center',
                borderRadius: 24,
                border: '1px solid rgba(245, 158, 11, 0.4)',
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(0, 0, 0, 0) 100%)',
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
              <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
                Active Trips Locked — Verification Required
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 28, maxWidth: 520, margin: '0 auto 28px' }}>
                You cannot undertake or track active transport trips until your Commercial Driving License and vehicle specifications have been approved by an administrator.
              </p>

              <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                  href="/transporter/dashboard"
                  className="btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: 14,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #D97706, #B45309)',
                    borderColor: '#D97706',
                  }}
                >
                  📄 Go to Dashboard to Submit Verification
                </Link>
                <Link
                  href="/settings"
                  className="btn-secondary"
                  style={{ padding: '12px 24px', fontSize: 14 }}
                >
                  ⚙️ Update Profile Settings
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Active Trip</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{jobs.length} active job(s)</p>
            </div>
            {jobs.length > 1 && (
              <button className="btn-gold" onClick={handleOptimizeRoute} disabled={optimizing}>
                {optimizing ? '⏳ Optimizing...' : '🧭 Optimize Route (VRP)'}
              </button>
            )}
          </div>

          {/* Route optimization result */}
          {route && (
            <div className="glass stat-glow-green" style={{ padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🧭 Optimized Route Plan</h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 14 }}>{route.summary}</p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div><span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>TOTAL DISTANCE</span><br /><span className="font-display" style={{ fontWeight: 700, color: 'var(--color-leaf)' }}>{route.route?.totalDistanceKm} km</span></div>
                <div><span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ESTIMATED TIME</span><br /><span className="font-display" style={{ fontWeight: 700, color: 'var(--color-leaf)' }}>{route.route?.estimatedTimeMin} min</span></div>
                <div><span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>DISTANCE SAVED</span><br /><span className="font-display" style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>{route.route?.savings?.vsNaiveKm?.toFixed(1)} km ({route.route?.savings?.vsNaivePercent}%)</span></div>
              </div>

              {/* Route nodes */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {route.route?.nodes?.map((node: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: node.type === 'pickup' ? 'var(--color-moss)' : node.type === 'drop' ? 'var(--color-gold)' : 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 13 }}>{node.label}</span>
                    {node.type === 'pickup' && <span className="badge badge-green" style={{ fontSize: 10 }}>PICKUP</span>}
                    {node.type === 'drop' && <span className="badge badge-gold" style={{ fontSize: 10 }}>DROP</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live OpenStreetMap Route Visualizer */}
          {jobs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🗺️</span> Live Navigation & Route Map (OpenStreetMap)
                </h3>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {mapMarkers.length} mapped stop(s)
                </span>
              </div>
              <OpenStreetMap
                markers={mapMarkers}
                routeCoordinates={routePoints}
                height={340}
              />
            </div>
          )}

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(2)].map((_, i) => <div key={i} className="shimmer" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
              <h2 style={{ fontWeight: 700 }}>No active trips</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Accept a job to start a trip</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {jobs.map(j => (
                <div key={j.id} className="glass animate-fade-in" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{j.order.listing.cropName}</h3>
                      <span className="badge badge-amber">{j.status.replace('_', ' ')}</span>
                    </div>
                    <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-gold-light)' }}>
                      ₹{(j.earningAmount || 0).toLocaleString('en-IN')} earned
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div className="glass" style={{ padding: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>📦 PICKUP</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{j.order.listing.farmer.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{j.pickupAddress || j.order.listing.farmer.address}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>📞 {j.order.listing.farmer.phone}</div>
                    </div>
                    <div className="glass" style={{ padding: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>🏁 DROP</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{j.order.buyer.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{j.dropAddress || j.order.buyer.address}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>📞 {j.order.buyer.phone}</div>
                    </div>
                  </div>

                  {/* Consignment Arrived at Dock Status Banner */}
                  {j.status === 'arrived' && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>⏱️</span>
                      <div style={{ fontSize: 12 }}>
                        <strong style={{ color: '#D97706' }}>Consignment Arrived at Destination Dock</strong>
                        <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>
                          Collect OTP from the buyer to disburse payment immediately, or funds will auto-settle after the 48-hour inspection window.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Dispute Alert & Carrier Transit Statement */}
                  {j.order?.dispute && (
                    <div style={{ marginBottom: 14, padding: '12px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                        <strong style={{ color: '#DC2626', fontSize: 13 }}>
                          🚨 Buyer Reported Issue: {j.order.dispute.claimedIssue?.replace('_', ' ').toUpperCase()} ({j.order.dispute.claimedPercentage}% Claim)
                        </strong>
                        <span className="badge badge-amber" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                          {j.order.dispute.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        <strong>Buyer Claim:</strong> {j.order.dispute.buyerNotes}
                      </div>

                      {j.order.dispute.transporterNotes ? (
                        <div style={{ fontSize: 12, color: '#2563EB', marginTop: 6, background: 'rgba(37, 99, 235, 0.08)', padding: '6px 10px', borderRadius: 6 }}>
                          <strong>✓ Your Transit Statement:</strong> {j.order.dispute.transporterNotes}
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: 11, padding: '5px 12px', borderColor: '#2563EB', color: '#2563EB' }}
                            onClick={() => setDisputeModalJob(j)}
                          >
                            ✍️ Submit Transit Log / Photo Proof
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons: Arrival Trigger & OTP Confirmation */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {j.status !== 'arrived' && (
                      <button
                        className="btn-secondary"
                        style={{ flex: 1, minWidth: 160, borderColor: '#3B82F6', color: '#2563EB', fontSize: 13 }}
                        onClick={() => handleArrive(j.id)}
                        disabled={markingArrival === j.id}
                      >
                        {markingArrival === j.id ? 'Recording...' : '📍 Mark Arrived at Dock'}
                      </button>
                    )}
                    <button
                      className="btn-gold"
                      style={{ flex: 1.5, minWidth: 200 }}
                      onClick={() => setDeliverModal(j.id)}
                    >
                      ✓ Confirm Delivery (Enter OTP)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* OTP Modal */}
      {deliverModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24, backdropFilter: 'blur(4px)' }}>
          <div className="glass animate-fade-in" style={{ maxWidth: 360, width: '100%', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔢</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Enter Delivery OTP</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>Ask the buyer for the 6-digit OTP to confirm delivery and release payment</p>
            <input className="input-field" style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }} placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setDeliverModal(null); setOtp(''); }}>Cancel</button>
              <button className="btn-gold" style={{ flex: 2 }} onClick={handleDeliver} disabled={otp.length !== 6 || delivering}>
                {delivering ? 'Confirming...' : '✓ Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transporter Dispute Counter Modal ────────────────────────── */}
      {disputeModalJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="glass animate-fade-in" style={{ maxWidth: 480, width: '100%', padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>🚛</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Submit Transit Statement</h2>
              </div>
              <button onClick={() => setDisputeModalJob(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Provide cargo condition logs and transit observations for <strong>{disputeModalJob.order.listing.cropName}</strong>. The arbitrator will review your statement before releasing escrow.
            </p>

            <form onSubmit={handleSubmitCounter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Driver / Carrier Transit Log
                </label>
                <textarea
                  rows={4}
                  required
                  className="input-field"
                  placeholder="E.g., Produce was received dry at farm loading, covered with tarp, transit completed within 4 hours, unloaded directly at buyer dock..."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Photo URLs (Loading, odometer, or unloading - one per line)
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  placeholder="https://example.com/truck-loaded.jpg&#10;https://example.com/dock-unloaded.jpg"
                  value={counterEvidenceUrls}
                  onChange={(e) => setCounterEvidenceUrls(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setDisputeModalJob(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingCounter} className="btn-primary" style={{ padding: '8px 16px' }}>
                  {submittingCounter ? 'Submitting...' : '🛡️ Submit Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
