'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth, Role } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

const roles = [
  { value: 'farmer' as Role, label: '🌾 Farmer', desc: 'List crops, manage orders, get AI advisory' },
  { value: 'buyer' as Role, label: '🛒 Buyer', desc: 'Browse produce, place orders, track delivery' },
  { value: 'transporter' as Role, label: '🚛 Transporter', desc: 'Accept jobs, navigate routes, earn money' },
];

function RegisterForm() {
  const { register } = useAuth();
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>((params.get('role') as Role) || 'farmer');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', address: '',
    farmSizeAcres: '', vehicleType: '', vehicleCapacityKg: '', licenseNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanFarmSize = form.farmSizeAcres ? parseFloat(form.farmSizeAcres) : undefined;
      const cleanCapacity = form.vehicleCapacityKg ? parseFloat(form.vehicleCapacityKg) : undefined;

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role,
        address: form.address.trim() || undefined,
        ...(role === 'farmer' && { farmSizeAcres: isNaN(cleanFarmSize as number) ? undefined : cleanFarmSize }),
        ...(role === 'transporter' && {
          vehicleType: form.vehicleType || undefined,
          vehicleCapacityKg: isNaN(cleanCapacity as number) ? undefined : cleanCapacity,
          licenseNumber: form.licenseNumber || undefined,
        }),
      });
      toast.success('Account created! Welcome to AgriNova 🎉');
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.details?.formErrors?.[0] ||
        (Object.values(err?.response?.data?.details?.fieldErrors || {}) as string[][])?.[0]?.[0] ||
        'Registration failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: 520, padding: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28 }}>🌿</span>
            <span className="font-display gradient-text" style={{ fontSize: 22, fontWeight: 800 }}>AgriNova</span>
          </Link>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 6 }}>Create your account</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['Choose Role', 'Your Details', 'Role Details'].map((s, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? 'var(--color-moss)' : 'var(--color-border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>How will you use AgriNova?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roles.map(r => (
                <div key={r.value} className={`role-card ${role === r.value ? 'selected' : ''}`} onClick={() => setRole(r.value)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{r.label.split(' ')[0]}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.label.split(' ').slice(1).join(' ')}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{r.desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', border: `2px solid ${role === r.value ? 'var(--color-moss)' : 'var(--color-border)'}`, background: role === r.value ? 'var(--color-moss)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {role === r.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={() => setStep(2)}>
              Continue as {role.charAt(0).toUpperCase() + role.slice(1)} →
            </button>
          </div>
        )}

        {/* Step 2: Personal details */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Full Name</label>
                <input name="name" className="input-field" placeholder="Rajesh Kumar" value={form.name} onChange={handleChange} required /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Email Address</label>
                <input name="email" type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={handleChange} required /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Mobile Number</label>
                <input name="phone" className="input-field" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} required /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Password</label>
                <input name="password" type="password" className="input-field" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>City / Address</label>
                <input name="address" className="input-field" placeholder="Nashik, Maharashtra" value={form.address} onChange={handleChange} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={() => {
                if (!form.name || !form.email || !form.phone || !form.password) { toast.error('Please fill all required fields'); return; }
                setStep(3);
              }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Role-specific details */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="animate-fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {role === 'farmer' ? '🌾 Farm Details' : role === 'transporter' ? '🚛 Vehicle Details' : '🛒 Almost Done!'}
            </h2>
            {role === 'farmer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Farm Size (Acres)</label>
                  <input name="farmSizeAcres" type="number" step="0.1" className="input-field" placeholder="e.g. 5.5" value={form.farmSizeAcres} onChange={handleChange} /></div>
              </div>
            )}
            {role === 'transporter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Vehicle Type</label>
                  <select name="vehicleType" className="input-field" value={form.vehicleType} onChange={handleChange}>
                    <option value="">Select vehicle type</option>
                    <option>Mini Truck</option><option>Tata Ace</option><option>Pickup Truck</option>
                    <option>Medium Truck</option><option>Large Truck</option><option>Refrigerated Van</option>
                  </select></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Capacity (kg)</label>
                  <input name="vehicleCapacityKg" type="number" className="input-field" placeholder="e.g. 3000" value={form.vehicleCapacityKg} onChange={handleChange} /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>License Number</label>
                  <input name="licenseNumber" className="input-field" placeholder="MH12AB1234" value={form.licenseNumber} onChange={handleChange} /></div>
              </div>
            )}
            {role === 'buyer' && (
              <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Great! You're all set to start browsing the marketplace. No additional details needed for buyers.</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button type="submit" className="btn-gold" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Creating Account...' : '🚀 Create Account'}
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--color-leaf)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
