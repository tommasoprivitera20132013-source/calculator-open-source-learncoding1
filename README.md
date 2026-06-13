# AURA — The most powerful AI in the world

A premium full-stack AI-powered SaaS platform — creative studio + study tool + productivity app.

## Features

**Creative Tools**
- AURA Brain — Real-time AI chat (Claude)
- AURA Vision — Image generation (FLUX / SD XL via Replicate)
- AURA Music — Music generation (MusicGen via Replicate)
- AURA Write — Text generation (essays, lyrics, scripts, emails)
- AURA Code — Code assistant (generate, explain, fix, optimize)
- AURA Video — Video generation (Ultra plan only)

**Study Tools**
- AURA Notebook — AI-powered rich text editor
- AURA Flashcards — AI-generated flashcards with spaced repetition
- AURA Quiz — AI-generated quizzes with score tracking
- AURA Mind Map — Interactive AI mind maps
- AURA PDF Chat — Chat with your documents
- AURA Explain — Explain any concept at 3 levels

**Productivity**
- AURA Tasks — Kanban board with AI task generation
- AURA Translate — 30+ languages with tone control

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth & DB**: Supabase
- **Payments**: Stripe
- **AI**: Anthropic Claude API
- **Media**: Replicate (images, music, video)
- **Animations**: Framer Motion
- **State**: Zustand

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all variables in `.env.local`:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `REPLICATE_API_TOKEN` | Replicate API token |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PRICE_PRO_ID` | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ULTRA_ID` | Stripe price ID for Ultra plan |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. https://yourapp.com) |

### 3. Supabase setup

1. Create a new Supabase project
2. Run `supabase-schema.sql` in the SQL editor
3. Enable Google OAuth in Authentication → Providers
4. Set redirect URL to `https://yourapp.com/auth/callback`

### 4. Stripe setup

1. Create two subscription products in Stripe:
   - Pro: €9.99/month
   - Ultra: €29.99/month
2. Add price IDs to `.env.local`
3. Set up webhook pointing to `/api/stripe/webhook`
4. Listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Run

```bash
npm run dev
```

## Subscription Plans

| Plan | Price | Requests/day | Models |
|---|---|---|---|
| Free | €0 | 10 | Claude Haiku, SD XL |
| Pro | €9.99/mo | 500 | Claude Sonnet, FLUX 1.1 |
| Ultra | €29.99/mo | ∞ | Claude Opus 4, FLUX 1.1 Pro |

## Deploy on Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables
4. Deploy

