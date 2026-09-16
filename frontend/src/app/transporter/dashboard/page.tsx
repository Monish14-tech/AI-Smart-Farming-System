'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, useAuth, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function TransporterDashboard() {
  const { user, loading } = useRequireRole('transporter');
  const { refreshUser } = useAuth();
  const [stats, setStats] = useState({ available: 0, activeJobs: 0, totalDeliveries: 0, totalEarnings: 0 });
  const [isAvailable, setIsAvailable] = useState(true);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [verifyForm, setVerifyForm] = useState({
    vehicleType: '',
    vehicleCapacityKg: '',
    licenseNumber: '',
    vehicleNumber: '',
    licenseDocUrl: '',
  });
  const [submittingDocs, setSubmittingDocs] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.isVerified) {
      Promise.all([
        api.get('/transporter/jobs'),
        api.get('/transporter/active'),
        api.get('/transporter/earnings'),
      ]).then(([jobsRes, activeRes, earningsRes]) => {
        setStats({
          available: jobsRes.data.jobs?.length || 0,
          activeJobs: activeRes.data.jobs?.length || 0,
          totalDeliveries: earningsRes.data.jobs?.length || 0,
          totalEarnings: earningsRes.data.totalEarnings || 0,
        });
      }).catch(() => toast.error('Failed to load dashboard'));
    } else {
      // Just fetch earnings history if any
      api.get('/transporter/earnings').then(earningsRes => {
        setStats({
          available: 0,
          activeJobs: 0,
          totalDeliveries: earningsRes.data.jobs?.length || 0,
          totalEarnings: earningsRes.data.totalEarnings || 0,
        });
      }).catch(() => {});
    }

    setIsAvailable(user.transporterProfile?.isAvailable ?? true);
    setVerifyForm({
      vehicleType: user.transporterProfile?.vehicleType || 'Mini Truck / Tata Ace',
      vehicleCapacityKg: user.transporterProfile?.vehicleCapacityKg?.toString() || '',
      licenseNumber: user.transporterProfile?.licenseNumber || '',
      vehicleNumber: user.transporterProfile?.vehicleNumber || '',
      licenseDocUrl: user.transporterProfile?.licenseDocUrl || '',
    });
  }, [user]);

  const toggleAvailability = async () => {
    try {
      await api.put('/transporter/availability', { isAvailable: !isAvailable });
      setIsAvailable(a => !a);
      toast.success(isAvailable ? 'You are now offline' : 'You are now online!');
    } catch { toast.error('Failed to update availability'); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setDocFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocPreview(null);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDocs(true);

    try {
      const fd = new FormData();
      if (docFile) {
        fd.append('licenseDoc', docFile);
      } else if (verifyForm.licenseDocUrl) {
        fd.append('licenseDocUrl', verifyForm.licenseDocUrl);
      }

      if (verifyForm.vehicleType) fd.append('vehicleType', verifyForm.vehicleType);
      if (verifyForm.vehicleCapacityKg) fd.append('vehicleCapacityKg', verifyForm.vehicleCapacityKg);
      if (verifyForm.licenseNumber) fd.append('licenseNumber', verifyForm.licenseNumber);
      if (verifyForm.vehicleNumber) fd.append('vehicleNumber', verifyForm.vehicleNumber);

      await api.post('/transporter/verify-documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Documents submitted! Verification is now pending admin approval.');
      setShowVerifyModal(false);
      await refreshUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit verification documents');
    } finally {
      setSubmittingDocs(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          {/* Verification Alert Banner */}
          {!user.isVerified ? (
            <div
              className="glass animate-fade-in"
              style={{
                padding: '20px 24px',
                marginBottom: 24,
                borderRadius: 16,
                border: '1px solid rgba(245, 158, 11, 0.4)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 32 }}>🛡️</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#D97706' }}>
                    Transporter Document & Vehicle Verification Required
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 650, lineHeight: 1.5 }}>
                    Logistics safety regulations require all transporters to verify their <strong>Commercial Driving License / Vehicle Registration</strong> and vehicle specifications before viewing and accepting active freight jobs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', borderColor: '#D97706', padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
              >
                📄 {user.transporterProfile?.licenseDocUrl ? 'Update Verification Details' : 'Verify Driver & Vehicle Documents'}
              </button>
            </div>
          ) : (
            <div
              className="glass animate-fade-in"
              style={{
                padding: '12px 20px',
                marginBottom: 24,
                borderRadius: 12,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>
                  Verified Logistics Partner — Your fleet credentials have been approved by platform administrators.
                </span>
              </div>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px' }}
              >
                View / Edit Documents
              </button>
            </div>
          )}

          <div className="animate-fade-in" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                Welcome, <span className="gradient-text">{user.name.split(' ')[0]}</span>! 🚛
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {user.transporterProfile?.vehicleType || 'Transport Vehicle'} · {user.transporterProfile?.vehicleNumber || 'No plate specified'}
                {!user.isVerified && <span className="badge badge-amber" style={{ marginLeft: 8, fontSize: 11 }}>⏳ Verification Pending</span>}
              </p>
            </div>
            <button onClick={toggleAvailability} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: isAvailable ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', border: `1px solid ${isAvailable ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`, color: isAvailable ? '#81C784' : '#EF9A9A', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAvailable ? '#81C784' : '#EF9A9A', animation: isAvailable ? 'pulse-green 2s infinite' : 'none' }} />
              {isAvailable ? '● Available' : '○ Offline'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Available Jobs', value: user.isVerified ? stats.available : '🔒 Locked', icon: '📋', color: '#52A352' },
              { label: 'Active Trips', value: user.isVerified ? stats.activeJobs : '🔒 Locked', icon: '🗺️', color: '#E8941A' },
              { label: 'Total Deliveries', value: stats.totalDeliveries, icon: '✅', color: '#4A90D9' },
              { label: 'Total Earnings', value: `₹${stats.totalEarnings.toLocaleString('en-IN')}`, icon: '💰', color: '#D4A017' },
            ].map((s, i) => (
              <div key={i} className="glass animate-fade-in" style={{ padding: 22, animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🗺️ Route Optimizer</h2>
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
                <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Smart VRP Route Planner</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                  {user.isVerified
                    ? 'Accept multiple jobs and let our route optimizer plan the most efficient multi-pickup route, saving you fuel and transit time.'
                    : 'Complete driver license and vehicle verification to browse and accept multiple freight orders.'}
                </p>
                {user.isVerified ? (
                  <Link href="/transporter/jobs" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
                    Browse Available Jobs →
                  </Link>
                ) : (
                  <button onClick={() => setShowVerifyModal(true)} className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
                    🔒 Verify Account to Unlock Jobs
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {user.isVerified ? (
                    <>
                      <Link href="/transporter/jobs" className="btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
                        📋 Available Jobs
                      </Link>
                      <Link href="/transporter/active" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>
                        🗺️ Active Trip Map
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        className="btn-primary"
                        style={{ justifyContent: 'center', fontSize: 13, background: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.5)', color: '#F59E0B' }}
                      >
                        🔒 Verification Required for Jobs
                      </button>
                      <button
                        onClick={() => setShowVerifyModal(true)}
                        className="btn-secondary"
                        style={{ justifyContent: 'center', fontSize: 13 }}
                      >
                        🔒 Active Trips (Locked)
                      </button>
                    </>
                  )}
                  <Link href="/transporter/earnings" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>
                    💰 Earnings
                  </Link>
                </div>
              </div>

              <div className="glass" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📍 Live GPS</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Your location is shared with buyers when you're on an active delivery.</p>
                <div className="badge badge-green" style={{ width: '100%', justifyContent: 'center' }}>GPS Active</div>
              </div>
            </div>
          </div>

          {/* Transporter Verification Modal */}
          {showVerifyModal && (
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
              onClick={() => setShowVerifyModal(false)}
            >
              <div
                className="glass"
                style={{
                  maxWidth: 620,
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
                      Driver License & Vehicle Verification
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                      Required by platform admins before viewing and accepting freight trips
                    </p>
                  </div>
                  <button
                    onClick={() => setShowVerifyModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ padding: '12px 16px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#D97706', lineHeight: 1.5 }}>
                  ⚠️ <strong>Notice:</strong> Whenever you submit or edit your driver documents or vehicle specifications, your verification status will automatically be set to <strong>Pending Administrator Review</strong>.
                </div>

                <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Vehicle Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Vehicle Classification
                    </label>
                    <select
                      className="input-field"
                      value={verifyForm.vehicleType}
                      onChange={e => setVerifyForm({ ...verifyForm, vehicleType: e.target.value })}
                      required
                    >
                      <option value="Mini Truck / Tata Ace">Mini Truck / Tata Ace (Up to 1.5T)</option>
                      <option value="Pickup Truck (1.5T - 2.5T)">Pickup Truck (1.5T - 2.5T)</option>
                      <option value="3-Wheeler Cargo Loader">3-Wheeler Cargo Loader (Up to 750kg)</option>
                      <option value="Medium Lorry (Eicher 14ft/17ft)">Medium Lorry (Eicher 14ft/17ft - 5T)</option>
                      <option value="Heavy Multi-Axle Truck (10T+)">Heavy Multi-Axle Truck (10T+)</option>
                      <option value="Refrigerated Cold-Chain Van">Refrigerated Cold-Chain Van</option>
                      <option value="Tractor Trailer">Tractor Trailer</option>
                    </select>
                  </div>

                  {/* Vehicle Registration & Payload */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Vehicle Plate Number
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. MH-12-AB-1234"
                        value={verifyForm.vehicleNumber}
                        onChange={e => setVerifyForm({ ...verifyForm, vehicleNumber: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Payload Capacity (kg)
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="e.g. 1500"
                        value={verifyForm.vehicleCapacityKg}
                        onChange={e => setVerifyForm({ ...verifyForm, vehicleCapacityKg: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Driving License Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Commercial Driving License Number
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. DL-1420110012345"
                      value={verifyForm.licenseNumber}
                      onChange={e => setVerifyForm({ ...verifyForm, licenseNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  {/* Document Upload Option */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Driving License / Vehicle RC Document (PDF or Photo)
                    </label>

                    <div
                      style={{
                        border: '2px dashed var(--color-border)',
                        borderRadius: 12,
                        padding: 20,
                        textAlign: 'center',
                        background: 'var(--color-surface-2)',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease',
                      }}
                      onClick={() => document.getElementById('transporterDocInput')?.click()}
                    >
                      <input
                        id="transporterDocInput"
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                        {docFile ? `Selected: ${docFile.name}` : 'Click to select or drag & drop license document'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
                        Supports PDF, PNG, JPG, or WEBP (Max 10MB)
                      </p>
                    </div>

                    {/* Preview if image */}
                    {docPreview && (
                      <div style={{ marginTop: 12, textAlign: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={docPreview}
                          alt="Document Preview"
                          style={{ maxHeight: 160, borderRadius: 8, border: '1px solid var(--color-border)', objectFit: 'contain' }}
                        />
                      </div>
                    )}

                    {/* Show existing document link if present */}
                    {user.transporterProfile?.licenseDocUrl && !docFile && (
                      <div style={{ marginTop: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Existing document attached:</span>
                        <a
                          href={user.transporterProfile.licenseDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--color-gold)', textDecoration: 'underline' }}
                        >
                          View Current Document
                        </a>
                      </div>
                    )}

                    {/* Fallback Direct URL input */}
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Or enter direct document link:</span>
                      <input
                        type="text"
                        className="input-field"
                        style={{ marginTop: 4, fontSize: 12 }}
                        placeholder="https://... (optional if file uploaded above)"
                        value={verifyForm.licenseDocUrl}
                        onChange={e => setVerifyForm({ ...verifyForm, licenseDocUrl: e.target.value })}
                        disabled={!!docFile}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(false)}
                      className="btn-secondary"
                      disabled={submittingDocs}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingDocs}
                      style={{ padding: '10px 24px' }}
                    >
                      {submittingDocs ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
