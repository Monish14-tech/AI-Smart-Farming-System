'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import OpenStreetMap, { MapMarker } from '@/components/OpenStreetMap';
import toast from 'react-hot-toast';

interface Order {
  id: string; status: string; paymentStatus: string; quantityKg: number; totalPrice: number; createdAt: string;
  deliveryAddress: string; notes: string;
  deliveryLat?: number; deliveryLng?: number;
  listing: { cropName: string; pricePerKg: number; images: string[]; latitude?: number; longitude?: number; farmer: { name: string; phone: string; address: string } };
  transportJob: {
    status: string; otpCode?: string; pickupLat?: number; pickupLng?: number; dropLat?: number; dropLng?: number;
    transporter?: {
      name: string; phone: string;
      transporterProfile?: { vehicleType: string; vehicleNumber: string; currentLatitude?: number; currentLongitude?: number };
    };
  } | null;
}

const statusSteps = ['pending', 'confirmed', 'in_transit', 'delivered'];

export default function BuyerOrders() {
  const { user, loading } = useRequireRole('buyer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/buyer/orders')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setFetching(false));
  }, [user]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ marginBottom: 28 }}>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>My Orders</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{orders.length} orders placed</p>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={filter === s ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 13, padding: '7px 14px' }}>
                {s === 'all' ? `All (${orders.length})` : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h2 style={{ fontWeight: 700 }}>No orders yet</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Start shopping to see your orders here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map(o => {
                const step = statusSteps.indexOf(o.status);
                return (
                  <div key={o.id} className="glass animate-fade-in" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{o.listing.cropName}</h3>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span>🧑‍🌾 {o.listing.farmer.name}</span>
                          <span>📞 {o.listing.farmer.phone}</span>
                          <span>⚖️ {o.quantityKg} kg</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>📍 Deliver to: {o.deliveryAddress}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-gold-light)' }}>₹{o.totalPrice.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                        <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : 'badge-blue'}`} style={{ marginTop: 6 }}>{o.paymentStatus}</span>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    {o.status !== 'cancelled' && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          {statusSteps.map((s, i) => (
                            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', margin: '0 auto 4px', background: i <= step ? 'var(--color-moss)' : 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700 }}>
                                {i <= step ? '✓' : i + 1}
                              </div>
                              <div style={{ fontSize: 10, color: i <= step ? 'var(--color-leaf)' : 'var(--color-text-muted)' }}>{s.replace('_', ' ')}</div>
                            </div>
                          ))}
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.max(0, (step / (statusSteps.length - 1)) * 100)}%`, background: 'linear-gradient(90deg, var(--color-moss), var(--color-leaf))' }} />
                        </div>
                      </div>
                    )}

                    {/* Transporter info */}
                    {o.transportJob?.transporter && (
                      <div className="glass" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 24 }}>🚛</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{o.transportJob.transporter.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {o.transportJob.transporter.transporterProfile?.vehicleType} · {o.transportJob.transporter.transporterProfile?.vehicleNumber}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>📞 {o.transportJob.transporter.phone}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`badge ${o.transportJob.status === 'delivered' ? 'badge-green' : 'badge-amber'}`}>
                            {o.transportJob.status.replace('_', ' ')}
                          </span>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: 12, padding: '6px 12px' }}
                            onClick={() => setActiveTrackingOrderId(activeTrackingOrderId === o.id ? null : o.id)}
                          >
                            {activeTrackingOrderId === o.id ? 'Hide Map ✕' : '📍 Track on Map'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expandable Live OpenStreetMap */}
                    {activeTrackingOrderId === o.id && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                          🗺️ Live Route & Transporter Geolocation (OpenStreetMap)
                        </div>
                        <OpenStreetMap
                          markers={[
                            ...(o.listing.latitude && o.listing.longitude ? [{
                              lat: o.listing.latitude,
                              lng: o.listing.longitude,
                              type: 'pickup' as const,
                              label: `Farm: ${o.listing.farmer.name}`,
                              popupText: `Produce origin: ${o.listing.farmer.address || 'Farm'}`,
                            }] : []),
                            ...(o.deliveryLat && o.deliveryLng ? [{
                              lat: o.deliveryLat,
                              lng: o.deliveryLng,
                              type: 'drop' as const,
                              label: 'Delivery Destination',
                              popupText: o.deliveryAddress,
                            }] : []),
                            ...(o.transportJob?.transporter?.transporterProfile?.currentLatitude && o.transportJob?.transporter?.transporterProfile?.currentLongitude ? [{
                              lat: o.transportJob.transporter.transporterProfile.currentLatitude,
                              lng: o.transportJob.transporter.transporterProfile.currentLongitude,
                              type: 'transporter' as const,
                              label: `Transporter: ${o.transportJob.transporter.name}`,
                              popupText: `Vehicle: ${o.transportJob.transporter.transporterProfile.vehicleNumber}`,
                            }] : []),
                          ]}
                          height={280}
                        />
                      </div>
                    )}

                    {/* Delivery OTP for Escrow Release */}
                    {o.transportJob?.otpCode && (o.status === 'confirmed' || o.status === 'in_transit') && (
                      <div className="glass stat-glow-gold" style={{ padding: 14, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: 'rgba(212,160,23,0.08)', borderColor: 'rgba(212,160,23,0.25)' }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#FFCC80', fontWeight: 600 }}>🔐 DELIVERY CONFIRMATION OTP</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Share this 6-digit code with the transporter only after inspecting and receiving your produce:</div>
                        </div>
                        <div className="font-display" style={{ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: 'var(--color-gold-light)', padding: '6px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gold-dark)' }}>
                          {o.transportJob.otpCode}
                        </div>
                      </div>
                    )}
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
