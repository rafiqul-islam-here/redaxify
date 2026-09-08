import Stripe from 'stripe';

// STRIPE_API_HOST lets local dev point the SDK at stripe-mock instead of the real Stripe API.
const host = process.env.STRIPE_API_HOST;

// `next build` imports every route module (including this one) to collect page
// data, at which point no runtime env vars are set yet. Fall back to a
// placeholder so the build doesn't crash; the real key is always set at
// container runtime via docker-compose.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_buildtime_placeholder',
  host
    ? {
        host,
        protocol: (process.env.STRIPE_API_PROTOCOL as 'http' | 'https') || 'http',
        port: process.env.STRIPE_API_PORT ? Number(process.env.STRIPE_API_PORT) : undefined,
      }
    : {}
);
