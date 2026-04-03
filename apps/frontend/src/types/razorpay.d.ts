export {};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name?: string;
      description?: string;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      notes?: Record<string, string>;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void;
      modal?: {
        ondismiss?: () => void;
      };
      theme?: {
        color?: string;
      };
    }) => {
      open: () => void;
    };
  }
}
