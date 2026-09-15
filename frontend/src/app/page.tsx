'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Sprout,
  Store,
  Truck,
  Layers,
  ShieldCheck,
  Scale,
  ArrowRight,
  CheckCircle2,
  FileText
} from 'lucide-react';

const portals = [
  {
    role: 'farmer',
    icon: Sprout,
    title: 'Farmer Portal',
    desc: 'List harvested lots with photos and grade classifications, monitor pending buyer orders, and access real-time mandi modal prices.',
    color: '#0D9488',
    bg: '#F0FDFA',
    border: '#CCFBF1',
    link: '/auth/register?role=farmer',
    cta: 'Register as Farmer',
  },
  {
    role: 'buyer',
    icon: Store,
    title: 'Wholesale Buyer Marketplace',
    desc: 'Browse verified farm produce lots, filter by grade and location, place orders with escrow protection, and receive OTP-verified delivery.',
    color: '#0F766E',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    link: '/auth/register?role=buyer',
    cta: 'Source Produce',
  },
  {
    role: 'transporter',
    icon: Truck,
    title: 'Logistics and Freight Dispatch',
    desc: 'Accept regional transport consignments with dynamic distance-based pricing and algorithmic route planning for multi-point pickups.',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    link: '/auth/register?role=transporter',
    cta: 'Accept Freight Jobs',
  },
];

const capabilities = [
  {
    icon: Scale,
    title: 'Transparent Mandi Benchmarking',
    desc: 'Access official Agmarknet wholesale commodity prices across regional mandis to set fair selling prices without broker markdown.',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow Transaction Security',
    desc: 'Buyer funds are placed in escrow upon order submission and disbursed to farmers and transporters only upon verified OTP recipient delivery.',
  },
  {
    icon: Layers,
    title: 'Multi-Stop Route Dispatch',
    desc: 'Logistics routes utilize nearest-neighbor vehicle routing heuristics to consolidate nearby farm pickups and minimize carrier deadhead mileage.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Account Registration and KYC',
    desc: 'Create an account as a farmer, buyer, or transporter with identity verification and location details.',
  },
  {
    num: '02',
    title: 'Direct Lot Listing and Sourcing',
    desc: 'Farmers publish produce lots with harvest dates and quality grades. Buyers evaluate listings with transparent price data.',
  },
  {
    num: '03',
    title: 'Escrow Order Placement',
    desc: 'Buyers confirm purchase orders with secure escrow funding, reserving the produce lot and generating carrier dispatch tickets.',
  },
  {
    num: '04',
    title: 'Consolidated Transit and Settlement',
    desc: 'Transporters complete route stops and deliver produce. Recipient OTP entry verifies receipt and releases escrow payout immediately.',
  },
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
    <main style={{ background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>

      {/* Navigation */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 6,
            background: '#0D9488',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF',
          }}>
            <Sprout size={20} />
          </div>
          <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>
            Agri<span style={{ color: '#0D9488' }}>Nova</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/auth/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13, borderRadius: 6 }}>
            Sign In
          </Link>
          <Link href="/auth/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, borderRadius: 6 }}>
            <span>Get Started</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '72px 32px 56px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F0FDFA 100%)',
        borderBottom: '1px solid #E2E8F0',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', borderRadius: 6,
            background: '#CCFBF1', border: '1px solid #99F6E4',
            color: '#0F766E', fontSize: 12, fontWeight: 700,
            marginBottom: 20,
          }}>
            <CheckCircle2 size={14} />
            <span>Direct Agricultural Trading and Freight Infrastructure</span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(32px, 4.5vw, 54px)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 20,
            color: '#0F172A',
            letterSpacing: -0.5,
          }}>
            Direct Agricultural Marketplace for Farmers, Commercial Buyers, and Transporters
          </h1>

          <p style={{
            fontSize: 16,
            color: '#475569',
            lineHeight: 1.7,
            marginBottom: 36,
            maxWidth: 680,
            margin: '0 auto 36px',
          }}>
            Connect verified agricultural producers with commercial wholesale buyers and regional carriers. Execute direct harvest lot sales with official mandi price benchmarking, escrow payment releases, and multi-point logistics dispatch.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register?role=farmer" className="btn-primary" style={{ fontSize: 14, padding: '11px 24px', borderRadius: 6 }}>
              <Sprout size={16} />
              <span>Register as Farmer</span>
            </Link>
            <Link href="/auth/register?role=buyer" className="btn-secondary" style={{ fontSize: 14, padding: '11px 24px', borderRadius: 6 }}>
              <Store size={16} />
              <span>Source Wholesale Produce</span>
            </Link>
            <Link href="/auth/register?role=transporter" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 14, padding: '11px 24px', borderRadius: 6,
              background: '#FFFBEB', border: '1px solid #FDE68A',
              color: '#B45309', fontWeight: 600, textDecoration: 'none',
            }}>
              <Truck size={16} />
              <span>Join as Transporter</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Portal Architecture */}
      <section style={{ padding: '64px 32px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
            Role-Based Marketplace Portals
          </h2>
          <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>
            Dedicated workflows built for the three primary participants in agricultural trade
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {portals.map((p) => {
            const IconComponent = p.icon;
            return (
              <div key={p.role} style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              }}>
                <div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 6,
                    background: p.bg, border: `1px solid ${p.border}`,
                    color: p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 18,
                  }}>
                    <IconComponent size={22} />
                  </div>
                  <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                    {p.desc}
                  </p>
                </div>
                <Link href={p.link} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 6,
                  background: p.bg, border: `1px solid ${p.border}`,
                  color: p.color, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none',
                }}>
                  <span>{p.cta}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section style={{ padding: '60px 32px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Operational Reliability and Settlement Security
            </h2>
            <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>
              Engineered for verifiable transactions and predictable logistics fulfillment
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {capabilities.map((c, i) => {
              const IconComp = c.icon;
              return (
                <div key={i} style={{
                  padding: 24,
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 6,
                    background: '#0D9488', color: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <IconComp size={20} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    {c.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, margin: 0 }}>
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Transaction Workflow */}
      <section style={{ padding: '64px 32px', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
            Trading Lifecycle
          </h2>
          <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>
            Standardized procedure from initial harvest lot listing to delivery verification
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '24px 20px',
              position: 'relative',
            }}>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 900, color: '#0D9488', opacity: 0.35, lineHeight: 1, marginBottom: 12 }}>
                {s.num}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section style={{ padding: '40px 32px 64px' }}>
        <div style={{
          maxWidth: 720, margin: '0 auto', padding: '44px 40px',
          background: '#0D9488',
          borderRadius: 8, color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(13,148,136,0.18)',
          textAlign: 'center',
        }}>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
            Start Trading on AgriNova
          </h2>
          <p style={{ opacity: 0.9, marginBottom: 26, fontSize: 15, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 26px' }}>
            Register your enterprise as a grower, wholesale buyer, or carrier to access direct trading and coordinated dispatch.
          </p>
          <Link href="/auth/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 28px', borderRadius: 6,
            background: '#FFFFFF', color: '#0D9488',
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}>
            <span>Create Account</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px',
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        fontSize: 13,
        color: '#64748B',
      }}>
        <div style={{
          maxWidth: 1120, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 4,
              background: '#0D9488', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sprout size={14} />
            </div>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>AgriNova Marketplace</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: '#64748B', textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link href="/admin/login" style={{ color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
