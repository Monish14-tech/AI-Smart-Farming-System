import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Privacy Policy - AgriNova',
  description: 'Privacy Policy and Data Protection guidelines for AgriNova marketplace participants.',
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
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
          <span className="font-display" style={{ fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
            Agri<span style={{ color: '#0D9488' }}>Nova</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/terms" style={{ color: '#64748B', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Terms of Service</Link>
          <Link href="/auth/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, borderRadius: 6 }}>Sign In</Link>
        </div>
      </nav>

      {/* Content Container */}
      <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 24px 80px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '40px 48px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: 0.8 }}>Legal Documentation</span>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 16px', color: '#0F172A' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 32, borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
            Effective Date: January 1, 2026 | Last Updated: March 15, 2026
          </p>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>1. Introduction</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              AgriNova (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;) operates an agricultural trading and logistics marketplace connecting farmers, commercial produce buyers, and third-party transporters across India. This Privacy Policy details how we collect, process, store, and safeguard personal and operational data in compliance with the Digital Personal Data Protection Act (DPDP Act) 2023 and applicable Indian telecommunication and electronic commerce regulations.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>2. Information We Collect</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', marginBottom: 10 }}>
              We collect information strictly necessary to facilitate marketplace transactions, regulatory compliance, and freight coordination:
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', paddingLeft: 20 }}>
              <li><strong>Account Credentials:</strong> Full legal name, mobile phone number, email address, and authentication credentials.</li>
              <li><strong>KYC and Business Verification:</strong> Government-issued identification (Aadhaar or PAN verification metadata), GSTIN for commercial buyers, land parcel location records for verified farm produce lots.</li>
              <li><strong>Produce Lot Specifications:</strong> Crop commodity classification, quantity (kg), harvested date, warehouse or farm gate pickup address, quality tier documentation, and pricing terms.</li>
              <li><strong>Logistics and Telemetry:</strong> Vehicle registration details, transporter driver contact information, pickup and drop waypoint coordinates, transit route telematics during active dispatch, and timestamped OTP delivery confirmations.</li>
              <li><strong>Payment and Transaction Records:</strong> Escrow payment authorization reference codes, settlement bank account numbers, IFSC codes, and platform invoice ledgers.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>3. How We Use Collected Data</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', paddingLeft: 20 }}>
              <li>To match buyer purchase orders with verified agricultural harvest lots.</li>
              <li>To compute algorithmic vehicle routing (VRP) for grouped pickup and drop transport logistics.</li>
              <li>To execute escrow payouts upon confirmed buyer delivery verification.</li>
              <li>To prevent fraudulent listings, price manipulation, and unverified broker impersonation.</li>
              <li>To aggregate historical mandi commodity prices to generate objective market intelligence.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>4. Data Sharing and Third-Party Disclosures</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              We do not sell participant personal information to third-party advertisers. Information is disclosed solely in the following operational circumstances: (a) between matched trading counterparties (farmer pickup address disclosed to the assigned transporter and buyer for bill of lading documentation); (b) to licensed escrow and banking gateways for financial settlement; and (c) to law enforcement or statutory agricultural boards when mandated by statutory subpoena or court order.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>5. Data Security and Retention</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              All database connections utilize encrypted TLS 1.3 transport. Sensitive credentials and settlement vectors are stored in PostgreSQL with strict role-based access control. Transaction ledgers and tax records are retained for the statutory period required under Indian financial bookkeeping standards, after which archival data is purged or irreversibly anonymized.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>6. Participant Rights and Grievance Officer</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', marginBottom: 12 }}>
              Under the DPDP Act 2023, registered participants hold rights of data access, correction, and consent withdrawal. To exercise these rights or lodge a complaint regarding data processing, contact our designated Grievance Officer:
            </p>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '14px 18px', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
              <div><strong>Grievance Officer:</strong> Legal and Compliance Operations, AgriNova</div>
              <div><strong>Email:</strong> privacy@agrinova.market</div>
              <div><strong>Jurisdiction:</strong> Coimbatore, Tamil Nadu, India</div>
            </div>
          </section>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#64748B' }}>
            <Link href="/" style={{ color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>Return to Home</Link>
            <Link href="/terms" style={{ color: '#64748B', textDecoration: 'none' }}>View Terms of Service</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
