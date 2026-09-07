'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Job {
  id: string; status: string; earningAmount: number; createdAt: string;
  pickupAddress?: string; dropAddress?: string; estimatedKm?: number;
  order: {
    quantityKg: number; totalPrice: number;
    buyer: { name: string; phone: string; address: string };
    listing: { cropName: string; farmer: { name: string; phone: string; address: string; latitude?: number; longitude?: number } };
  };
}

export default function TransporterJobs() {
  const { user, loading } = useRequireRole('transporter');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/transporter/jobs');
      setJobs(data.jobs || []);
    } catch { toast.error('Failed to load jobs'); }
    finally { setFetching(false); }
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
          <div style={{ marginBottom: 28 }}>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Available Jobs</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{jobs.length} job(s) waiting for a transporter</p>
          </div>

          {fetching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h2 style={{ fontWeight: 700 }}>No jobs available right now</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>New jobs appear when farmers confirm orders. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {jobs.map(j => (
                <div key={j.id} className="glass glass-hover animate-fade-in" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16 }}>{j.order.listing.cropName}</h3>
                    <span className="font-display" style={{ color: 'var(--color-gold)', fontWeight: 800, fontSize: 18 }}>
                      ₹{(j.earningAmount || j.order.totalPrice * 0.05).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: 'var(--color-leaf)', fontWeight: 600 }}>📦 Pickup:</span>
                      <span>{j.order.listing.farmer.name} · {j.order.listing.farmer.address}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: '#FFCC80', fontWeight: 600 }}>🏁 Drop:</span>
                      <span>{j.order.buyer.name} · {j.order.buyer.address}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>⚖️ {j.order.quantityKg} kg</span>
                      <span>📞 {j.order.listing.farmer.phone}</span>
                    </div>
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
