'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const tiers = [
  {
    key: 'pdf',
    name: 'PDF eBook',
    price: '€4.99',
    period: '',
    description: 'The complete guide — read anywhere, keep forever.',
    features: ['Full nutrition & fitness guide', 'Downloadable PDF format', 'Lifetime access', 'Read offline on any device'],
    cta: 'Get the eBook',
    popular: false,
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PDF',
  },
  {
    key: 'monthly',
    name: 'Pro Monthly',
    price: '€2.99',
    period: '/mo',
    description: 'Full app access with personalised plans.',
    features: ['Personalised nutrition plans', 'Workout tracking & logging', 'Premium content library', 'Progress analytics', 'Cancel anytime'],
    cta: 'Start Pro',
    popular: false,
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY',
  },
  {
    key: 'bundle',
    name: 'Bundle',
    price: '€9.99',
    period: '',
    badge: 'BEST VALUE',
    description: 'PDF eBook + 3 months Pro access. Worth €12.96.',
    features: ['Everything in PDF eBook', 'Everything in Pro', '3 months full app access', 'Continues at €2.99/mo after', 'Cancel anytime — keep the PDF'],
    cta: 'Get the Bundle',
    popular: true,
    savings: 'Save €2.97',
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_BUNDLE',
  },
  {
    key: 'annual',
    name: 'Pro Annual',
    price: '€24.99',
    period: '/yr',
    description: 'Best price for long-term commitment.',
    features: ['Everything in Pro Monthly', 'Save 30% vs monthly', 'Exclusive premium content', 'Early access to new features'],
    cta: 'Go Annual',
    popular: false,
    savings: 'Save €10.89/yr',
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL',
  },
];

const priceIds: Record<string, string> = {
  NEXT_PUBLIC_STRIPE_PRICE_PDF: process.env.NEXT_PUBLIC_STRIPE_PRICE_PDF || '',
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || '',
  NEXT_PUBLIC_STRIPE_PRICE_BUNDLE: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE || '',
};

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  const handleCheckout = async (tier: typeof tiers[0]) => {
    setLoading(tier.key);
    try {
      const priceId = priceIds[tier.priceEnv];
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#08111f', color: 'white', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '12px', letterSpacing: '3px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>O'Neill Labs</p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px', background: 'linear-gradient(90deg, #41d98a, #4a9eff, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Upgrade Your Body
          </h1>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>Choose the plan that fits your journey. No hidden fees, cancel anytime.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {tiers.map((tier) => (
            <div
              key={tier.key}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                padding: '1.5rem',
                background: tier.popular ? 'rgba(65, 217, 138, 0.06)' : 'rgba(255,255,255,0.03)',
                border: tier.popular ? '2px solid rgba(65, 217, 138, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {tier.badge && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#41d98a', color: '#08111f', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px' }}>
                  {tier.badge}
                </div>
              )}

              <p style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '10px' }}>{tier.name}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: tier.popular ? '#41d98a' : '#fff' }}>{tier.price}</span>
                {tier.period && <span style={{ fontSize: '14px', color: '#666' }}>{tier.period}</span>}
              </div>

              {tier.savings && (
                <span style={{ display: 'inline-block', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', marginBottom: '8px', width: 'fit-content', background: 'rgba(65, 217, 138, 0.15)', color: '#41d98a' }}>
                  {tier.savings}
                </span>
              )}

              <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.25rem', lineHeight: 1.4 }}>{tier.description}</p>

              <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                {tier.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#ccc', padding: '4px 0' }}>
                    <span style={{ color: '#41d98a', flexShrink: 0, marginTop: '2px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier)}
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: tier.popular ? '#41d98a' : 'transparent',
                  color: tier.popular ? '#08111f' : '#41d98a',
                  outline: tier.popular ? 'none' : '1px solid rgba(65, 217, 138, 0.3)',
                  opacity: loading && loading !== tier.key ? 0.5 : 1,
                }}
              >
                {loading === tier.key ? 'Processing...' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Also available: <strong>Kindle</strong> (€2.99) and <strong>Physical Book</strong> (€9.99) on Amazon.
          </p>
          <p style={{ fontSize: '12px', color: '#444', marginTop: '6px' }}>All prices in EUR. Secure payments powered by Stripe.</p>
        </div>
      </div>
    </div>
  );
}
