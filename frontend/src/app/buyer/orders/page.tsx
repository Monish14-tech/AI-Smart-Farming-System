'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import OpenStreetMap, { MapMarker } from '@/components/OpenStreetMap';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  quantityKg: number;
  totalPrice: number;
  createdAt: string;
  deliveryAddress: string;
  notes?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  listing: {
    cropName: string;
    pricePerKg: number;
    images: string[];
    latitude?: number;
    longitude?: number;
    farmer: { id: string; name: string; phone: string; address: string };
  };
  transportJob: {
    status: string;
    otpCode?: string;
    pickupLat?: number;
    pickupLng?: number;
    dropLat?: number;
    dropLng?: number;
    transporter?: {
      id?: string;
      name: string;
      phone: string;
      transporterProfile?: { vehicleType: string; vehicleNumber: string; currentLatitude?: number; currentLongitude?: number };
    };
  } | null;
  reviews?: Review[];
}

const statusSteps = ['pending', 'confirmed', 'in_transit', 'delivered'];

export default function BuyerOrders() {
  const { user, loading } = useRequireRole('buyer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Live Socket.IO telematics coordinates: orderId -> { lat, lng }
  const [livePositions, setLivePositions] = useState<Record<string, { lat: number; lng: number }>>({});
  const [socketConnected, setSocketConnected] = useState(false);

  // Review Modal state
  const [reviewModalOrder, setReviewModalOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dispute Modal state
  const [disputeModalOrder, setDisputeModalOrder] = useState<Order | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('Quality mismatch / Produce not as described');
  const [disputeDescription, setDisputeDescription] = useState<string>('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/buyer/orders');
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  // Socket.IO Live Telematics subscription
  useEffect(() => {
    if (!user || orders.length === 0) return;
    const socket = getSocket();
    if (!socket) return;

    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Join room for each active order
    orders.forEach((o) => {
      socket.emit('join:order', o.id);
      const channel = `order:${o.id}:location`;
      socket.on(channel, (data: any) => {
        if (data?.latitude && data?.longitude) {
          setLivePositions((prev) => ({
            ...prev,
            [o.id]: { lat: data.latitude, lng: data.longitude },
          }));
        }
      });
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      orders.forEach((o) => {
        socket.off(`order:${o.id}:location`);
      });
    };
  }, [user, orders]);

  // Submit Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;

    setSubmittingReview(true);
    try {
      await api.post(`/buyer/orders/${reviewModalOrder.id}/review`, {
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      toast.success('Thank you! Your rating and review have been published. ⭐');
      setReviewModalOrder(null);
      setReviewComment('');
      setReviewRating(5);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit Dispute Handler
  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalOrder) return;

    setSubmittingDispute(true);
    try {
      await api.post(`/buyer/orders/${disputeModalOrder.id}/dispute`, {
        reason: disputeReason,
        description: disputeDescription || undefined,
      });
      toast.success('Dispute reported. Our operations team is investigating the shipment.');
      setDisputeModalOrder(null);
      setDisputeDescription('');
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to report issue');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>My Orders</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{orders.length} wholesale orders placed</p>
            </div>
            {socketConnected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 20, fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
                Live Telematics Active
              </div>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={filter === s ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: 13, padding: '7px 14px' }}
              >
                {s === 'all' ? `All (${orders.length})` : s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="shimmer" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h2 style={{ fontWeight: 700 }}>No orders found</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Orders matching this status will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((o) => {
                const step = statusSteps.indexOf(o.status);
                const hasDispute = o.notes?.includes('[DISPUTE RAISED');
                const existingReview = o.reviews && o.reviews.length > 0 ? o.reviews[0] : null;

                // Live coords from socket or database fallback
                const liveLat = livePositions[o.id]?.lat ?? o.transportJob?.transporter?.transporterProfile?.currentLatitude;
                const liveLng = livePositions[o.id]?.lng ?? o.transportJob?.transporter?.transporterProfile?.currentLongitude;

                return (
                  <div key={o.id} className="glass animate-fade-in" style={{ padding: 24, borderRadius: 16 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{o.listing.cropName}</h3>
                          {hasDispute && (
                            <span className="badge badge-amber" style={{ fontSize: 11, fontWeight: 700 }}>
                              ⚠️ Dispute Registered
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                          <span>🧑‍🌾 {o.listing.farmer.name}</span>
                          <span>📞 {o.listing.farmer.phone}</span>
                          <span>⚖️ {o.quantityKg.toLocaleString('en-IN')} kg</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                          📍 Deliver to: {o.deliveryAddress}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-gold-light)' }}>
                          ₹{o.totalPrice.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {new Date(o.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <span
                          className={`badge ${
                            o.paymentStatus === 'paid'
                              ? 'badge-green'
                              : o.paymentStatus === 'refunded'
                              ? 'badge-red'
                              : 'badge-blue'
                          }`}
                          style={{ marginTop: 6 }}
                        >
                          {o.paymentStatus === 'escrowed' ? '🔒 Escrow Held' : o.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    {o.status !== 'cancelled' && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          {statusSteps.map((s, i) => (
                            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  margin: '0 auto 4px',
                                  background: i <= step ? 'var(--color-moss)' : 'var(--color-surface-3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  color: 'white',
                                  fontWeight: 700,
                                }}
                              >
                                {i <= step ? '✓' : i + 1}
                              </div>
                              <div style={{ fontSize: 10, color: i <= step ? 'var(--color-leaf)' : 'var(--color-text-muted)' }}>
                                {s.replace('_', ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.max(0, (step / (statusSteps.length - 1)) * 100)}%`,
                              background: 'linear-gradient(90deg, var(--color-moss), var(--color-leaf))',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Transporter telematics info */}
                    {o.transportJob?.transporter && (
                      <div className="glass" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap', borderRadius: 12 }}>
                        <span style={{ fontSize: 24 }}>🚛</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{o.transportJob.transporter.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {o.transportJob.transporter.transporterProfile?.vehicleType} · {o.transportJob.transporter.transporterProfile?.vehicleNumber}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            📞 {o.transportJob.transporter.phone}
                          </div>
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`badge ${o.transportJob.status === 'delivered' ? 'badge-green' : 'badge-amber'}`}>
                            {o.transportJob.status.replace('_', ' ')}
                          </span>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: 12, padding: '6px 12px' }}
                            onClick={() => setActiveTrackingOrderId(activeTrackingOrderId === o.id ? null : o.id)}
                          >
                            {activeTrackingOrderId === o.id ? 'Hide Live Map ✕' : '📍 Track on Map'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Live OpenStreetMap telematics */}
                    {activeTrackingOrderId === o.id && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            🗺️ Live Route Telematics (OpenStreetMap)
                          </span>
                          {livePositions[o.id] && (
                            <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                              🟢 Transporter GPS Live Streaming
                            </span>
                          )}
                        </div>
                        <OpenStreetMap
                          markers={[
                            ...(o.listing.latitude && o.listing.longitude
                              ? [
                                  {
                                    lat: o.listing.latitude,
                                    lng: o.listing.longitude,
                                    type: 'pickup' as const,
                                    label: `Farm: ${o.listing.farmer.name}`,
                                    popupText: `Produce origin: ${o.listing.farmer.address || 'Farm'}`,
                                  },
                                ]
                              : []),
                            ...(o.deliveryLat && o.deliveryLng
                              ? [
                                  {
                                    lat: o.deliveryLat,
                                    lng: o.deliveryLng,
                                    type: 'drop' as const,
                                    label: 'Delivery Destination',
                                    popupText: o.deliveryAddress,
                                  },
                                ]
                              : []),
                            ...(liveLat && liveLng
                              ? [
                                  {
                                    lat: liveLat,
                                    lng: liveLng,
                                    type: 'transporter' as const,
                                    label: `Transporter: ${o.transportJob?.transporter?.name || 'Driver'}`,
                                    popupText: `Live position (${liveLat.toFixed(4)}, ${liveLng.toFixed(4)})`,
                                  },
                                ]
                              : []),
                          ]}
                          height={280}
                        />
                      </div>
                    )}

                    {/* Delivery OTP for Escrow Release */}
                    {o.transportJob?.otpCode && (o.status === 'confirmed' || o.status === 'in_transit') && (
                      <div
                        className="glass stat-glow-gold"
                        style={{
                          padding: 14,
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                          background: 'rgba(212,160,23,0.08)',
                          borderColor: 'rgba(212,160,23,0.25)',
                          borderRadius: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, color: '#FFCC80', fontWeight: 600 }}>🔐 DELIVERY CONFIRMATION OTP</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            Share this 6-digit code with the transporter only after inspecting and receiving your produce:
                          </div>
                        </div>
                        <div
                          className="font-display"
                          style={{
                            fontSize: 22,
                            fontWeight: 900,
                            letterSpacing: 4,
                            color: 'var(--color-gold-light)',
                            padding: '6px 14px',
                            background: 'var(--color-surface-2)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-gold-dark)',
                          }}
                        >
                          {o.transportJob.otpCode}
                        </div>
                      </div>
                    )}

                    {/* Action Footer: Review & Dispute */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 10 }}>
                      {/* Left: Review Status / Button */}
                      <div>
                        {o.status === 'delivered' ? (
                          existingReview ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#059669', background: '#ECFDF5', padding: '6px 12px', borderRadius: 8, border: '1px solid #A7F3D0' }}>
                              <span>{'★'.repeat(existingReview.rating)}</span>
                              <span style={{ fontWeight: 600 }}>Reviewed ({existingReview.rating}/5)</span>
                              {existingReview.comment && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>— "{existingReview.comment}"</span>}
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewModalOrder(o)}
                              className="btn-primary"
                              style={{ fontSize: 13, padding: '6px 14px', background: 'linear-gradient(135deg, #059669, #10B981)' }}
                            >
                              ⭐ Rate & Review Farmer
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {o.status === 'in_transit' ? '🚚 Shipment on the way' : 'Order awaiting delivery'}
                          </span>
                        )}
                      </div>

                      {/* Right: Dispute / Report button */}
                      <div>
                        {o.status !== 'delivered' && o.status !== 'cancelled' && (
                          <button
                            onClick={() => setDisputeModalOrder(o)}
                            className="btn-secondary"
                            style={{ fontSize: 12, padding: '5px 12px', color: '#DC2626', borderColor: '#FCA5A5' }}
                          >
                            ⚠️ Report Issue / Dispute
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Rate & Review Modal ────────────────────────────────────── */}
      {reviewModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 460, padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Rate & Review Farmer</h2>
              <button onClick={() => setReviewModalOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              How was your produce quality from <strong>{reviewModalOrder.listing.farmer.name}</strong> for <strong>{reviewModalOrder.listing.cropName}</strong>?
            </p>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Rating (1 to 5 Stars)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{
                        fontSize: 28,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: star <= reviewRating ? '#F59E0B' : '#D1D5DB',
                        transition: 'transform 0.1s',
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 8, alignSelf: 'center', color: '#D97706' }}>
                    {reviewRating} of 5
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Feedback / Comments (Optional)</label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Share details on freshness, moisture, packaging, or transaction experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setReviewModalOrder(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingReview} className="btn-primary">
                  {submittingReview ? 'Publishing...' : '⭐ Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dispute / Report Issue Modal ──────────────────────────── */}
      {disputeModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 480, padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>⚠️</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#DC2626' }}>Report Issue / Dispute Order</h2>
              </div>
              <button onClick={() => setDisputeModalOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Flagging an issue notifies platform administration and pauses automatic escrow settlement for <strong>{disputeModalOrder.listing.cropName}</strong>.
            </p>

            <form onSubmit={handleSubmitDispute} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Reason for Dispute</label>
                <select
                  className="input-field"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                >
                  <option value="Quality mismatch / Produce not as described">Quality mismatch / Produce not as described</option>
                  <option value="Damaged or spoiled lot upon arrival">Damaged or spoiled lot upon arrival</option>
                  <option value="Transporter severely delayed or unresponsive">Transporter severely delayed or unresponsive</option>
                  <option value="Quantity shortage / Inaccurate weight">Quantity shortage / Inaccurate weight</option>
                  <option value="Farmer cancellation dispute">Farmer cancellation dispute</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  className="input-field"
                  placeholder="Explain what occurred so the dispute moderator can issue a determination or refund..."
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setDisputeModalOrder(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingDispute} className="btn-danger" style={{ padding: '8px 16px' }}>
                  {submittingDispute ? 'Logging Issue...' : '🚨 Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
