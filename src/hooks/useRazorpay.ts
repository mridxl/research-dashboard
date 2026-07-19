import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import { createPaymentOrder, verifyPayment } from '@/lib/api/billing';
import { getClinicInfo } from '@/lib/api/dashboard';

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

// Load Razorpay SDK script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise(resolve => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = useCallback(async (invoiceId: string, onSuccess?: () => void) => {
    setIsLoading(true);

    try {
      // Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create payment order
      const orderResponse = await createPaymentOrder(invoiceId);

      // Get clinic info for prefill
      let clinicName = 'Aignosis User';
      try {
        const clinicInfo = await getClinicInfo();
        clinicName = clinicInfo.clinic_name || clinicName;
      } catch {
        // Ignore error, use default
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'Aignosis',
        description: `Invoice Payment - ${invoiceId}`,
        order_id: orderResponse.order_id,
        prefill: {
          name: clinicName,
        },
        theme: {
          color: '#6366f1', // Indigo color to match the app theme
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment on server
            const verifyResponse = await verifyPayment(
              invoiceId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );

            toast.success('Payment successful!', {
              description: `Payment of ₹${verifyResponse.amount_paid.toLocaleString('en-IN')} has been processed.`,
            });

            onSuccess?.();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed', {
              description: 'Please contact support if amount was deducted.',
            });
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast.error('Failed to initiate payment', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
      setIsLoading(false);
    }
  }, []);

  return {
    initiatePayment,
    isLoading,
  };
};
