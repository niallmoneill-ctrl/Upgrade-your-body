'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const mainTiers = [
  {
    key: 'free',
    name: 'Free',
    price: '€0',
    period: '',
    badge: 'EARLY ACCESS',
    description: 'Full access while we\'re in early access. No card required.',
    features: ['Personalised nutrition plans', 'Workout tracking & logging', 'Weekly review & analytics', 'Reminders & notifications', 'All features unlocked'],
    cta: 'Get started free',
    popular: false,
    accent: 'blue' as const,
    type: 'free' as const,
  },
  {
    key: 'pdf',
    name: 'PDF eBook',
    price: '€4.99',
    period: '',
    description: 'The complete guide — read anywhere, keep forever.',
    features: ['Full nutrition & fitness guide', 'Downloadable PDF format', 'Lifetime access', 'Read offline on any device'],
    cta: 'Get the eBook',
    popular: false,
    accent: 'default' as const,
    type: 'stripe' as const,
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PDF',
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
    accent: 'green' as const,
    type: 'stripe' as const,
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_BUNDLE',
  },
  {
    key: 'support',
    name: 'Support Us',
    price: 'Name your price',
    period: '',
    description: 'Love the app? Pay what you can to support development.',
    features: ['Support indie development', 'Same full access as free', 'Good karma included', 'Help us build more features'],
    cta: 'Support the project',
    popular: false,
    accent: 'default' as const,
    type: 'custom' as const,
  },
];

const subTiers = [
  {
    key: 'monthly',
    name: 'Pro Monthly',
    price: '€2.99',
    period: '/mo',
    description: 'Full app access with personalised plans. Cancel anytime.',
    features: ['Personalised nutrition plans', 'Workout tracking & logging', 'Premium content library', 'Progress analytics'],
    cta: 'Start Pro Monthly',
    popular: false,
    type: 'stripe' as const,
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY',
  },
  {
    key: 'annual',
    name: 'Pro Annual',
    price: '€24.99',
    period: '/yr',
    description: 'Best price for long-term commitment. Save 30% vs monthly.',
    features: ['Everything in Pro Monthly', 'Save 30% vs monthly', 'Exclusive premium content', 'Early access to new features'],
    cta: 'Go Annual',
    popular: false,
    savings: 'Save €10.89/yr',
    type: 'stripe' as const,
    priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL',
  },
];

const priceIds: Record<string, string> = {
  NEXT_PUBLIC_STRIPE_PRICE_PDF: process.env.NEXT_PUBLIC_STRIPE_PRICE_PDF || '',
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || '',
  NEXT_PUBLIC_STRIPE_PRICE_BUNDLE: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE || '',
};

