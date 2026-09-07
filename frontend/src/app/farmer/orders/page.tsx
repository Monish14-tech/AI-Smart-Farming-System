'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Order {
  id: string; status: string; paymentStatus: string; quantityKg: number; totalPrice: number; createdAt: string; notes: string;
  buyer: { name: string; phone: string; email: string; address: string };
  listing: { cropName: string; pricePerKg: number; images: string[] };
  transportJob: { status: string; otpCode: string; transporter?: { name: string; phone: string } } | null;
}

const statusColor: Record<string, string> = {
  pending: 'badge-gold', confirmed: 'badge-blue', in_transit: 'badge-amber', delivered: 'badge-green', cancelled: 'badge-red',
};

export default function FarmerOrders() {
  const { user, loading } = useRequireRole('farmer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/farmer/orders');
      setOrders(data.orders || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (user) loadOrders(); }, [user]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/farmer/orders/${id}/status`, { status });
      toast.success(`Order ${status}!`);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update order');
    }
  };

  if (loading || !user) return null;

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

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
            {['all', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={filter === s ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 13, padding: '8px 16px' }}>
                {s === 'all' ? 'All Orders' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                {s !== 'all' && <span style={{ marginLeft: 6, opacity: 0.7 }}>({orders.filter(o => o.status === s).length})</span>}
              </button>
            ))}
          </div>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h2 style={{ fontWeight: 700 }}>No orders found</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Orders from buyers will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(o => (
                <div key={o.id} className="glass animate-fade-in" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{o.listing.cropName}</h3>
                          <span className={`badge ${statusColor[o.status] || 'badge-gold'}`}>{o.status.replace('_', ' ')}</span>
                          <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : o.paymentStatus === 'escrowed' ? 'badge-blue' : 'badge-gold'}`}>{o.paymentStatus}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                          <span>👤 {o.buyer.name}</span>
                          <span>📞 {o.buyer.phone}</span>
                          <span>⚖️ {o.quantityKg} kg</span>
                          <span>📍 {o.buyer.address}</span>
                        </div>
                        {o.transportJob && (
                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            🚛 Transport: {o.transportJob.status} {o.transportJob.transporter && `· ${o.transportJob.transporter.name}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-gold-light)' }}>
                        ₹{o.totalPrice.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </div>
                      {o.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleStatus(o.id, 'confirmed')} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>✓ Confirm</button>
                          <button onClick={() => handleStatus(o.id, 'cancelled')} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', color: '#EF9A9A', cursor: 'pointer' }}>✕ Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
