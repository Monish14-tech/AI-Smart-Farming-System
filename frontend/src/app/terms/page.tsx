'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Scale,
  Sprout,
  Store,
  Truck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Search,
  ArrowRight,
  Lock,
  HelpCircle,
  Clock,
  Printer,
  FileCheck,
  Info
} from 'lucide-react';

interface Section {
  id: string;
  category: 'general' | 'farmer' | 'buyer' | 'transporter' | 'escrow' | 'disputes';
  number: string;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

export default function TermsAndConditionsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections: Section[] = [
    {
      id: 'agreement',
      category: 'general',
      number: '01',
      title: 'Agreement to Terms & Platform Scope',
      badge: 'Core Foundation',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            These Terms of Service (<strong>&quot;Terms&quot;</strong> or <strong>&quot;Agreement&quot;</strong>) constitute a legally binding agreement between you (whether accessing the platform as a <strong>Farmer</strong>, <strong>Wholesale Buyer</strong>, or <strong>Transporter</strong>, collectively referred to as <strong>&quot;Participants&quot;</strong>) and <strong>AgriNova Marketplace Technologies Private Limited</strong> (<strong>&quot;AgriNova,&quot; &quot;the Platform,&quot; &quot;we,&quot; &quot;our,&quot;</strong> or <strong>&quot;us&quot;</strong>).
          </p>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            By registering an account, listing farm produce, committing escrow funds, or accepting regional transport consignments, you acknowledge that you have read, understood, and consented to be bound by these Terms and our companion <Link href="/privacy" style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
          <div style={{
            background: '#F0FDFA',
            border: '1px solid #99F6E4',
            borderRadius: 10,
            padding: '16px 20px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start'
          }}>
            <Info size={20} color="#0D9488" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: '#0F766E', lineHeight: 1.6 }}>
              <strong>Platform Intermediary Notice:</strong> AgriNova operates as a digital trade enablement platform under Section 79 of India&apos;s Information Technology Act, 2000. AgriNova facilitates direct, transparent counterparty transactions, algorithmic route dispatch, and automated escrow disbursements, but does not take ownership or physical possession of agricultural commodities.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'farmer-obligations',
      category: 'farmer',
      number: '02',
      title: 'Farmer (Producer) Responsibilities & Quality Tiers',
      badge: 'For Farmers',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            Registered agricultural producers listing commodities on the AgriNova marketplace enter into direct supply agreements with wholesale purchasers and commit to maintaining verified quality standards:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#059669', fontWeight: 700, fontSize: 14 }}>
                <Sprout size={18} />
                <span>Grade Authenticity</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Produce lots must adhere strictly to the published grade declaration (Grade A, B, or C). Size, color uniformity, and moisture criteria must match marketplace listing records.
              </p>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#059669', fontWeight: 700, fontSize: 14 }}>
                <Clock size={18} />
                <span>Dispatch Readiness</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Farmers must prepare, weigh, and bag harvested produce lots prior to the scheduled carrier pickup window. Verified scale calibration is required for accurate lot weight.
              </p>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#059669', fontWeight: 700, fontSize: 14 }}>
                <ShieldCheck size={18} />
                <span>Payment Protection</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Orders confirmed on AgriNova have 100% pre-funded escrow backing. Once delivery OTP is authorized at the destination, payout is automatically wired to the farmer&apos;s linked bank account.
              </p>
            </div>
          </div>
          <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.8 }}>
            <li><strong>Listing Verification:</strong> Photos uploaded must reflect the actual batch harvest lot without deceptive color or grading filters.</li>
            <li><strong>Farm-Gate Access:</strong> The seller agrees to provide safe, vehicle-accessible loading space for the designated transport vehicle.</li>
            <li><strong>Cancellation Restraints:</strong> Once an order is accepted and assigned to a transporter route, the farmer may not cancel the transaction without incurring listing penalty flags.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'buyer-obligations',
      category: 'buyer',
      number: '03',
      title: 'Wholesale Buyer Standards & Escrow Commitments',
      badge: 'For Buyers',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            Commercial procurement enterprises, distributors, supermarkets, and food processors utilizing AgriNova agree to structured purchase, inspection, and verification protocols:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 18px' }}>
              <Store size={22} color="#4F46E5" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: 14, color: '#1E293B', display: 'block', marginBottom: 4 }}>100% Escrow Upfront Funding</strong>
                <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                  Buyers must fund purchase orders in full upon placement. Capital is locked safely in the automated platform escrow facility and is not accessible to the seller until recipient authorization.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 18px' }}>
              <CheckCircle2 size={22} color="#4F46E5" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: 14, color: '#1E293B', display: 'block', marginBottom: 4 }}>Physical Inspection Window</strong>
                <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                  Upon transporter arrival at the delivery dock, the buyer possesses an immediate on-site inspection window to verify lot count, net weight, and visual grade conformity before providing the verification OTP.
                </p>
              </div>
            </div>
          </div>
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 10,
            padding: '16px 20px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={20} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: '#92400E', lineHeight: 1.6 }}>
              <strong>Critical Delivery OTP Policy:</strong> The six-digit delivery verification code represents definitive acceptance of the agricultural lot. <strong>Never share the OTP with a transporter prior to completing physical visual and scale inspection.</strong> Releasing the OTP immediately triggers non-reversible settlement to the seller.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'transporter-obligations',
      category: 'transporter',
      number: '04',
      title: 'Transporter Dispatch, Telemetry & Freight Terms',
      badge: 'For Transporters',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            Freight carriers and independent vehicle owners providing agricultural haulage services through AgriNova operate under our coordinated logistics network:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#B45309', fontWeight: 700, fontSize: 14 }}>
                <Truck size={18} />
                <span>Consolidated Multi-Stop Routing</span>
              </div>
              <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, margin: 0 }}>
                Carriers agree to service all stops designated in the optimized vehicle route plan (VRP), collecting specified lots from registered farm-gates without unauthorized side deviations.
              </p>
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#B45309', fontWeight: 700, fontSize: 14 }}>
                <Lock size={18} />
                <span>Cargo Care & Roadworthiness</span>
              </div>
              <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, margin: 0 }}>
                Vehicles must maintain valid fitness certificates, commercial insurance, and waterproof tarpaulins to protect produce lots against inclement weather and road dust.
              </p>
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#B45309', fontWeight: 700, fontSize: 14 }}>
                <Scale size={18} />
                <span>Instant Freight Settlement</span>
              </div>
              <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, margin: 0 }}>
                Dynamic kilometer-based freight earnings are locked into platform escrow at consignment dispatch and automatically disbursed into the driver&apos;s account upon buyer delivery confirmation.
              </p>
            </div>
          </div>
          <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.8 }}>
            <li><strong>Telematics & Status Updates:</strong> Carriers agree to maintain live transit status reporting throughout active dispatch routes.</li>
            <li><strong>Gross Negligence:</strong> Transporters are liable for cargo shrinkage or spoilage caused by unapproved overnight delays, improper securing, or reckless operation.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'escrow-framework',
      category: 'escrow',
      number: '05',
      title: 'Automated Escrow Architecture & Fee Structures',
      badge: 'Financial Framework',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            To safeguard regional agricultural commerce from payment defaults and dishonored checks, AgriNova enforces an end-to-end automated escrow framework across all marketplace orders:
          </p>

          {/* Workflow Steps Visual */}
          <div style={{
            background: 'linear-gradient(135deg, #F0FDFA 0%, #F8FAFC 100%)',
            border: '1px solid #CCFBF1',
            borderRadius: 12,
            padding: '24px 20px'
          }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              The 4-Step Escrow Payout Lifecycle
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0D9488', marginBottom: 4 }}>STEP 01</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 4 }}>Escrow Deposit</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  Buyer places order; 100% invoice amount is securely reserved in escrow.
                </div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0D9488', marginBottom: 4 }}>STEP 02</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 4 }}>Route Lock</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  Freight allocation locked; transporter receives waypoint dispatch instructions.
                </div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0D9488', marginBottom: 4 }}>STEP 03</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 4 }}>OTP Confirmation</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  Buyer verifies lot quality at destination and provides 6-digit confirmation code.
                </div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0D9488', marginBottom: 4 }}>STEP 04</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 4 }}>Split Settlement</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  Funds disburse immediately: produce value to farmer, freight to transporter.
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Platform Infrastructure Fees:</strong> AgriNova retains a transparent 1.5% to 2.5% technological facilitation fee per settled order, covering escrow banking integrations, real-time vehicle route computation, and mandi price benchmarking infrastructure.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'disputes',
      category: 'disputes',
      number: '06',
      title: 'Dispute Resolution, Inspection Claims & Refund Protocols',
      badge: 'Buyer & Seller Protection',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            To resolve commercial agricultural discrepancies fairly and swiftly without costly formal litigation, all platform participants submit to our formal arbitration mechanism:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#E11D48" />
                <span>Pre-OTP Claim Requirement</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                If delivered commodities materially depart from the registered grade tier, show signs of transit spoilage, or fall short in weight, the buyer must raise a formal platform dispute <strong>before</strong> entering the delivery OTP.
              </p>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={18} color="#0D9488" />
                <span>Evidence-Based Resolution</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                AgriNova operations review lot photographic timestamps, digital weigh-bridge receipts, and transporter GPS logs. Resolutions may include partial escrow refunds, price renegotiation, or full refund authorization.
              </p>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', margin: 0 }}>
            In cases where an entire produce lot is rightfully rejected due to spoilage caused by carrier delays, the buyer receives a full refund from escrow, and freight compensation to the carrier is forfeited.
          </p>
        </div>
      ),
    },
    {
      id: 'liability',
      category: 'general',
      number: '07',
      title: 'Limitation of Liability & Technology Intermediary Status',
      badge: 'Legal Disclaimer',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            AgriNova provides digital software interfaces, price prediction models, and route optimization heuristics. While we perform rigorous identity and farm verification (KYC), AgriNova expressly disclaims liability for:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.8 }}>
            <li>Natural agricultural perishability, crop disease, or weather-induced degradation occurring after verified delivery.</li>
            <li>Direct or consequential commercial losses arising from severe natural weather events (floods, cyclones, highway landslides) delaying carrier transit.</li>
            <li>Inaccurate self-reported data submitted by participants during portal registration or mandi commodity uploads.</li>
          </ul>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 14, margin: 0 }}>
            In all events, the total cumulative liability of AgriNova for any claim arising out of marketplace transactions shall be capped at the platform service fee received for that specific transaction.
          </p>
        </div>
      ),
    },
    {
      id: 'governing-law',
      category: 'general',
      number: '08',
      title: 'Governing Law, Jurisdiction & Grievance Mechanism',
      badge: 'Statutory Compliance',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
            These Terms shall be interpreted, construed, and enforced in accordance with the substantive laws of the <strong>Republic of India</strong>, including the Indian Contract Act (1872), Information Technology Act (2000), and the Digital Personal Data Protection Act (DPDP Act 2023).
          </p>
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Exclusive Jurisdiction</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>Commercial Courts of Coimbatore</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Tamil Nadu, India</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Grievance Officer</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>Compliance & Legal Operations</div>
              <div style={{ fontSize: 13, color: '#0D9488', marginTop: 2 }}>legal@agrinova.market</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Resolution Turnaround</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>Within 48 Business Hours</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Direct statutory acknowledgment</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const faqs = [
    {
      q: 'When does a farmer receive payment for delivered produce?',
      a: 'Payment is disbursed automatically as soon as the wholesale buyer inspects the goods at destination and provides the six-digit delivery OTP. Funds move directly from platform escrow to the farmer’s verified bank account without intermediary delay.'
    },
    {
      q: 'What should a buyer do if produce arrives below the agreed quality grade?',
      a: 'The buyer must NOT provide the delivery verification OTP. Instead, tap "Raise Dispute" within the buyer portal. Upload photos of the batch and weigh-slip. Platform operations will review within 24 hours to enforce partial refund, price adjustment, or full order return.'
    },
    {
      q: 'Can a transporter cancel an accepted route assignment?',
      a: 'Transporters can only cancel an assigned route prior to picking up the first farmer consignment. Cancellations without valid vehicle mechanical distress lower the carrier reliability score and may restrict subsequent high-value regional haulage dispatches.'
    },
    {
      q: 'Are all commodity transactions covered by escrow protection?',
      a: 'Yes. 100% of marketplace trade orders processed through AgriNova utilize automated escrow holding. Neither cash-on-delivery nor unsecured post-dated credit is permitted on the platform.'
    },
  ];

  // Filter sections according to active category and search
  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesCat =
        activeCategory === 'all' ||
        section.category === activeCategory ||
        (activeCategory === 'general' && section.category === 'general');

      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const inTitle = section.title.toLowerCase().includes(query);
      const inNumber = section.number.toLowerCase().includes(query);
      const inBadge = section.badge?.toLowerCase().includes(query) ?? false;
      return inTitle || inNumber || inBadge;
    });
  }, [sections, activeCategory, searchQuery]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>
      {/* ─── Navigation Header ────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: 68,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/logo.png"
            alt="AgriNova Logo"
            width={34}
            height={34}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
            priority
          />
          <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>
            Agri<span style={{ color: '#0D9488' }}>Nova</span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link
            href="/"
            style={{ color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
          >
            Home
          </Link>
          <Link
            href="/privacy"
            style={{ color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#0D9488',
              color: '#FFFFFF',
              padding: '7px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(13,148,136,0.2)'
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 100%)',
        borderBottom: '1px solid #E2E8F0',
        padding: '52px 24px 44px',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          {/* Breadcrumb & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#CCFBF1',
              color: '#0F766E',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4
            }}>
              <FileCheck size={14} />
              LEGAL & PLATFORM GOVERNANCE
            </span>
            <span style={{ fontSize: 13, color: '#64748B' }}>•</span>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              Updated March 15, 2026
            </span>
            <span style={{ fontSize: 13, color: '#64748B' }}>•</span>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              Version 2.4 (Statutory Indian DPDP & IT Act Aligned)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ maxWidth: 720 }}>
              <h1 className="font-display" style={{
                fontSize: 'clamp(32px, 4vw, 44px)',
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: -1,
                lineHeight: 1.15,
                margin: '0 0 14px'
              }}>
                Terms of Service
              </h1>
              <p style={{
                fontSize: 16,
                color: '#475569',
                lineHeight: 1.65,
                margin: 0
              }}>
                The governing contractual standard for agricultural producers, commercial buyers, and freight carriers on AgriNova. Engineered to guarantee 100% escrow settlement, eliminate unfair middleman markdowns, and provide automated multi-stop transport coordination.
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
                }}
              >
                <Printer size={16} />
                Print / Save PDF
              </button>
              <Link
                href="/privacy"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  background: '#0D9488',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(13,148,136,0.2)'
                }}
              >
                Privacy Policy
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Key Assurance Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginTop: 36
          }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#0D9488' }}>
                <ShieldCheck size={20} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Zero Counterparty Risk</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Orders are 100% pre-funded in secure escrow before transporter pickup dispatch.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#059669' }}>
                <Sprout size={20} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Transparent Mandi Pricing</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Real-time official Agmarknet benchmark data ensures equitable returns for producers.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#B45309' }}>
                <Truck size={20} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Optimized Logistics</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Dynamic vehicle routing heuristics minimize deadhead mileage and transport carbon footprint.
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#4F46E5' }}>
                <Scale size={20} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Fair Dispute Audit</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Pre-OTP dispute arbitration with photographic lot evidence and transit GPS telemetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Search & Category Filter Toolbar ─────────────────────────── */}
      <section style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 24px',
        position: 'sticky',
        top: 68,
        zIndex: 40,
        boxShadow: '0 2px 4px rgba(15,23,42,0.03)'
      }}>
        <div style={{
          maxWidth: 1160,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Category Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { id: 'all', label: 'All Sections' },
              { id: 'farmer', label: 'Farmers' },
              { id: 'buyer', label: 'Wholesale Buyers' },
              { id: 'transporter', label: 'Transporters' },
              { id: 'escrow', label: 'Escrow & Payouts' },
              { id: 'disputes', label: 'Quality & Disputes' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeCategory === cat.id ? '1px solid #0D9488' : '1px solid #E2E8F0',
                  background: activeCategory === cat.id ? '#0D9488' : '#F8FAFC',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '6px 14px',
            width: '100%',
            maxWidth: 300,
          }}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search terms, escrow, OTP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                color: '#0F172A',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#94A3B8',
                  padding: 0
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Main Content Grid: Sidebar TOC + Cards ───────────────────── */}
      <div style={{ maxWidth: 1160, margin: '40px auto', padding: '0 24px 80px' }}>
        <style>{`
          @media (max-width: 860px) {
            .terms-layout-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
            .terms-sidebar {
              position: static !important;
              max-height: none !important;
            }
          }
        `}</style>
        <div
          className="terms-layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: 40,
            alignItems: 'flex-start'
          }}
        >
          {/* Left: Sticky Table of Contents */}
          <aside
            className="terms-sidebar"
            style={{
              position: 'sticky',
              top: 154,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              maxHeight: 'calc(100vh - 180px)',
              overflowY: 'auto'
            }}
          >
            <div style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#0D9488',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 12
            }}>
              Table of Contents
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    lineHeight: 1.4,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F0FDFA';
                    e.currentTarget.style.color = '#0D9488';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#94A3B8', fontSize: 11, minWidth: 20 }}>
                    {sec.number}
                  </span>
                  <span style={{ fontWeight: 500 }}>{sec.title}</span>
                </button>
              ))}
            </nav>

            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <Link
                href="/privacy"
                style={{
                  fontSize: 13,
                  color: '#64748B',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FileText size={14} />
                View Privacy Policy
              </Link>
              <a
                href="#faq"
                style={{
                  fontSize: 13,
                  color: '#64748B',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <HelpCircle size={14} />
                Frequently Asked Questions
              </a>
            </div>
          </aside>

          {/* Right: Section Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {filteredSections.length === 0 ? (
              <div style={{
                background: '#FFFFFF',
                border: '1px dashed #CBD5E1',
                borderRadius: 10,
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748B'
              }}>
                <Search size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                  No sections matched &quot;{searchQuery}&quot;
                </h3>
                <p style={{ fontSize: 14, margin: '0 0 16px' }}>
                  Try adjusting your search query or reset the category filter.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  style={{
                    background: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '36px 36px',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                    scrollMarginTop: 150
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#F0FDFA',
                      color: '#0D9488',
                      fontWeight: 800,
                      fontSize: 13
                    }}>
                      {sec.number}
                    </span>
                    {sec.badge && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        color: '#0F766E',
                        background: '#CCFBF1',
                        padding: '3px 8px',
                        borderRadius: 4
                      }}>
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display" style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '0 0 20px',
                    lineHeight: 1.3
                  }}>
                    {sec.title}
                  </h2>

                  {/* Body Content */}
                  <div>{sec.content}</div>
                </article>
              ))
            )}

            {/* ─── Frequently Asked Questions (FAQ) Section ───────────── */}
            <section id="faq" style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '36px 36px',
              boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
              scrollMarginTop: 150
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <HelpCircle size={20} color="#0D9488" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Common Clarifications
                </span>
              </div>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 20px' }}>
                Frequently Asked Terms & Compliance Questions
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div
                      key={index}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        background: isOpen ? '#F8FAFC' : '#FFFFFF',
                        overflow: 'hidden',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 16,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                          {faq.q}
                        </span>
                        <ChevronDown
                          size={18}
                          color="#64748B"
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            flexShrink: 0
                          }}
                        />
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: '0 20px 18px',
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: '#475569',
                          borderTop: '1px solid #F1F5F9',
                          paddingTop: 12
                        }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── Contact & Support Banner ────────────────────────────── */}
            <div style={{
              background: '#0F172A',
              borderRadius: 12,
              padding: '32px 36px',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20
            }}>
              <div>
                <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF' }}>
                  Have legal or regulatory questions?
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#94A3B8', maxWidth: 480, lineHeight: 1.5 }}>
                  Our compliance desk and Grievance Officer respond within 48 business hours to all formal inquiries.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <a
                  href="mailto:legal@agrinova.market"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#0D9488',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Contact Legal Desk
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer style={{
        padding: '32px 40px',
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        fontSize: 13,
        color: '#64748B',
      }}>
        <div style={{
          maxWidth: 1160,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image
              src="/logo.png"
              alt="AgriNova Logo"
              width={26}
              height={26}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontWeight: 700, color: '#0F172A' }}>AgriNova Marketplace</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>
              Home
            </Link>
            <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>
              Terms of Service
            </Link>
            <Link href="/admin/login" style={{ color: '#64748B', textDecoration: 'none' }}>
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
