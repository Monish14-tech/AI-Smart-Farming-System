'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: string; name: string; email: string; phone: string; role: string;
  isVerified: boolean; createdAt: string; address: string;
  farmerProfile: any; transporterProfile: any;
}

export default function AdminUsers() {
  const { user, loading } = useRequireRole('admin');
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState({ role: '', verified: '' });
  const [page, setPage] = useState(1);

  const loadUsers = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (filter.role) params.append('role', filter.role);
      if (filter.verified !== '') params.append('verified', filter.verified);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load users'); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (user) loadUsers(); }, [user, page, filter]);

  const handleVerify = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/verify`);
      toast.success('User verified ✓');
      loadUsers();
    } catch { toast.error('Failed to verify user'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      loadUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  const roleColor: Record<string, string> = { farmer: 'badge-green', buyer: 'badge-blue', transporter: 'badge-amber', admin: 'badge-purple' };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ marginBottom: 24 }}>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Users & KYC</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{total} registered users</p>
          </div>

          {/* Filters */}
          <div className="glass" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="input-field" style={{ width: 160 }} value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
              <option value="">All Roles</option>
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
              <option value="transporter">Transporter</option>
            </select>
            <select className="input-field" style={{ width: 180 }} value={filter.verified} onChange={e => setFilter(f => ({ ...f, verified: e.target.value }))}>
              <option value="">All Verification Status</option>
              <option value="false">Pending Verification</option>
              <option value="true">Verified</option>
            </select>
            <div className="badge badge-amber" style={{ fontSize: 12 }}>
              ⏳ Pending: {users.filter(u => !u.isVerified).length}
            </div>
          </div>

          <div className="glass" style={{ overflow: 'hidden' }}>
            {fetching ? (
              <div style={{ padding: 24 }}>
                {[...Array(5)].map((_, i) => <div key={i} className="shimmer" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />)}
              </div>
            ) : (
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr><th>User</th><th>Role</th><th>Contact</th><th>Location</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{u.email}</div>
                      </td>
                      <td><span className={`badge ${roleColor[u.role] || 'badge-gold'}`}>{u.role}</span></td>
                      <td style={{ fontSize: 13 }}>{u.phone}</td>
                      <td style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{u.address || '—'}</td>
                      <td>
                        {u.isVerified
                          ? <span className="badge badge-green">✓ Verified</span>
                          : <span className="badge badge-amber">⏳ Pending</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {!u.isVerified && (
                            <button onClick={() => handleVerify(u.id)} className="btn-primary" style={{ fontSize: 11, padding: '5px 10px' }}>Verify</button>
                          )}
                          <button onClick={() => handleDelete(u.id)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', color: '#EF9A9A', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {Math.ceil(total / 20) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
              <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>Page {page} of {Math.ceil(total / 20)}</span>
              <button className="btn-secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
