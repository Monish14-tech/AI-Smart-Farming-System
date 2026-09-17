'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface DisputeInfo {
  id: string;
  claimedIssue: string;
  claimedPercentage: number;
  buyerNotes: string;
  buyerEvidenceUrls: string[];
  farmerNotes?: string;
  farmerEvidenceUrls?: string[];
  transporterNotes?: string;
  status: string;
  refundAmount?: number;
  farmerSettledAmount?: number;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  quantityKg: number;
  totalPrice: number;
  platformFee?: number;
  farmerPayout?: number;
  arrivedAt?: string;
  autoReleaseAt?: string;
  createdAt: string;
  notes: string;
  buyer: { name: string; phone: string; email: string; address: string };
  listing: { cropName: string; pricePerKg: number; images: string[] };
  transportJob: { status: string; otpCode: string; transporter?: { name: string; phone: string } } | null;
  dispute?: DisputeInfo | null;
}

const statusColor: Record<string, string> = {
  pending: 'badge-gold',
  confirmed: 'badge-blue',
  in_transit: 'badge-amber',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

export default function FarmerOrders() {
  const { user, loading } = useRequireRole('farmer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState('all');

  // Counter-evidence modal state
  const [counterModalOrder, setCounterModalOrder] = useState<Order | null>(null);
  const [counterNotes, setCounterNotes] = useState('');
  const [counterEvidenceUrls, setCounterEvidenceUrls] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/farmer/orders');
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/farmer/orders/${id}/status`, { status });
      toast.success(`Order ${status}!`);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update order');
    }
  };

  const handleSubmitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModalOrder) return;

    setSubmittingCounter(true);
    try {
      const urls = counterEvidenceUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      await api.post(`/farmer/orders/${counterModalOrder.id}/dispute-counter`, {
        notes: counterNotes,
        evidenceUrls: urls,
      });

      toast.success('Counter-evidence submitted to arbitrator successfully!');
      setCounterModalOrder(null);
      setCounterNotes('');
      setCounterEvidenceUrls('');
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit counter-evidence');
    } finally {
      setSubmittingCounter(false);
    }
  };

  if (loading || !user) return null;

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Orders</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{orders.length} orders received</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={filter === s ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                {s === 'all' ? 'All Orders' : s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                {s !== 'all' && (
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>
                    ({orders.filter((o) => o.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="shimmer" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h2 style={{ fontWeight: 700 }}>No orders found</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Orders from buyers will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map((o) => {
                const netPayout = o.farmerPayout ?? Math.round(o.totalPrice * 0.98);
                const platformFee = o.platformFee ?? Math.round(o.totalPrice * 0.02);

                return (
                  <div key={o.id} className="glass animate-fade-in" style={{ padding: 22, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>{o.listing.cropName}</h3>
                          <span className={`badge ${statusColor[o.status] || 'badge-gold'}`}>
                            {o.status.replace('_', ' ')}
                          </span>
                          <span
                            className={`badge ${
                              o.paymentStatus === 'paid'
                                ? 'badge-green'
                                : o.paymentStatus === 'escrowed'
                                ? 'badge-blue'
                                : o.paymentStatus === 'disputed'
                                ? 'badge-amber'
                                : o.paymentStatus === 'partially_refunded'
                                ? 'badge-amber'
                                : 'badge-gold'
                            }`}
                          >
                            {o.paymentStatus === 'escrowed'
                              ? '🔒 Escrow Held (Nodal)'
                              : o.paymentStatus === 'paid'
                              ? '✅ Disbursed to Bank'
                              : o.paymentStatus === 'disputed'
                              ? '⚠️ Dispute Frozen'
                              : o.paymentStatus === 'partially_refunded'
                              ? '⚖️ Partially Settled'
                              : o.paymentStatus}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                          <span>👤 Buyer: <strong>{o.buyer.name}</strong></span>
                          <span>📞 {o.buyer.phone}</span>
                          <span>⚖️ {o.quantityKg.toLocaleString('en-IN')} kg</span>
                          <span>📍 {o.buyer.address}</span>
                        </div>

                        {o.transportJob && (
                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            🚛 Logistics: {o.transportJob.status.replace('_', ' ')} {o.transportJob.transporter && `· Carrier: ${o.transportJob.transporter.name}`}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-gold-light)' }}>
                          ₹{netPayout.toLocaleString('en-IN')} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>(Net Payout)</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Gross: ₹{o.totalPrice.toLocaleString('en-IN')} · Tech Infra Fee (2%): ₹{platformFee.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Ordered: {new Date(o.createdAt).toLocaleDateString('en-IN')}
                        </div>

                        {o.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <button onClick={() => handleStatus(o.id, 'confirmed')} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                              ✓ Confirm Order
                            </button>
                            <button onClick={() => handleStatus(o.id, 'cancelled')} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', color: '#EF9A9A', cursor: 'pointer' }}>
                              ✕ Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transporter Arrival & 48-Hour Auto-Settlement Notice */}
                    {o.arrivedAt && o.status !== 'delivered' && o.status !== 'cancelled' && (
                      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>⏱️</span>
                        <div style={{ fontSize: 12 }}>
                          <strong style={{ color: '#047857' }}>Consignment Arrived at Buyer Destination</strong>
                          <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            Escrow funds will automatically disburse to your account on{' '}
                            <strong>{o.autoReleaseAt ? new Date(o.autoReleaseAt).toLocaleString('en-IN') : 'in 48 hours'}</strong> if no dispute is raised.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dispute & Counter-Evidence Callout */}
                    {o.dispute && (
                      <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🚨</span>
                            <strong style={{ color: '#DC2626', fontSize: 14 }}>
                              Buyer Dispute: {o.dispute.claimedIssue.replace('_', ' ').toUpperCase()} ({o.dispute.claimedPercentage}% Claimed)
                            </strong>
                          </div>
                          <span className="badge badge-amber" style={{ textTransform: 'uppercase', fontSize: 11 }}>
                            Status: {o.dispute.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                          <strong>Buyer Issue Claim:</strong> {o.dispute.buyerNotes}
                        </div>

                        {o.dispute.farmerNotes ? (
                          <div style={{ fontSize: 12, color: '#047857', background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: 8, marginTop: 4 }}>
                            <strong>✓ Your Defense Statement:</strong> {o.dispute.farmerNotes}
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setCounterModalOrder(o)}
                              className="btn-secondary"
                              style={{ fontSize: 12, padding: '6px 14px', borderColor: '#3B82F6', color: '#2563EB' }}
                            >
                              ✍️ Submit Counter-Evidence & Defense
                            </button>
                          </div>
                        )}

                        {o.dispute.farmerSettledAmount !== undefined && o.dispute.farmerSettledAmount !== null && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 8 }}>
                            Arbitration Completed: ₹{o.dispute.farmerSettledAmount.toLocaleString('en-IN')} paid to you | ₹{(o.dispute.refundAmount || 0).toLocaleString('en-IN')} refunded to buyer
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Farmer Dispute Counter-Evidence Modal ───────────────────── */}
      {counterModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 500, padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>🛡️</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Submit Counter-Evidence</h2>
              </div>
              <button onClick={() => setCounterModalOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Defend your produce quality for order <strong>#{counterModalOrder.id.slice(0, 8)}</strong> ({counterModalOrder.listing.cropName}). The arbitrator will review both sides before releasing or splitting escrow funds.
            </p>

            <form onSubmit={handleSubmitCounter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Producer Defense / Counter-Statement
                </label>
                <textarea
                  rows={4}
                  required
                  className="input-field"
                  placeholder="Explain harvest condition, moisture check at dispatch, grading verification, or weighbridge receipts..."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Proof Photo URLs (Harvest, loading, or receipts - one per line)
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  placeholder="https://example.com/dispatch-produce.jpg&#10;https://example.com/weighbridge-slip.jpg"
                  value={counterEvidenceUrls}
                  onChange={(e) => setCounterEvidenceUrls(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setCounterModalOrder(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingCounter} className="btn-primary" style={{ padding: '8px 16px' }}>
                  {submittingCounter ? 'Submitting...' : '🛡️ Submit Defense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
