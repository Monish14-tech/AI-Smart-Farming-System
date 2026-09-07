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

  if (loading || !user) return null;

  const statusBadgeColor: Record<string, string> = {
    pending: 'badge-gold',
    confirmed: 'badge-blue',
    in_transit: 'badge-amber',
    delivered: 'badge-green',
    cancelled: 'badge-red',
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div className="animate-fade-in" style={{ marginBottom: 28 }}>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              Platform Orders
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              Monitor transaction flow, escrow statuses, and deliveries ({total} total orders)
            </p>
          </div>

          <div className="glass" style={{ overflow: 'hidden' }}>
            {fetching ? (
              <div style={{ padding: 24 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shimmer" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <h2 style={{ fontWeight: 700 }}>No orders placed yet</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Orders will appear here once buyers place them.</p>
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
                    <th>Order Status</th>
                    <th>Payment / Escrow</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
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
                        <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : o.paymentStatus === 'escrowed' ? 'badge-blue' : 'badge-gold'}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
