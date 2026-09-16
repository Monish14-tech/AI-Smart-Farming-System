'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    latitude: '' as number | string,
    longitude: '' as number | string,
    // Farmer fields
    farmSizeAcres: '' as number | string,
    upiId: '',
    bankAccount: '',
    ifscCode: '',
    aadhaarNumber: '',
    // Transporter fields
    vehicleType: '',
    vehicleCapacityKg: '' as number | string,
    vehicleNumber: '',
    licenseNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        latitude: user.latitude ?? '',
        longitude: user.longitude ?? '',
        farmSizeAcres: user.farmerProfile?.farmSizeAcres ?? '',
        upiId: user.farmerProfile?.upiId || '',
        bankAccount: user.farmerProfile?.bankAccount || '',
        ifscCode: user.farmerProfile?.ifscCode || '',
        aadhaarNumber: user.farmerProfile?.aadhaarNumber || '',
        vehicleType: user.transporterProfile?.vehicleType || '',
        vehicleCapacityKg: user.transporterProfile?.vehicleCapacityKg ?? '',
        vehicleNumber: user.transporterProfile?.vehicleNumber || '',
        licenseNumber: user.transporterProfile?.licenseNumber || '',
      });
    }
  }, [user]);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setDetectingGps(false);
        toast.success('Current GPS coordinates detected!');
      },
      (err) => {
        setDetectingGps(false);
        toast.error('Could not detect location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address || null,
        latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
      };

      if (user?.role === 'farmer') {
        payload.farmSizeAcres = formData.farmSizeAcres !== '' ? Number(formData.farmSizeAcres) : null;
        payload.upiId = formData.upiId || null;
        payload.bankAccount = formData.bankAccount || null;
        payload.ifscCode = formData.ifscCode || null;
        payload.aadhaarNumber = formData.aadhaarNumber || null;
      }

      if (user?.role === 'transporter') {
        payload.vehicleType = formData.vehicleType || null;
        payload.vehicleCapacityKg = formData.vehicleCapacityKg !== '' ? Number(formData.vehicleCapacityKg) : null;
        payload.vehicleNumber = formData.vehicleNumber || null;
        payload.licenseNumber = formData.licenseNumber || null;
      }

      const { data } = await api.put('/auth/profile', payload);
      toast.success('Profile settings updated successfully! 🎉');
      await refreshUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const roleBadgeColors: Record<string, { bg: string; color: string; border: string }> = {
    farmer: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
    buyer: { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
    transporter: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    admin: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  };

  const currentBadge = roleBadgeColors[user.role] || roleBadgeColors.farmer;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content" style={{ maxWidth: 860 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
                Account Settings
              </h1>
              <span
                style={{
                  background: currentBadge.bg,
                  color: currentBadge.color,
                  border: `1px solid ${currentBadge.border}`,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {user.role} Portal
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
              Manage your profile, operational contact details, and settlement preferences.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 1. General Profile */}
            <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                <span style={{ fontSize: 20 }}>👤</span>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Personal & Contact Information</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email Address (Verified)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="input-field"
                    style={{ background: 'var(--color-surface-2)', cursor: 'not-allowed', opacity: 0.8 }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Email cannot be changed directly</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>KYC Verification Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
                    <span className={`badge ${user.isVerified ? 'badge-green' : 'badge-gold'}`}>
                      {user.isVerified ? '🛡️ Verified Member' : '⏳ Pending Admin Verification'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Operating / Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  placeholder="Street, Village/Mandi, District, State, PIN Code"
                />
              </div>

              {/* Geolocation */}
              <div style={{ marginTop: 16, padding: 14, background: 'var(--color-surface-2)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      📍 Farm / Base GPS Coordinates
                    </span>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                      Used for hyper-local AI weather advisories and algorithmic transport routing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={detectingGps}
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    {detectingGps ? 'Detecting...' : '🎯 Detect Current Location'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="input-field"
                      placeholder="e.g. 19.0760"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="input-field"
                      placeholder="e.g. 72.8777"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Role-Specific Details: Farmer Settlement & Land Details */}
            {user.role === 'farmer' && (
              <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>🌾</span>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Farm Acreage & Escrow Payout Details</h2>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Required for automated payment release upon OTP delivery</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Total Farm Land (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.farmSizeAcres}
                      onChange={(e) => setFormData({ ...formData, farmSizeAcres: e.target.value })}
                      className="input-field"
                      placeholder="e.g. 5.5"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Settlement UPI ID</label>
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      className="input-field"
                      placeholder="e.g. rajesh@upi"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Bank Account Number</label>
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      className="input-field"
                      placeholder="Account number for direct transfer"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Bank IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      className="input-field"
                      placeholder="e.g. SBIN0001234"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Aadhaar Number (Optional KYC)</label>
                    <input
                      type="text"
                      value={formData.aadhaarNumber}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                      className="input-field"
                      placeholder="12-digit UIDAI number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Role-Specific Details: Transporter Fleet & Logistics */}
            {user.role === 'transporter' && (
              <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>🚛</span>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Vehicle & Logistics Specifications</h2>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Configures the VRP routing engine capacity and dispatch rates</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Vehicle Category</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select vehicle type...</option>
                      <option value="Tata Ace / Mini Truck (1-1.5T)">Tata Ace / Mini Truck (1-1.5T)</option>
                      <option value="Pickup Truck (2T-3T)">Pickup Truck (2T-3T)</option>
                      <option value="Medium Commercial Vehicle (5T-7T)">Medium Commercial Vehicle (5T-7T)</option>
                      <option value="Heavy Multi-Axle Freight (10T+)">Heavy Multi-Axle Freight (10T+)</option>
                      <option value="Refrigerated Reefer Truck (Perishables)">Refrigerated Reefer Truck (Perishables)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Payload Capacity (kg)</label>
                    <input
                      type="number"
                      value={formData.vehicleCapacityKg}
                      onChange={(e) => setFormData({ ...formData, vehicleCapacityKg: e.target.value })}
                      className="input-field"
                      placeholder="e.g. 1500"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Vehicle Registration Plate</label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                      className="input-field"
                      placeholder="e.g. MH 12 AB 1234"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Commercial Driving License</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                      className="input-field"
                      placeholder="e.g. DL-0420110012345"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
              >
                {loading ? 'Saving Changes...' : '💾 Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
