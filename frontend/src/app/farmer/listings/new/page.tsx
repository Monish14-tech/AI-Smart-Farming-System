'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Green Chilli', 'Brinjal', 'Cauliflower', 'Cabbage', 'Carrot', 'Rice', 'Wheat', 'Maize', 'Soybean', 'Groundnut', 'Sugarcane', 'Cotton', 'Other'];

export default function NewListing() {
  const { user, loading } = useRequireRole('farmer');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    cropName: '', qualityGrade: 'A', quantityKg: '', pricePerKg: '',
    harvestDate: '', description: '', latitude: '', longitude: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cropName || !form.quantityKg || !form.pricePerKg) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      images.forEach(img => formData.append('images', img));

      await api.post('/farmer/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Listing created! 🎉');
      router.push('/farmer/listings');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content" style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <Link href="/farmer/listings" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>← Listings</Link>
            <span style={{ color: 'var(--color-text-muted)' }}>/</span>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800 }}>Add New Listing</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="glass" style={{ padding: 28, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Crop Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Crop Name *</label>
                  <select name="cropName" className="input-field" value={form.cropName} onChange={handleChange} required>
                    <option value="">Select crop...</option>
                    {CROPS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Quality Grade *</label>
                  <select name="qualityGrade" className="input-field" value={form.qualityGrade} onChange={handleChange}>
                    <option value="A">Grade A — Premium</option>
                    <option value="B">Grade B — Standard</option>
                    <option value="C">Grade C — Economy</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Quantity (kg) *</label>
                  <input name="quantityKg" type="number" step="0.1" className="input-field" placeholder="e.g. 500" value={form.quantityKg} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Price per kg (₹) *</label>
                  <input name="pricePerKg" type="number" step="0.01" className="input-field" placeholder="e.g. 25.50" value={form.pricePerKg} onChange={handleChange} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Harvest Date</label>
                  <input name="harvestDate" type="date" className="input-field" value={form.harvestDate} onChange={handleChange} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Location (optional)</label>
                  <input name="latitude" type="number" step="any" className="input-field" placeholder="Latitude" value={form.latitude} onChange={handleChange} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>Description</label>
                  <textarea name="description" className="input-field" style={{ resize: 'vertical', minHeight: 80 }} placeholder="Describe quality, storage conditions, packaging..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Image upload */}
            <div className="glass" style={{ padding: 28, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Crop Photos</h2>
              <label htmlFor="images" style={{ display: 'block', padding: 24, border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload photos</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Up to 5 images, JPG/PNG/WebP. Cloudinary upload.</div>
                <input id="images" type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} />
              </label>
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  {previews.map((p, i) => (
                    <img key={i} src={p} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              )}
            </div>

            {/* Revenue preview */}
            {form.quantityKg && form.pricePerKg && (
              <div className="glass stat-glow-gold" style={{ padding: 20, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Revenue</span>
                <span className="font-display" style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-gold-light)' }}>
                  ₹{(parseFloat(form.quantityKg) * parseFloat(form.pricePerKg)).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/farmer/listings" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</Link>
              <button type="submit" className="btn-gold" style={{ flex: 2 }} disabled={saving}>
                {saving ? 'Publishing...' : '🌾 Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
