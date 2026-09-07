'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import OpenStreetMap, { MapMarker } from '@/components/OpenStreetMap';
import toast from 'react-hot-toast';

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

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/transporter/active');
      setJobs(data.jobs || []);
    } catch { toast.error('Failed to load active jobs'); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (user) loadJobs(); }, [user]);

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

                  <button className="btn-gold" style={{ width: '100%' }} onClick={() => setDeliverModal(j.id)}>
                    ✓ Confirm Delivery (Enter OTP)
                  </button>
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
    </div>
  );
}
