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
  transporterEvidenceUrls?: string[];
  status: string;
  refundAmount?: number;
  farmerSettledAmount?: number;
}

interface Order {
  id: string;
  quantityKg: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  arrivedAt?: string;
  autoReleaseAt?: string;
  buyer: { name: string; email: string; phone?: string };
  listing: { cropName: string; pricePerKg: number; farmer: { name: string; email?: string; phone?: string } };
  transportJob: { status: string; transporter?: { name: string; phone?: string } } | null;
  dispute?: DisputeInfo | null;
}

export default function AdminOrders() {
  const { user, loading } = useRequireRole('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [disputeFilterOnly, setDisputeFilterOnly] = useState(false);
  const [runningAutoCheck, setRunningAutoCheck] = useState(false);

  // Dispute modal state
  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<Order | null>(null);
  const [resolution, setResolution] = useState<'partial_settlement' | 'release_farmer' | 'refund_buyer' | 'dismiss'>('partial_settlement');
  const [acceptedPercentage, setAcceptedPercentage] = useState<number>(50);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadOrders = async () => {
    setFetching(true);
    try {
      const { data } = await api.get(`/admin/orders?page=${page}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
  }, [user, page]);

  const handleTriggerAutoRelease = async () => {
    setRunningAutoCheck(true);
    try {
      const { data } = await api.post('/admin/orders/check-auto-release');
      toast.success(data.message || 'Auto-release check completed');
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to trigger auto-settlements');
    } finally {
      setRunningAutoCheck(false);
    }
  };

  const handleOpenDispute = (order: Order) => {
    setSelectedDisputeOrder(order);
    setAcceptedPercentage(order.dispute?.claimedPercentage || 50);
    setResolution('partial_settlement');
    setAdminNotes('');
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeOrder) return;

    setResolving(true);
    try {
      const { data } = await api.put(`/admin/orders/${selectedDisputeOrder.id}/dispute-resolve`, {
        resolution,
        acceptedPercentage: resolution === 'partial_settlement' ? acceptedPercentage : undefined,
        adminNotes,
      });
      toast.success(data.message || 'Binding dispute determination applied');
      setSelectedDisputeOrder(null);
      setAdminNotes('');
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to adjudicate dispute');
    } finally {
      setResolving(false);
    }
  };

  if (loading || !user) return null;

  const statusBadgeColor: Record<string, string> = {
    pending: 'badge-gold',
    confirmed: 'badge-blue',
    in_transit: 'badge-amber',
    delivered: 'badge-green',
    cancelled: 'badge-red',
  };

  const displayedOrders = disputeFilterOnly
    ? orders.filter((o) => o.dispute || o.notes?.includes('[DISPUTE RAISED') || o.paymentStatus === 'disputed')
    : orders;

  // Split calculations for the active dispute modal
  const gross = selectedDisputeOrder?.totalPrice || 0;
  const buyerRefundCalc = resolution === 'refund_buyer'
    ? gross
    : resolution === 'release_farmer' || resolution === 'dismiss'
    ? 0
    : Math.round((gross * (acceptedPercentage / 100)) * 100) / 100;
  const farmerGrossShare = gross - buyerRefundCalc;
  const farmerNetCalc = Math.round((farmerGrossShare * 0.98) * 100) / 100;
  const platformFeeCalc = Math.round((gross - buyerRefundCalc - farmerNetCalc) * 100) / 100;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div className="animate-fade-in" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                Platform Orders & Settlements
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
                Arbitrate multi-party disputes, audit Nodal escrow ledgers, and trigger auto-settlement timeouts ({total} total orders)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleTriggerAutoRelease}
                disabled={runningAutoCheck}
                className="btn-secondary"
                style={{ fontSize: 13, padding: '7px 14px', borderColor: '#F59E0B', color: '#D97706' }}
              >
                {runningAutoCheck ? 'Checking...' : '⏱️ Run 48h Auto-Settlement Check'}
              </button>

              <button
                onClick={() => setDisputeFilterOnly(!disputeFilterOnly)}
                className={disputeFilterOnly ? 'btn-danger' : 'btn-secondary'}
                style={{ fontSize: 13, padding: '7px 14px' }}
              >
                {disputeFilterOnly ? 'Show All Orders' : '⚠️ View Disputed Orders Only'}
              </button>
            </div>
          </div>

          <div className="glass" style={{ overflow: 'hidden', borderRadius: 16 }}>
            {fetching ? (
              <div style={{ padding: 24 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />
                ))}
              </div>
            ) : displayedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <h2 style={{ fontWeight: 700 }}>No orders match this view</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {disputeFilterOnly ? 'No open disputes currently pending.' : 'Orders will appear here once buyers place them.'}
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Crop</th>
                    <th>Farmer</th>
                    <th>Buyer</th>
                    <th>Quantity</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Escrow / Ledgers</th>
                    <th>Dispute / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((o) => {
                    const hasDispute = Boolean(o.dispute || o.notes?.includes('[DISPUTE RAISED') || o.paymentStatus === 'disputed');
                    return (
                      <tr key={o.id}>
                        <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                          {o.id.slice(0, 8)}...
                        </td>
                        <td style={{ fontWeight: 600 }}>{o.listing.cropName}</td>
                        <td style={{ fontSize: 13 }}>{o.listing.farmer.name}</td>
                        <td style={{ fontSize: 13 }}>
                          <div>{o.buyer.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{o.buyer.email}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{o.quantityKg.toLocaleString('en-IN')} kg</td>
                        <td className="font-display" style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>
                          ₹{o.totalPrice.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeColor[o.status] || 'badge-gold'}`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              o.paymentStatus === 'paid'
                                ? 'badge-green'
                                : o.paymentStatus === 'refunded'
                                ? 'badge-red'
                                : o.paymentStatus === 'partially_refunded'
                                ? 'badge-amber'
                                : o.paymentStatus === 'disputed'
                                ? 'badge-red'
                                : 'badge-blue'
                            }`}
                          >
                            {o.paymentStatus === 'escrowed'
                              ? '🔒 Escrow Held'
                              : o.paymentStatus === 'partially_refunded'
                              ? '⚖️ Partially Settled'
                              : o.paymentStatus === 'disputed'
                              ? '⚠️ Escrow Frozen'
                              : o.paymentStatus}
                          </span>
                        </td>
                        <td>
                          {hasDispute ? (
                            <button
                              onClick={() => handleOpenDispute(o)}
                              className="btn-danger"
                              style={{ fontSize: 11, padding: '5px 12px', background: '#DC2626' }}
                            >
                              ⚖️ Adjudicate Dispute
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Clear</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {Math.ceil(total / 20) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
              <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Previous
              </button>
              <span style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button className="btn-secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Multi-Party Dispute Arbitration Modal ───────────────────── */}
      {selectedDisputeOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>⚖️</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#DC2626' }}>
                  Multi-Party Dispute Arbitration
                </h2>
              </div>
              <button onClick={() => setSelectedDisputeOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            {/* Order & Dispute Header */}
            <div style={{ padding: 14, background: 'var(--color-surface-2)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span><strong>Produce:</strong> {selectedDisputeOrder.listing.cropName} ({selectedDisputeOrder.quantityKg} kg)</span>
                <span style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>Gross: ₹{selectedDisputeOrder.totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                🧑‍🌾 Producer: {selectedDisputeOrder.listing.farmer.name} | 👤 Buyer: {selectedDisputeOrder.buyer.name} | 🚛 Carrier: {selectedDisputeOrder.transportJob?.transporter?.name || 'Unassigned'}
              </div>
            </div>

            {/* 3-Way Counterparty Evidence Dossier */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {/* Buyer Claim */}
              <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10, fontSize: 12 }}>
                <strong style={{ color: '#DC2626' }}>
                  1. Buyer Claim ({selectedDisputeOrder.dispute?.claimedIssue || 'Defect'} - {selectedDisputeOrder.dispute?.claimedPercentage || 100}% requested)
                </strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
                  {selectedDisputeOrder.dispute?.buyerNotes || selectedDisputeOrder.notes || 'No statement provided.'}
                </p>
                {selectedDisputeOrder.dispute?.buyerEvidenceUrls && selectedDisputeOrder.dispute.buyerEvidenceUrls.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#3B82F6' }}>
                    Photos: {selectedDisputeOrder.dispute.buyerEvidenceUrls.join(', ')}
                  </div>
                )}
              </div>

              {/* Farmer Defense */}
              <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, fontSize: 12 }}>
                <strong style={{ color: '#047857' }}>2. Farmer Harvest / Dispatch Defense</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
                  {selectedDisputeOrder.dispute?.farmerNotes || 'No farmer statement submitted yet.'}
                </p>
                {selectedDisputeOrder.dispute?.farmerEvidenceUrls && selectedDisputeOrder.dispute.farmerEvidenceUrls.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#3B82F6' }}>
                    Photos: {selectedDisputeOrder.dispute.farmerEvidenceUrls.join(', ')}
                  </div>
                )}
              </div>

              {/* Transporter Transit Log */}
              <div style={{ padding: 12, background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: 10, fontSize: 12 }}>
                <strong style={{ color: '#2563EB' }}>3. Carrier Transit & Odometer Log</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
                  {selectedDisputeOrder.dispute?.transporterNotes || 'No carrier transit notes submitted.'}
                </p>
              </div>
            </div>

            {/* Arbitration Form */}
            <form onSubmit={handleResolveDispute} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Arbitration Determination
                </label>
                <select
                  className="input-field"
                  value={resolution}
                  onChange={(e: any) => setResolution(e.target.value)}
                >
                  <option value="partial_settlement">⚖️ Partial Settlement (Grade deduction / Split payout)</option>
                  <option value="release_farmer">🧑‍🌾 Approve Full Release to Farmer (Reject Buyer Claim)</option>
                  <option value="refund_buyer">🛒 Approve 100% Refund to Buyer (Total rejection of cargo)</option>
                  <option value="dismiss">✕ Dismiss Dispute (Resume normal escrow release)</option>
                </select>
              </div>

              {/* Percentage Slider for Partial Settlement */}
              {resolution === 'partial_settlement' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Buyer Damage / Refund Percentage</label>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626' }}>{acceptedPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={acceptedPercentage}
                    onChange={(e) => setAcceptedPercentage(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#DC2626' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span>10% (Minor deduction)</span>
                    <span>50% (Equal split)</span>
                    <span>90% (Substantial loss)</span>
                  </div>
                </div>
              )}

              {/* Live Escrow Disbursement Summary */}
              <div style={{ padding: 12, background: 'rgba(212, 160, 23, 0.1)', border: '1px solid rgba(212, 160, 23, 0.3)', borderRadius: 10, fontSize: 12 }}>
                <strong style={{ color: 'var(--color-gold)' }}>Nodal Escrow Disbursement Preview:</strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Buyer Refund:</span>
                  <strong style={{ color: '#DC2626' }}>₹{buyerRefundCalc.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span>Net Farmer Disbursed:</span>
                  <strong style={{ color: '#059669' }}>₹{farmerNetCalc.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span>Retained Platform Fee (2% on gross):</span>
                  <strong>₹{platformFeeCalc.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Arbitrator Findings & Compliance Notes
                </label>
                <textarea
                  rows={3}
                  required
                  className="input-field"
                  placeholder="Summarize evidence reviewed, APMC inspection notes, or weighbridge slip verification..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setSelectedDisputeOrder(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={resolving} className="btn-primary" style={{ background: '#7C3AED' }}>
                  {resolving ? 'Applying Settlement...' : '⚖️ Execute Binding Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
