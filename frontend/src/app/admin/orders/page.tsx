'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  quantityKg: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  buyer: { name: string; email: string };
  listing: { cropName: string; pricePerKg: number; farmer: { name: string } };
  transportJob: { status: string } | null;
}

export default function AdminOrders() {
  const { user, loading } = useRequireRole('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [disputeFilterOnly, setDisputeFilterOnly] = useState(false);

  // Dispute modal state
  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<Order | null>(null);
  const [resolution, setResolution] = useState<'refund_buyer' | 'release_farmer' | 'dismiss'>('refund_buyer');
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

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeOrder) return;

    setResolving(true);
    try {
      const { data } = await api.put(`/admin/orders/${selectedDisputeOrder.id}/dispute-resolve`, {
        resolution,
        adminNotes,
      });
      toast.success(data.message || 'Dispute resolution applied');
      setSelectedDisputeOrder(null);
      setAdminNotes('');
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to resolve dispute');
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
    ? orders.filter(o => o.notes?.includes('[DISPUTE RAISED'))
    : orders;

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
                Monitor wholesale transaction flow, dispute resolution, and escrow settlements ({total} total)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
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
                    <th>Escrow Status</th>
                    <th>Dispute / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map(o => {
                    const isDisputed = o.notes?.includes('[DISPUTE RAISED');
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
                          <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : o.paymentStatus === 'refunded' ? 'badge-red' : 'badge-blue'}`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td>
                          {isDisputed ? (
                            <button
                              onClick={() => setSelectedDisputeOrder(o)}
                              className="btn-danger"
                              style={{ fontSize: 11, padding: '4px 10px', background: '#DC2626' }}
                            >
                              ⚠️ Resolve Dispute
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

      {/* ── Admin Dispute Resolution Modal ──────────────────────── */}
      {selectedDisputeOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 520, padding: 28, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#DC2626' }}>
                Admin Dispute Resolution Panel
              </h2>
              <button onClick={() => setSelectedDisputeOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <div style={{ padding: 14, background: 'var(--color-surface-2)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <div><strong>Crop:</strong> {selectedDisputeOrder.listing.cropName} ({selectedDisputeOrder.quantityKg} kg)</div>
              <div><strong>Order Value:</strong> ₹{selectedDisputeOrder.totalPrice.toLocaleString('en-IN')}</div>
              <div><strong>Buyer:</strong> {selectedDisputeOrder.buyer.name} ({selectedDisputeOrder.buyer.email})</div>
              <div><strong>Farmer:</strong> {selectedDisputeOrder.listing.farmer.name}</div>
              <div style={{ marginTop: 8, padding: 8, background: '#FEF2F2', borderRadius: 6, border: '1px solid #FECACA', color: '#991B1B' }}>
                <strong>Buyer Logged Notes:</strong>
                <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12 }}>
                  {selectedDisputeOrder.notes || 'No specific note provided.'}
                </pre>
              </div>
            </div>

            <form onSubmit={handleResolveDispute} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Action / Determination</label>
                <select
                  className="input-field"
                  value={resolution}
                  onChange={(e: any) => setResolution(e.target.value)}
                >
                  <option value="refund_buyer">Approve Buyer Refund (Cancel order & refund escrow)</option>
                  <option value="release_farmer">Reject Dispute & Release Escrow to Farmer</option>
                  <option value="dismiss">Dismiss Dispute (Keep active in escrow)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Administrator Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  className="input-field"
                  placeholder="State the rationale for audit compliance and DPDP record keeping..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setSelectedDisputeOrder(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={resolving} className="btn-primary" style={{ background: '#7C3AED' }}>
                  {resolving ? 'Applying...' : '⚖️ Execute Binding Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
