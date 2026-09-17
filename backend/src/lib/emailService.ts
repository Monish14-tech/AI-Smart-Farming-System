import nodemailer, { Transporter } from 'nodemailer';

/**
 * AgriNova Mail Automation Engine
 * Supports:
 * - Free Gmail SMTP (via App Password)
 * - Free Brevo / Sendinblue / Custom SMTP
 * - Auto-fallback Ethereal test account & Console preview for frictionless local testing
 */

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;
let isInitialized = false;
let testAccountNoticeLogged = false;

async function getTransporter(): Promise<Transporter> {
  if (transporter && isInitialized) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    GMAIL_USER,
    GMAIL_APP_PASSWORD,
  } = process.env;

  // 1. Check for standard SMTP configuration (e.g. Brevo, Mailgun, private SMTP)
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    isInitialized = true;
    console.log(`✉️  [MAIL] Configured custom SMTP transport via ${SMTP_HOST}`);
    return transporter;
  }

  // 2. Check for free Gmail SMTP with App Password
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
    isInitialized = true;
    console.log(`✉️  [MAIL] Configured Gmail SMTP transport for ${GMAIL_USER}`);
    return transporter;
  }

  // 3. Fallback: Ethereal / Local Test Transport (Completely free, no setup required)
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isInitialized = true;
    if (!testAccountNoticeLogged) {
      console.log('✉️  [MAIL] No external SMTP credentials detected. Using auto-generated Ethereal test account.');
      testAccountNoticeLogged = true;
    }
    return transporter;
  } catch (etherealErr) {
    // If ethereal network request fails, use json/console fallback transporter
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    isInitialized = true;
    return transporter;
  }
}

/**
 * Base email dispatcher with error handling
 */
export async function sendEmail({ to, subject, html, text }: MailOptions): Promise<boolean> {
  try {
    const mailer = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.GMAIL_USER || 'AgriNova Notifications <noreply@agrinova.market>';

    const info = await mailer.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📨 [MAIL SENT] To: ${to} | Subject: "${subject}"`);
      console.log(`   🔗 Ethereal Preview URL: ${previewUrl}`);
    } else {
      console.log(`📨 [MAIL SENT] To: ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
    }

    return true;
  } catch (err) {
    console.error(`❌ [MAIL ERROR] Failed to send email to ${to}:`, err);
    return false;
  }
}

// ─── STYLED TEMPLATE GENERATOR ─────────────────────────────────────────

