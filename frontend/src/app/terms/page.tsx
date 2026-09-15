import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Terms of Service - AgriNova',
  description: 'Terms and Conditions governing access and transactions on the AgriNova agricultural trading marketplace.',
};

export default function TermsAndConditionsPage() {
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
          <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Privacy Policy</Link>
          <Link href="/auth/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, borderRadius: 6 }}>Sign In</Link>
        </div>
      </nav>

      {/* Content Container */}
      <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 24px 80px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '40px 48px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: 0.8 }}>Legal Documentation</span>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 16px', color: '#0F172A' }}>
            Terms of Service
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 32, borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
            Effective Date: January 1, 2026 | Last Updated: March 15, 2026
          </p>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>1. Agreement to Terms</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Participant,&quot; &quot;User,&quot; whether registered as a Farmer, Buyer, or Transporter) and AgriNova Marketplace Technologies (&quot;AgriNova,&quot; &quot;the Platform&quot;). By accessing the Platform or submitting any order, listing, or logistics acceptance, you agree to comply with all provisions herein.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>2. Role-Based Participant Obligations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              <div>
                <strong>A. Farmers (Producers):</strong> Farmers warrant that produce lots listed on the marketplace are accurate with respect to commodity type, quantity (kg), harvest date, and quality classification (Grade A, B, or C). Farmers agree to prepare and bag produce lots for scheduled carrier pickup.
              </div>
              <div>
                <strong>B. Buyers (Wholesale and Commercial):</strong> Buyers agree to fund purchase orders in full upon order confirmation. Purchase amounts are held securely in platform escrow until verified delivery completion. Buyers must inspect produce upon arrival and provide the six-digit delivery verification OTP only upon satisfactory inspection.
              </div>
              <div>
                <strong>C. Transporters (Carriers):</strong> Transporters accept dispatch routes through the platform and agree to transport agricultural lots safely, maintain vehicle roadworthiness, adhere to optimal routing checkpoints, and secure recipient OTP verification at the drop location.
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>3. Escrow Settlement and Payout Releases</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              To protect all counterparties from settlement default, all marketplace transactions are executed through an automated escrow mechanism. Funds are held in an escrow settlement account upon order placement. Once the recipient buyer verifies delivery through the platform OTP gateway, funds are immediately credited: the net produce value is disbursed to the farmer and the freight fee is credited to the transporter, minus applicable platform infrastructure fees.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>4. Quality Standards and Dispute Resolution</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              In the event that delivered produce materially differs from the listed quality grade or suffers transit damage, the buyer must raise a formal dispute prior to providing the delivery confirmation OTP. AgriNova operations will review listing photo records, transit telemetry, and on-site delivery documentation to issue a binding determination, which may include partial refunds, return dispatch, or forfeiture of transporter freight fees for gross negligence.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>5. Platform Role and Limitation of Liability</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              AgriNova operates as a digital technology intermediary enabling direct peer-to-peer commerce and freight coordination. While AgriNova provides market price benchmarks and route optimization algorithms, AgriNova is not a party to the underlying physical purchase contracts and disclaims liability for natural crop spoilage, act-of-God transit delays, or unnotified agricultural defects.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0F172A' }}>6. Governing Law and Jurisdiction</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155' }}>
              These Terms shall be governed by and construed in accordance with the substantive laws of the Republic of India. Any disputes arising out of or related to platform operations shall be subject to the exclusive jurisdiction of the commercial courts located in Coimbatore, Tamil Nadu, India.
            </p>
          </section>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#64748B' }}>
            <Link href="/" style={{ color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>Return to Home</Link>
            <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>View Privacy Policy</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
