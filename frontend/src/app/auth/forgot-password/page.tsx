'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message || 'Reset code sent to your email');
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      setStep('reset');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to request reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword,
      });
      toast.success(data.message || 'Password reset successfully!');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1200);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--color-bg)' }}>
      <div className="glass" style={{ width: '100%', maxWidth: 440, padding: 36, borderRadius: 20 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/icon.svg" alt="AgriNova" width={34} height={34} style={{ borderRadius: 8 }} />
            <span className="font-display" style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)' }}>AgriNova</span>
          </Link>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 4 }}>
            {step === 'request' ? 'Reset Your Password' : 'Enter Verification Code'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
            {step === 'request'
              ? 'Enter your registered email and we will issue a secure 6-digit recovery code.'
              : `A 6-digit code was sent to ${email}`}
          </p>
        </div>

        {/* Development Helper OTP Badge */}
        {devOtpHint && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#92400E' }}>
            <strong>Demo / Dev OTP:</strong> Use code <code style={{ fontWeight: 800, fontSize: 15, background: '#FDE68A', padding: '2px 6px', borderRadius: 4 }}>{devOtpHint}</code> to proceed.
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                Registered Email Address
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="e.g. farmer@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending Verification Code...' : 'Send Recovery Code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                6-Digit Reset Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                className="input-field"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ fontSize: 18, letterSpacing: '0.2em', textAlign: 'center', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Updating Password...' : '🔒 Reset Password & Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setStep('request')}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                ← Back to enter different email
              </button>
            </div>
          </form>
        )}

        <hr className="divider" style={{ margin: '24px 0' }} />

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          Remembered your password?{' '}
          <Link href="/auth/login" style={{ color: 'var(--color-leaf)', fontWeight: 600, textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