function baseHtmlTemplate({
  headline,
  badge,
  children,
}: {
  headline: string;
  badge?: string;
  children: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); color: #FFFFFF;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Agri<span style="color: #99F6E4;">Nova</span></span>
                  </td>
                  ${
                    badge
                      ? `<td align="right"><span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${badge}</span></td>`
                      : ''
                  }
                </tr>
              </table>
              <h1 style="margin: 20px 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.25;">
                ${headline}
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px; font-size: 15px; line-height: 1.65; color: #334155;">
              ${children}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B; text-align: center; line-height: 1.5;">
              <p style="margin: 0 0 6px;">AgriNova Marketplace Technologies Private Limited</p>
              <p style="margin: 0 0 6px;">Coimbatore, Tamil Nadu, India • DPDP & IT Act Aligned</p>
              <p style="margin: 0;">This is an automated operational notification. Please do not reply directly to this message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── SPECIFIC TRANSACTIONAL EMAILS ─────────────────────────────────────

/**
 * 1. Welcome & Onboarding Email upon registration
 */
export async function sendWelcomeEmail({
  to,
  name,
  role,
}: {
  to: string;
  name: string;
  role: string;
}): Promise<void> {
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const portalName =
    role === 'farmer'
      ? 'Farmer Produce Hub'
      : role === 'buyer'
      ? 'Wholesale Buyer Marketplace'
      : 'Logistics Dispatch Network';

  const html = baseHtmlTemplate({
    headline: `Welcome to AgriNova, ${name}!`,
    badge: 'Account Verified',
    children: `
      <p>Your registration as an agricultural <strong>${roleDisplay}</strong> on the AgriNova platform was successful.</p>
      <div style="background-color: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 8px; padding: 18px; margin: 24px 0;">
        <div style="font-weight: 700; color: #0F766E; font-size: 14px; margin-bottom: 6px;">Portal Assigned: ${portalName}</div>
        <p style="margin: 0; font-size: 13px; color: #334155;">
          ${
            role === 'farmer'
              ? 'List your crop harvests with transparent grade tiers, compare real-time Agmarknet mandi benchmarks, and receive direct escrow-backed payouts.'
              : role === 'buyer'
              ? 'Source grade-inspected produce directly from verified farmers with automated escrow safety and OTP delivery validation.'
              : 'Accept regional transport routes with dynamic distance-based pricing and multi-stop pickup optimization.'
          }
        </p>
      </div>
      <p style="margin: 0 0 16px;">Complete your KYC verification in your account profile to unlock high-volume marketplace transactions.</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: #0D9488;">
            <a href="http://localhost:3000/auth/login" target="_blank" style="font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; padding: 12px 24px; display: inline-block;">
              Access Your Portal &rarr;
            </a>
          </td>
        </tr>
      </table>
    `,
  });

  await sendEmail({
    to,
    subject: `Welcome to AgriNova - ${roleDisplay} Account Activated`,
    html,
  });
}

/**
 * 2. Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail({
  to,
  name,
  otp,
}: {
  to: string;
  name?: string;
  otp: string;
}): Promise<void> {
  const html = baseHtmlTemplate({
    headline: 'Your Password Reset Code',
    badge: 'Security Verification',
    children: `
      <p>Hello ${name || 'there'},</p>
      <p>We received a request to reset the password for your AgriNova account associated with <strong>${to}</strong>.</p>
      <p>Use the following 6-digit verification code to complete your password reset:</p>

      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background-color: #F1F5F9; border: 2px dashed #0D9488; border-radius: 10px; padding: 16px 36px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0F172A;">${otp}</span>
        </div>
        <div style="font-size: 13px; color: #64748B; margin-top: 8px;">Valid for 15 minutes only</div>
      </div>

      <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 18px; margin-top: 24px; font-size: 13px; color: #92400E;">
        <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email or notify our security desk. Never share this code with anyone.
      </div>
    `,
  });

  await sendEmail({
    to,
    subject: `AgriNova Reset Code: ${otp}`,
    html,
  });
}

/**
 * 3. Delivery Confirmation OTP Email to Buyer
 * CRITICAL: Delivered exclusively to buyer when transporter accepts consignment.
 */
export async function sendDeliveryOtpEmail({
  toBuyer,
  buyerName,
  otp,
  orderId,
  cropName,
  quantityKg,
  transporterName,
}: {
  toBuyer: string;
  buyerName: string;
  otp: string;
  orderId: string;
  cropName: string;
  quantityKg: number;
  transporterName?: string;
}): Promise<void> {
  const html = baseHtmlTemplate({
    headline: 'Consignment Dispatched - Your Delivery OTP',
    badge: 'Escrow Security Code',
    children: `
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>Your produce shipment of <strong>${quantityKg}kg ${cropName}</strong> (Order #${orderId.substring(0, 8).toUpperCase()}) has been assigned to carrier <strong>${transporterName || 'AgriNova Certified Transporter'}</strong> and is en route.</p>

      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Delivery Verification Code</div>
        <div style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #0D9488; text-align: center; padding: 14px 0;">
          ${otp}
        </div>
      </div>

      <div style="background-color: #FFF1F2; border: 1px solid #FECDD3; border-radius: 8px; padding: 16px; margin: 20px 0; color: #9F1239; font-size: 13px; line-height: 1.6;">
        <strong style="display: block; margin-bottom: 4px;">⚠️ MANDATORY ESCROW PROTECTION WARNING:</strong>
        Do <strong>NOT</strong> share this 6-digit OTP over the phone or before physical arrival. 
        Only provide this code to the driver in person <strong>AFTER</strong> you have weighed and inspected the produce at your drop location. 
        Releasing this OTP instantly releases your escrow funds to the seller.
      </div>
    `,
  });

  await sendEmail({
    to: toBuyer,
    subject: `Order #${orderId.substring(0, 8).toUpperCase()} Dispatched - Delivery OTP: ${otp}`,
    html,
  });
}

/**
 * 4. Escrow Payout Released Notification
 */
export async function sendPayoutReleasedEmail({
  to,
  name,
  role,
  amount,
  orderId,
  cropName,
}: {
  to: string;
  name: string;
  role: 'farmer' | 'transporter';
  amount: number;
  orderId: string;
  cropName: string;
}): Promise<void> {
  const roleTitle = role === 'farmer' ? 'Produce Sale Settlement' : 'Freight Haulage Payout';

  const html = baseHtmlTemplate({
    headline: `Payment Released: ₹${amount.toLocaleString('en-IN')}`,
    badge: 'Escrow Settled',
    children: `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Delivery verification for Order <strong>#${orderId.substring(0, 8).toUpperCase()}</strong> (${cropName}) was completed successfully via recipient OTP verification.</p>

      <div style="background-color: #F0FDFA; border: 1px solid #99F6E4; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
        <div style="font-size: 13px; font-weight: 700; color: #0F766E; text-transform: uppercase;">${roleTitle}</div>
        <div style="font-size: 32px; font-weight: 900; color: #0F172A; margin: 8px 0;">₹${amount.toLocaleString('en-IN')}</div>
        <div style="font-size: 12px; color: #0D9488; font-weight: 600;">Disbursed directly to your registered bank account</div>
      </div>

      <p style="font-size: 13px; color: #64748B;">You can download your tax invoice and settlement ledger in your AgriNova earnings dashboard.</p>
    `,
  });

  await sendEmail({
    to,
    subject: `AgriNova Escrow Released: ₹${amount.toLocaleString('en-IN')} for Order #${orderId.substring(0, 8).toUpperCase()}`,
    html,
  });
}
