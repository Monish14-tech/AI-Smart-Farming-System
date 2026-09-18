import { api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Dynamically loads the Razorpay Standard Web Checkout script into the DOM.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script element is already injected
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export interface RazorpayPaymentOptions {
  amountPaise: number;
  orderId?: string;
  cropName?: string;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess: (verificationResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    order?: any;
  }) => void;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

/**
 * Initiates Razorpay Standard Checkout:
 * 1. Loads checkout.js
 * 2. Calls backend POST /api/create-order to create an authentic Razorpay order
 * 3. Opens the Razorpay payment modal
 * 4. Verifies HMAC signature on backend POST /api/verify-payment upon completion
 */
export async function initiateRazorpayPayment({
  amountPaise,
  orderId,
  cropName,
  description,
  customer,
  onSuccess,
  onError,
  onDismiss,
}: RazorpayPaymentOptions): Promise<void> {
  try {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      const err = 'Could not load Razorpay payment SDK. Please check your internet connection.';
      toast.error(err);
      onError?.(err);
      return;
    }

    // 1. Create order on backend
    const { data: orderData } = await api.post('/create-order', {
      amount: amountPaise,
      currency: 'INR',
      orderId,
      receipt: orderId ? `rcpt_${orderId.slice(0, 10)}` : `rcpt_${Date.now()}`,
      notes: {
        cropName: cropName || 'Agricultural Produce',
        description: description || 'AgriNova Escrow Market Order',
      },
    });

    if (!orderData?.order_id) {
      throw new Error(orderData?.error || 'Invalid order creation response from payment server');
    }

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      orderData.key_id;

    if (!keyId) {
      throw new Error('Razorpay Key ID is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID or configure backend.');
    }

    // 2. Configure Razorpay Standard Checkout Modal
    const rzpOptions = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'AgriNova Market',
      description: description || (cropName ? `Purchase of ${cropName}` : 'AgriNova Escrow Funding'),
      image: '/icon.svg',
      order_id: orderData.order_id,
      prefill: {
        name: customer?.name || '',
        email: customer?.email || '',
        contact: customer?.phone || '',
      },
      notes: {
        platformOrderId: orderId || '',
        purpose: 'Regulated Agri-Escrow Funding',
      },
      theme: {
        color: '#16A34A', // AgriNova green brand color
      },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled', { icon: 'ℹ️' });
          onDismiss?.();
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          // 3. Verify cryptographic signature on backend
          const verifyRes = await api.post('/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });

          if (verifyRes.data?.success) {
            toast.success('Payment verified successfully! Funds secured in Escrow. 🎉');
            onSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order: verifyRes.data.order,
            });
          } else {
            const failMsg = verifyRes.data?.error || 'Payment signature verification failed';
            toast.error(failMsg);
            onError?.(failMsg);
          }
        } catch (vErr: any) {
          const vMsg = vErr?.response?.data?.error || 'Error validating payment with server';
          toast.error(vMsg);
          onError?.(vMsg);
        }
      },
    };

    const rzp = new window.Razorpay(rzpOptions);

    // Error event listener
    rzp.on('payment.failed', (failResponse: any) => {
      console.error('[RAZORPAY_FAILED]', failResponse);
      const failReason = failResponse?.error?.description || 'Transaction failed or was declined';
      toast.error(`Payment Failed: ${failReason}`);
      onError?.(failReason);
    });

    rzp.open();
  } catch (err: any) {
    console.error('[RAZORPAY_INIT_ERROR]', err);
    const msg = err?.response?.data?.error || err.message || 'Failed to initiate payment gateway';
    toast.error(msg);
    onError?.(msg);
  }
}
