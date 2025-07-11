import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/router';
import { useEvents } from '../services/useEvents';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PaymentForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-test?success=true`,
      },
    });

    if (submitError) {
      setError(submitError.message ?? 'An unexpected error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <PaymentElement />
      {error && <div className="text-red-500 mt-4">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const PaymentTest = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { events, loading, error: eventsError } = useEvents();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();
  const { success } = router.query;

  useEffect(() => {
    if (success === 'true') {
      alert('Payment successful!');
    }
  }, [success]);

  const handleCreatePaymentIntent = async () => {
    if (!selectedEvent) {
      setPaymentError('Please select an event');
      return;
    }

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              eventId: selectedEvent,
              quantity: quantity
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return <div className="text-center mt-8">Loading events...</div>;
  if (eventsError) return <div className="text-center mt-8 text-red-500">Error loading events: {eventsError}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Payment Test Page</h1>
      
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select an event...</option>
            {events?.map((event) => (
              <option key={event.uuid} value={event.uuid}>
                {event.name} - ${event.metadata?.price || '0'}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        {paymentError && (
          <div className="text-red-500 mb-4">{paymentError}</div>
        )}

        {!clientSecret ? (
          <button
            onClick={handleCreatePaymentIntent}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Create Payment Intent
          </button>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm clientSecret={clientSecret} />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default PaymentTest; 