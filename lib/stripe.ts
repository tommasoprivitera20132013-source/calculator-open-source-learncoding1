import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export const PLANS = {
  free: { name: 'Free', price: 0, requests: 10 },
  pro: { name: 'Pro', price: 9.99, requests: 500, priceId: process.env.STRIPE_PRICE_PRO_ID },
  ultra: { name: 'Ultra', price: 29.99, requests: Infinity, priceId: process.env.STRIPE_PRICE_ULTRA_ID },
}
