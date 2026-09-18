'use client';

import { useState } from 'react';
import { initiateRazorpayPayment } from '@/lib/razorpay';
import { useAuth } from '@/contexts/AuthContext';

interface RazorpayPayButtonProps {
  amountRupees: number;
  orderId?: string;
  cropName?: string;
  description?: string;
  buttonText?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (err: string) => void;
}

export default function RazorpayPayButton({
  amountRupees,
  orderId,
  cropName,
  description,
  buttonText,
  className = 'btn-primary',
  style,
  disabled = false,
  onSuccess,
  onError,
}: RazorpayPayButtonProps) {
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (paying || disabled) return;
    setPaying(true);

    const amountPaise = Math.round(amountRupees * 100);

    await initiateRazorpayPayment({
      amountPaise,
      orderId,
      cropName,
      description,
      customer: {
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
      },
      onSuccess: (data) => {
        setPaying(false);
        onSuccess?.(data);
      },
      onError: (err) => {
        setPaying(false);
        onError?.(err);
      },
      onDismiss: () => {
        setPaying(false);
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={disabled || paying}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled || paying ? 'not-allowed' : 'pointer',
        opacity: disabled || paying ? 0.7 : 1,
        ...style,
      }}
    >
      <span style={{ fontSize: 16 }}>💳</span>
      {paying ? 'Opening Checkout...' : buttonText || `Pay ₹${amountRupees.toLocaleString('en-IN')}`}
    </button>
  );
}
