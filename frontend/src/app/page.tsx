'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const features = [
  {
    icon: '🌾', title: 'Farmer Portal',
    desc: 'List crops, manage orders, track earnings and get AI-powered advisory on pest control, weather and government schemes.',
    color: '#059669', bg: '#ECFDF5', border: '#A7F3D0',
  },
  {
    icon: '🛒', title: 'Buyer Marketplace',
    desc: 'Browse fresh produce directly from verified farmers. AI shopping assistant helps you find the best quality at best prices.',
    color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE',
  },
  {
    icon: '🚛', title: 'Smart Logistics',
    desc: 'AI-powered route optimizer (VRP algorithm) assigns transporters the most efficient multi-pickup, multi-drop routes.',
    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A',
  },
  {
    icon: '🤖', title: 'Gemini AI Chat',
    desc: 'Two specialized AI bots — crop advisory for farmers and natural language product search for buyers.',
    color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
  },
];

const stats = [
  { value: '50K+', label: 'Farmers Registered', color: '#059669' },
  { value: '₹2.4Cr', label: 'Trade Volume', color: '#D97706' },
  { value: '1,200+', label: 'Transporters', color: '#4F46E5' },
  { value: '98%', label: 'On-time Delivery', color: '#0D9488' },
];

const crops = ['🍅 Tomato', '🧅 Onion', '🥔 Potato', '🌾 Rice', '🌽 Maize', '🌶️ Chilli', '🍆 Brinjal', '🥦 Cauliflower'];

const steps = [
  { num: '01', title: 'Register & Verify', desc: 'Sign up as farmer, buyer, or transporter. Upload KYC docs for verification.' },
  { num: '02', title: 'List or Browse', desc: 'Farmers list produce with photos & pricing. Buyers browse with AI-powered search.' },
  { num: '03', title: 'Order & Pay', desc: 'Buyers place orders with escrow payment. Funds held until delivery is confirmed.' },
  { num: '04', title: 'Deliver & Confirm', desc: 'AI-optimized transporter routes. OTP-based delivery confirmation releases payment.' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const map: Record<string, string> = {
        farmer: '/farmer/dashboard',
        buyer: '/buyer/dashboard',
        transporter: '/transporter/dashboard',
        admin: '/admin/dashboard',
      };
      router.replace(map[user.role] || '/farmer/dashboard');
    }
  }, [user, loading, router]);

  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #0D9488, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🌿</div>
          <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
            Agri<span style={{ color: '#0D9488' }}>Nova</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/auth/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }}>Sign In</Link>
          <Link href="/auth/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>Get Started →</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 48px 60px',
        background: 'linear-gradient(135deg, #F0FDFA 0%, #EEF2FF 60%, #FFFBEB 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="animate-fade-in" style={{ maxWidth: 740, margin: '0 auto', position: 'relative' }}>
          <span className="badge badge-teal" style={{ fontSize: 12, marginBottom: 20, display: 'inline-flex' }}>
            🇮🇳 Built for Indian Agriculture
          </span>
          <h1 className="font-display" style={{ fontSize: 'clamp(38px, 5.5vw, 68px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, color: '#0F172A' }}>
            From Farm to{' '}
            <span style={{ color: '#0D9488' }}>Market</span>
            <br />Without Middlemen
          </h1>
          <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.75, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px' }}>
            A role-based agricultural platform connecting farmers, buyers, and transporters through AI-assisted marketplace, route optimization, and conversational AI.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/auth/register?role=farmer" className="btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
              🌾 I&apos;m a Farmer
            </Link>
            <Link href="/auth/register?role=buyer" style={{
              fontSize: 15, padding: '13px 28px', display: 'inline-flex', alignItems: 'center', gap: 8,
              borderRadius: 'var(--radius-md)', background: '#EEF2FF', border: '1px solid #C7D2FE',
              color: '#4338CA', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none',
            }}>
              🛒 I&apos;m a Buyer
            </Link>
            <Link href="/auth/register?role=transporter" style={{
              fontSize: 15, padding: '13px 28px', display: 'inline-flex', alignItems: 'center', gap: 8,
              borderRadius: 'var(--radius-md)', background: '#FFFBEB', border: '1px solid #FDE68A',
              color: '#B45309', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none',
            }}>
              🚛 I&apos;m a Transporter
            </Link>
          </div>

          {/* Scrolling crop tags */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'inline-flex', gap: 10 }}>
              {[...crops, ...crops].map((c, i) => (
                <span key={i} className="badge badge-teal" style={{ fontSize: 12, padding: '5px 12px', whiteSpace: 'nowrap' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 48px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 1, background: '#E2E8F0', borderRadius: 16, overflow: 'hidden',
          border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
          maxWidth: 840, margin: '0 auto',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: '#fff', textAlign: 'center', padding: '28px 20px' }}>
              <div className="font-display" style={{ fontSize: 34, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 48px' }}>
        <h2 className="font-display" style={{ textAlign: 'center', fontSize: 34, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
          Everything in One Platform
        </h2>
        <p style={{ textAlign: 'center', color: '#64748B', marginBottom: 48, fontSize: 16 }}>
          Designed for India&apos;s agricultural ecosystem
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, maxWidth: 1080, margin: '0 auto' }}>
          {features.map((f, i) => (
            <div key={i} className="glass-hover" style={{
              background: '#fff', border: `1px solid ${f.border}`,
              borderRadius: 16, padding: 28,
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
              transition: 'all 0.2s ease',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 12,
                background: f.bg, border: `1px solid ${f.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 18,
              }}>{f.icon}</div>
              <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, color: f.color, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section style={{ padding: '60px 48px', background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <h2 className="font-display" style={{ textAlign: 'center', fontSize: 34, fontWeight: 800, color: '#0F172A', marginBottom: 48 }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0, maxWidth: 900, margin: '0 auto' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ padding: '20px 28px', textAlign: 'center', borderRight: i < 3 ? '1px solid #E2E8F0' : 'none' }}>
              <div className="font-display" style={{ fontSize: 44, fontWeight: 900, color: '#0D9488', opacity: 0.25, lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#0F172A' }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 580, margin: '0 auto', padding: '52px 48px',
          background: 'linear-gradient(135deg, #0D9488, #059669)',
          borderRadius: 20, color: '#fff',
          boxShadow: '0 20px 48px rgba(13,148,136,0.25)',
        }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🚀</div>
          <h2 className="font-display" style={{ fontSize: 30, fontWeight: 800, marginBottom: 14 }}>
            Ready to Transform Your Agri-Business?
          </h2>
          <p style={{ opacity: 0.85, marginBottom: 32, fontSize: 15 }}>
            Join thousands of farmers, buyers and transporters already on AgriNova.
          </p>
          <Link href="/auth/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 36px', borderRadius: 10,
            background: '#fff', color: '#0D9488',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
          }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{
        padding: '28px 48px', borderTop: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌿</span>
          <span className="font-display" style={{ fontWeight: 700, color: '#0F172A' }}>AgriNova</span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#64748B', alignItems: 'center' }}>
          <span>Stack: Next.js · Express · PostgreSQL · Gemini AI</span>
          <Link href="/admin/login" style={{ color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>
            🛡️ Admin Portal
          </Link>
        </div>
      </footer>
    </main>
  );
}