const SUGGESTED_AMOUNTS = [2, 5, 10, 20];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(5);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const handleStripeCheckout = async (priceEnv: string) => {
    const priceId = priceIds[priceEnv];
    const headers = await getAuthHeaders();
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const handleCustomCheckout = async (amount: number) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ customAmount: Math.round(amount * 100) }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const handleClick = async (tier: { key: string; type: string; priceEnv?: string }) => {
    if (tier.type === 'free') {
      window.location.href = '/signup';
      return;
    }
    if (tier.type === 'custom') {
      if (customAmount < 1) return;
      setLoading(tier.key);
      try {
        await handleCustomCheckout(customAmount);
      } catch (err) {
        console.error('Checkout error:', err);
      } finally {
        setLoading(null);
      }
      return;
    }
    if (tier.type === 'stripe' && tier.priceEnv) {
      setLoading(tier.key);
      try {
        await handleStripeCheckout(tier.priceEnv);
      } catch (err) {
        console.error('Checkout error:', err);
      } finally {
        setLoading(null);
      }
    }
  };

  const accentColor = (accent?: string) => {
    if (accent === 'blue') return '#4a9eff';
    if (accent === 'green') return '#41d98a';
    return '#41d98a';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#08111f', color: 'white', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <a href="/" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>← Home</a>
          {' · '}
          <a href="/login" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>Log in</a>
          {' · '}
          <a href="/signup" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>Sign up</a>
          {' · '}
          <a href="https://oneill-labs.com/upgradeyourbody/" target="_blank" rel="noopener" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>Blog &amp; Guides ↗</a>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '12px', letterSpacing: '3px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>O&apos;Neill Labs</p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px', background: 'linear-gradient(90deg, #41d98a, #4a9eff, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Upgrade Your Body
          </h1>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>Full access is free during early access. Pay what you can to support development.</p>
        </div>

        {/* Main 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {mainTiers.map((tier) => {
            const color = accentColor(tier.accent);
            const isPopular = tier.popular;
            const isBlue = tier.accent === 'blue';

            return (
              <div
                key={tier.key}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  background: isPopular ? 'rgba(65, 217, 138, 0.06)' : isBlue ? 'rgba(74, 158, 255, 0.06)' : 'rgba(255,255,255,0.03)',
                  border: isPopular ? '2px solid rgba(65, 217, 138, 0.4)' : isBlue ? '2px solid rgba(74, 158, 255, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {tier.badge && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: isBlue ? '#4a9eff' : '#41d98a',
                    color: '#08111f', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px',
                  }}>
                    {tier.badge}
                  </div>
                )}

                <p style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '10px' }}>{tier.name}</p>

                {tier.type === 'custom' ? (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>€{customAmount}</span>
                      <span style={{ fontSize: '14px', color: '#666' }}>one-time</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
                      {SUGGESTED_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => { setCustomAmount(amt); setShowCustomInput(false); }}
                          style={{
                            flex: 1, padding: '8px 0', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none',
                            background: customAmount === amt && !showCustomInput ? 'rgba(65, 217, 138, 0.2)' : 'rgba(255,255,255,0.06)',
                            color: customAmount === amt && !showCustomInput ? '#41d98a' : '#888',
                            outline: customAmount === amt && !showCustomInput ? '1px solid rgba(65, 217, 138, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          €{amt}
                        </button>
                      ))}
                    </div>
                    {!showCustomInput ? (
                      <button
                        onClick={() => setShowCustomInput(true)}
                        style={{ fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                      >
                        Or enter a custom amount →
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ color: '#666', fontSize: '14px' }}>€</span>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(Math.max(1, Number(e.target.value)))}
                          style={{
                            width: '80px', padding: '8px 12px', borderRadius: '8px', fontSize: '16px', fontWeight: 600,
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: isBlue ? '#4a9eff' : isPopular ? '#41d98a' : '#fff' }}>{tier.price}</span>
                    {tier.period && <span style={{ fontSize: '14px', color: '#666' }}>{tier.period}</span>}
                  </div>
                )}

                {'savings' in tier && tier.savings && (
                  <span style={{ display: 'inline-block', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', marginBottom: '8px', width: 'fit-content', background: 'rgba(65, 217, 138, 0.15)', color: '#41d98a' }}>
                    {tier.savings}
                  </span>
                )}

                <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.25rem', lineHeight: 1.4 }}>{tier.description}</p>

                <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#ccc', padding: '4px 0' }}>
                      <span style={{ color, flexShrink: 0, marginTop: '2px' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleClick(tier)}
                  disabled={loading !== null}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: isBlue ? '#4a9eff' : isPopular ? '#41d98a' : 'transparent',
                    color: isBlue ? '#fff' : isPopular ? '#08111f' : '#41d98a',
                    outline: (!isBlue && !isPopular) ? '1px solid rgba(65, 217, 138, 0.3)' : 'none',
                    opacity: loading && loading !== tier.key ? 0.5 : 1,
                  }}
                >
                  {loading === tier.key ? 'Processing...' : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Subscription plans heading */}
        <div style={{ textAlign: 'center', margin: '3rem 0 1.5rem' }}>
          <p style={{ fontSize: '12px', letterSpacing: '3px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>Subscription plans</p>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>For ongoing access after early access ends.</p>
        </div>

        {/* 2 subscription cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', maxWidth: '700px', margin: '0 auto' }}>
          {subTiers.map((tier) => (
            <div
              key={tier.key}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '10px' }}>{tier.name}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{tier.price}</span>
                <span style={{ fontSize: '14px', color: '#666' }}>{tier.period}</span>
              </div>

              {'savings' in tier && tier.savings && (
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
                onClick={() => handleClick(tier)}
                disabled={loading !== null}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: 'transparent', color: '#41d98a', outline: '1px solid rgba(65, 217, 138, 0.3)',
                  opacity: loading && loading !== tier.key ? 0.5 : 1,
                }}
              >
                {loading === tier.key ? 'Processing...' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Amazon note */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Also available: <strong>Kindle</strong> (€2.99) and <strong>Physical Book</strong> (€9.99) on Amazon.
          </p>
          <p style={{ fontSize: '12px', color: '#444', marginTop: '6px' }}>All prices in EUR. Secure payments powered by Stripe.</p>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
            <a href="https://oneill-labs.com/upgradeyourbody/" target="_blank" rel="noopener" style={{ color: '#666', textDecoration: 'none' }}>Blog &amp; Guides</a>
            <a href="https://oneill-labs.com" target="_blank" rel="noopener" style={{ color: '#666', textDecoration: 'none' }}>O&apos;Neill Labs</a>
            <a href="/" style={{ color: '#666', textDecoration: 'none' }}>Home</a>
          </div>
          <p style={{ fontSize: '11px', color: '#444', marginTop: '12px' }}>© {new Date().getFullYear()} O&apos;Neill Labs. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
