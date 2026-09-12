'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useRequireRole, api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Green Chilli', 'Brinjal', 'Cauliflower', 'Cabbage', 'Carrot', 'Rice', 'Wheat', 'Maize', 'Soybean', 'Groundnut', 'Sugarcane', 'Cotton', 'Other'];

interface MLPriceRec {
  cropName: string;
  qualityGrade: string;
  quantityKg: number;
  recommendedPricePerKg: number;
  fastSalePricePerKg: number;
  maxProfitPricePerKg: number;
  buyerDemandLevel: string;
  expectedDaysToClear: number;
  historicalBuyerAvgPrice: number | null;
  marketInsight: string;
}

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

  // ML Price recommendation state
  const [mlRec, setMlRec] = useState<MLPriceRec | null>(null);
  const [loadingML, setLoadingML] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  // Fetch ML price recommendation dynamically
  useEffect(() => {
    if (!form.cropName) {
      setMlRec(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingML(true);
      try {
        const qty = parseFloat(form.quantityKg) || 500;
        const { data } = await api.get(
          `/ml/farmer/price-recommendation?cropName=${encodeURIComponent(form.cropName)}&grade=${form.qualityGrade}&quantityKg=${qty}`
        );
        if (data?.recommendation) {
          setMlRec(data.recommendation);
        }
      } catch {
        // Silent catch for ML preview
      } finally {
        setLoadingML(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [form.cropName, form.qualityGrade, form.quantityKg]);

  const applyMLPrice = () => {
    if (!mlRec) return;
    setForm(f => ({ ...f, pricePerKg: mlRec.recommendedPricePerKg.toString() }));
    toast.success(`Applied ML Suggested Price: ₹${mlRec.recommendedPricePerKg}/kg`);
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
        <div className="page-content" style={{ maxWidth: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <Link href="/farmer/listings" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>← Listings</Link>
            <span style={{ color: 'var(--color-text-muted)' }}>/</span>
            <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>Add New Listing</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="glass" style={{ padding: 28, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Crop & Pricing Details</h2>
                <span className="badge badge-gold" style={{ fontSize: 11 }}>ML Assisted</span>
              </div>

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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                    Your Selling Price per kg (₹) *
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input name="pricePerKg" type="number" step="0.01" className="input-field" placeholder="e.g. 25.50" value={form.pricePerKg} onChange={handleChange} required style={{ flex: 1 }} />
                    {mlRec && (
                      <button
                        type="button"
                        onClick={applyMLPrice}
                        className="btn-gold"
                        style={{ fontSize: 13, padding: '0 18px', whiteSpace: 'nowrap' }}
                      >
                        ✨ Apply ML Price (₹{mlRec.recommendedPricePerKg})
                      </button>
                    )}
                  </div>
                </div>

                {/* ML Smart Price Advisor Widget */}
                {form.cropName && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(212, 160, 23, 0.08)',
                      border: '1px solid rgba(212, 160, 23, 0.3)',
                      marginTop: 4
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🧠</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#F8FAFC' }}>
                          ML Smart Price Advisor for {form.cropName}
                        </span>
                      </div>
                      {loadingML ? (
                        <span style={{ fontSize: 12, color: 'var(--color-gold)' }}>Analyzing buyer trends...</span>
                      ) : (
                        mlRec && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}>
                            Demand: {mlRec.buyerDemandLevel}
                          </span>
                        )
                      )}
                    </div>

                    {mlRec && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
                          <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>ML Recommended</span>
                            <span className="font-display" style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-gold-light)' }}>
                              ₹{mlRec.recommendedPricePerKg}/kg
                            </span>
                          </div>
                          <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Fast Sale Target</span>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#38BDF8' }}>
                              ₹{mlRec.fastSalePricePerKg}/kg
                            </span>
                          </div>
                          <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Max Margin Cap</span>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#F472B6' }}>
                              ₹{mlRec.maxProfitPricePerKg}/kg
                            </span>
                          </div>
                          <div style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Est. Clearance</span>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#A7F3D0' }}>
                              ~{mlRec.expectedDaysToClear} days
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          💡 {mlRec.marketInsight}
                        </p>
                      </div>
                    )}
                  </div>
                )}

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
                  <textarea name="description" className="input-field" style={{ resize: 'vertical', minHeight: 70 }} placeholder="Describe quality, storage conditions, packaging..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
                <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Gross Revenue</span>
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
