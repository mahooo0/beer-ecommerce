import { create } from 'zustand';

interface Address {
  firstName: string;
  lastName: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  cost: number;
  estimatedDays?: string;
}

interface CheckoutStore {
  step: number;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  billingSameAsShipping: boolean;
  shippingMethod: ShippingMethod | null;
  paymentIntentClientSecret: string | null;
  orderId: string | null;
  isProcessing: boolean;
  setStep: (step: number) => void;
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address | null) => void;
  setBillingSameAsShipping: (same: boolean) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  setPaymentIntent: (clientSecret: string, orderId: string) => void;
  setIsProcessing: (processing: boolean) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  shippingAddress: null,
  billingAddress: null,
  billingSameAsShipping: true,
  shippingMethod: null,
  paymentIntentClientSecret: null,
  orderId: null,
  isProcessing: false,
};

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setShippingAddress: (address) => set({ shippingAddress: address }),
  setBillingAddress: (address) => set({ billingAddress: address }),
  setBillingSameAsShipping: (same) => set({ billingSameAsShipping: same }),
  setShippingMethod: (method) => set({ shippingMethod: method }),
  setPaymentIntent: (clientSecret, orderId) =>
    set({ paymentIntentClientSecret: clientSecret, orderId }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  reset: () => set(initialState),
}));
