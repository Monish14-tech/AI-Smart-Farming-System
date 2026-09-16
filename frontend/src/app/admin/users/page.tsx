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
  const [selectedFarmerKyc, setSelectedFarmerKyc] = useState<User | null>(null);

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
      if (selectedFarmerKyc?.id === id) {
        setSelectedFarmerKyc(prev => prev ? { ...prev, isVerified: true } : null);
      }
    } catch { toast.error('Failed to verify user'); }
  };

  const handleUnverify = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/unverify`);
      toast.success('Verification status revoked');
      loadUsers();
      if (selectedFarmerKyc?.id === id) {
        setSelectedFarmerKyc(prev => prev ? { ...prev, isVerified: false } : null);
      }
    } catch { toast.error('Failed to revoke verification'); }
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
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>Users & KYC Management</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{total} registered users on platform</p>
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
                  <tr><th>User</th><th>Role</th><th>Contact</th><th>Location</th><th>Status</th><th>KYC / Docs</th><th>Actions</th></tr>
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
                      <td style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{u.address || '-'}</td>
                      <td>
                        {u.isVerified
                          ? <span className="badge badge-green">✓ Verified</span>
                          : <span className="badge badge-amber">⏳ Pending</span>}
                      </td>
                      <td>
                        {u.role === 'farmer' ? (
                          <button
                            onClick={() => setSelectedFarmerKyc(u)}
                            className="btn-secondary"
                            style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>🔍</span> Inspect KYC
                            {u.farmerProfile?.landDocUrl && <span style={{ color: '#10B981', fontWeight: 700 }}>●</span>}
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {!u.isVerified ? (
                            <button onClick={() => handleVerify(u.id)} className="btn-primary" style={{ fontSize: 11, padding: '5px 10px' }}>
                              ✓ Verify
                            </button>
                          ) : (
                            <button onClick={() => handleUnverify(u.id)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#F59E0B', cursor: 'pointer' }}>
                              Revoke
                            </button>
                          )}
                          <button onClick={() => handleDelete(u.id)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', color: '#EF9A9A', cursor: 'pointer' }}>
                            Delete
                          </button>
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

          {/* Farmer KYC & Bank Details Inspection Modal */}
          {selectedFarmerKyc && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20,
              }}
              onClick={() => setSelectedFarmerKyc(null)}
            >
              <div
                className="glass"
                style={{
                  maxWidth: 680,
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: 28,
                  borderRadius: 20,
                  border: '1px solid var(--color-border)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                      Farmer KYC & Bank Verification
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                      {selectedFarmerKyc.name} • {selectedFarmerKyc.phone} • {selectedFarmerKyc.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFarmerKyc(null)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Current Status:</span>
                  {selectedFarmerKyc.isVerified ? (
                    <span className="badge badge-green">✓ Verified & Approved</span>
                  ) : (
                    <span className="badge badge-amber">⏳ Pending Administrator Review</span>
                  )}
                </div>

                {/* Section 1: Land Documents */}
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--color-surface-2)', borderRadius: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📄</span> Uploaded Land Record / Patta / Chitta Document
                  </h3>
                  {selectedFarmerKyc.farmerProfile?.landDocUrl ? (
                    <div>
                      {selectedFarmerKyc.farmerProfile.landDocUrl.startsWith('data:image') ||
                       selectedFarmerKyc.farmerProfile.landDocUrl.match(/\.(jpeg|jpg|png|webp)($|\?)/i) ? (
                        <div style={{ textAlign: 'center', marginBottom: 12 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedFarmerKyc.farmerProfile.landDocUrl}
                            alt="Farmer Land Document"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 280,
                              borderRadius: 8,
                              border: '1px solid var(--color-border)',
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                          href={selectedFarmerKyc.farmerProfile.landDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          🔗 Open Land Document in New Tab
                        </a>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          File attached by farmer for land verification
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', background: 'rgba(234,179,8,0.1)', border: '1px dashed rgba(234,179,8,0.4)', borderRadius: 8, color: '#D97706', fontSize: 13 }}>
                      ⚠️ No land document uploaded yet by this farmer.
                    </div>
                  )}
                </div>

                {/* Section 2: Bank Settlement Details */}
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--color-surface-2)', borderRadius: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🏦</span> Bank Settlement & Identity Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bank Account No.</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, fontFamily: 'monospace' }}>
                        {selectedFarmerKyc.farmerProfile?.bankAccount || <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not provided</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>IFSC Code</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, fontFamily: 'monospace' }}>
                        {selectedFarmerKyc.farmerProfile?.ifscCode || <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not provided</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Settlement UPI ID</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                        {selectedFarmerKyc.farmerProfile?.upiId || <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not provided</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Farm Size</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                        {selectedFarmerKyc.farmerProfile?.farmSizeAcres ? `${selectedFarmerKyc.farmerProfile.farmSizeAcres} Acres` : <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not provided</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Aadhaar / Gov ID</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, fontFamily: 'monospace' }}>
                        {selectedFarmerKyc.farmerProfile?.aadhaarNumber || <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Not provided</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 18 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedFarmerKyc(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  {selectedFarmerKyc.isVerified ? (
                    <button
                      type="button"
                      onClick={() => handleUnverify(selectedFarmerKyc.id)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        background: 'rgba(234,179,8,0.15)',
                        border: '1px solid rgba(234,179,8,0.4)',
                        color: '#D97706',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Revoke Verification
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleVerify(selectedFarmerKyc.id)}
                      className="btn-primary"
                      style={{ padding: '10px 20px' }}
                    >
                      ✓ Approve Documents & Verify Farmer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
