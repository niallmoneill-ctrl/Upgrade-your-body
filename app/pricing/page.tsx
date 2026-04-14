'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const KINDLE_URL = 'https://www.amazon.com/dp/B0GFNCP23T';
const PHYSICAL_BOOK_URL = 'https://www.amazon.com/dp/B0GFNCP23T';

const mainTiers = [
  {
    key: 'free',
    name: 'Free',
    price: '€0',
    period: '',
    badge: 'EARLY ACCESS',
    description: "Full access while we're in early access. No card required.",
    features: ['Nutrition plans', 'Custom Habit Tracking', 'Workout tracking & logging', 'Weekly review & analytics', 'Reminders & notifications', 'All features unlocked'],
    cta: 'Get started free',
    accent: 'blue' as const,
    type: 'free' as const,
  },
  {
    key: 'support',
    name: 'Support Us',
    price: '€2',
    period: '',
    description: 'Love the app? Pay what you can to support development.',
    features: ['Support indie development', 'Same full access as free', 'Good karma included', 'Help us build more features'],
    cta: 'Support the project',
    accent: 'gold' as const,
    type: 'custom' as const,
  },
  {
    key: 'pdf',
    name: 'PDF eBook',
    price: '€4.99',
    period: '',
    description: 'The complete guide — read anywhere, keep forever.',
    features: ['Full nutrition & fitness guide', 'Downloadable PDF format', 'Lifetime access', 'Read offline on any device'],
    cta: 'Get the eBook',
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
];

const subTiers = [
  {
    key: 'monthly',
    name: 'Pro Monthly',
    price: '€2.99',
    period: '/mo',
    description: 'Full app access with personalised plans. Cancel anytime.',
    features: ['Nutrition plans', 'Custom Habit Tracking', 'Workout tracking & logging','Content library', 'Progress analytics'],
    cta: 'Start Pro Monthly',
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

const S = {
  bg: '#0a0f1a',
  card: 'rgba(255,255,255,0.025)',
  cardBorder: 'rgba(255,255,255,0.07)',
  cardGreen: 'rgba(65,217,138,0.05)',
  cardGreenBorder: 'rgba(65,217,138,0.35)',
  cardBlue: 'rgba(74,158,255,0.05)',
  cardBlueBorder: 'rgba(74,158,255,0.25)',
  cardGold: 'rgba(245,166,35,0.06)',
  cardGoldBorder: 'rgba(245,166,35,0.3)',
  green: '#41d98a',
  blue: '#4a9eff',
  gold: '#f5a623',
  muted: '#6b7280',
  text: '#d1d5db',
  white: '#f3f4f6',
  gradient: 'linear-gradient(135deg, #41d98a, #4a9eff)',
  gradientFull: 'linear-gradient(90deg, #41d98a, #4a9eff, #f5a623)',
  radius: '14px',
  radiusSm: '10px',
};

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(5);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers['Authorization'] = 'Bearer ' + session.access_token;
    return headers;
  };

  const handleStripeCheckout = async (priceEnv: string) => {
    const priceId = priceIds[priceEnv];
    const headers = await getAuthHeaders();
    const res = await fetch('/api/checkout', { method: 'POST', headers, body: JSON.stringify({ priceId }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleCustomCheckout = async (amount: number) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/checkout', { method: 'POST', headers, body: JSON.stringify({ customAmount: Math.round(amount * 100) }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleClick = async (tier: { key: string; type: string; priceEnv?: string }) => {
    if (tier.type === 'free') { window.location.href = '/signup'; return; }
    if (tier.type === 'custom') {
      if (customAmount < 1) return;
      setLoading(tier.key);
      try { await handleCustomCheckout(customAmount); } catch (err) { console.error(err); } finally { setLoading(null); }
      return;
    }
    if (tier.type === 'stripe' && tier.priceEnv) {
      setLoading(tier.key);
      try { await handleStripeCheckout(tier.priceEnv); } catch (err) { console.error(err); } finally { setLoading(null); }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: S.bg, color: S.white, padding: '3.5rem 1rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Nav */}
        <div style={{ marginBottom: '1.5rem', fontSize: '13px' }}>
          <a href="/" style={{ color: S.muted, textDecoration: 'none' }}>← Home</a>
          <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 10px' }}>/</span>
          <a href="/login" style={{ color: S.muted, textDecoration: 'none' }}>Log in</a>
          <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 10px' }}>/</span>
          <a href="/signup" style={{ color: S.muted, textDecoration: 'none' }}>Sign up</a>
          <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 10px' }}>/</span>
          <a href="https://oneill-labs.com/upgradeyourbody/" target="_blank" rel="noopener" style={{ color: S.muted, textDecoration: 'none' }}>Blog ↗</a>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '11px', letterSpacing: '4px', color: S.muted, textTransform: 'uppercase', marginBottom: '12px' }}>Book · App · YouTube</p>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 700, marginBottom: '12px', background: S.gradientFull, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Upgrade Your Body</h1>
          <p style={{ color: S.muted, fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>Full access is free during early access. Pay what you can to support development.</p>
        </div>

        {/* Main 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '1rem' }}>
          {mainTiers.map((tier) => {
            const isBlue = tier.accent === 'blue';
            const isGold = tier.accent === 'gold';
            const isGreen = tier.accent === 'green';
            const accentCol = isBlue ? S.blue : isGold ? S.gold : S.green;
            const bg = isGreen ? S.cardGreen : isBlue ? S.cardBlue : isGold ? S.cardGold : S.card;
            const border = isGreen ? S.cardGreenBorder : isBlue ? S.cardBlueBorder : isGold ? S.cardGoldBorder : S.cardBorder;
            const borderWidth = (isGreen || isBlue || isGold) ? '2px' : '1px';

            return (
              <div key={tier.key} style={{ position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: S.radius, padding: '1.5rem', background: bg, border: `${borderWidth} solid ${border}` }}>

                {tier.badge && (
                  <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: isBlue ? S.blue : isGold ? S.gold : S.green, color: S.bg, fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', padding: '3px 14px', borderRadius: '20px' }}>
                    {tier.badge}
                  </div>
                )}

                <p style={{ fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', color: isGold ? S.gold : S.muted, marginBottom: '10px' }}>{tier.name}</p>

                {tier.type === 'custom' ? (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 700, color: S.gold }}>€{customAmount}</span>
                      <span style={{ fontSize: '13px', color: S.muted }}>one-time</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', marginBottom: '8px' }}>
                      {SUGGESTED_AMOUNTS.map((amt) => {
                        const sel = customAmount === amt && !showCustomInput;
                        return (
                          <button key={amt} onClick={() => { setCustomAmount(amt); setShowCustomInput(false); }} style={{ flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: sel ? 'rgba(245,166,35,0.18)' : 'rgba(255,255,255,0.05)', color: sel ? S.gold : S.muted, outline: sel ? '1px solid rgba(245,166,35,0.4)' : '1px solid rgba(255,255,255,0.07)' }}>
                            €{amt}
                          </button>
                        );
                      })}
                    </div>
                    {!showCustomInput ? (
                      <button onClick={() => setShowCustomInput(true)} style={{ fontSize: '12px', color: S.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>Or enter a custom amount →</button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ color: S.muted, fontSize: '14px' }}>€</span>
                        <input type="number" min="1" max="500" value={customAmount} onChange={(e) => setCustomAmount(Math.max(1, Number(e.target.value)))} style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', fontSize: '16px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', outline: 'none' }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: accentCol }}>{tier.price}</span>
                    {tier.period && <span style={{ fontSize: '13px', color: S.muted }}>{tier.period}</span>}
                  </div>
                )}

                {'savings' in tier && tier.savings && (
                  <span style={{ display: 'inline-block', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', marginBottom: '8px', width: 'fit-content', background: 'rgba(65,217,138,0.12)', color: S.green }}>{tier.savings}</span>
                )}

                <p style={{ fontSize: '13px', color: S.muted, marginBottom: '1.25rem', lineHeight: 1.5 }}>{tier.description}</p>

                <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0' }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: S.text, padding: '3px 0' }}>
                      <span style={{ color: accentCol, flexShrink: 0, marginTop: '1px' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>

                <button onClick={() => handleClick(tier)} disabled={loading !== null} style={{ width: '100%', padding: '11px', borderRadius: S.radiusSm, fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', background: isBlue ? S.gradient : isGreen ? S.green : isGold ? 'rgba(245,166,35,0.15)' : 'transparent', color: (isBlue || isGreen) ? S.bg : isGold ? S.gold : S.green, outline: (isBlue || isGreen) ? 'none' : isGold ? '1px solid rgba(245,166,35,0.4)' : '1px solid rgba(65,217,138,0.3)', opacity: loading && loading !== tier.key ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  {loading === tier.key ? 'Processing...' : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Amazon / Kindle section */}
        <div style={{ textAlign: 'center', margin: '3.5rem 0 1.25rem' }}>
          <div style={{ width: '40px', height: '2px', background: S.gradientFull, margin: '0 auto 16px', borderRadius: '1px' }}></div>
          <p style={{ fontSize: '11px', letterSpacing: '3px', color: S.muted, textTransform: 'uppercase', marginBottom: '6px' }}>Also on Amazon</p>
          <p style={{ color: '#555', fontSize: '0.9rem' }}>Read on any device or hold it in your hands.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          {[
            { label: 'Kindle eBook', price: '€2.99', sub: 'Read on any device → Amazon', icon: '📱', url: KINDLE_URL },
            { label: 'Physical Book', price: '€9.99', sub: 'Printed & delivered → Amazon', icon: '📖', url: PHYSICAL_BOOK_URL },
          ].map((item) => (
            <a key={item.label} href={item.url} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: S.radius, padding: '1.25rem 1.5rem', background: S.cardGold, border: `1px solid ${S.cardGoldBorder}`, cursor: 'pointer' }}>
                <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: S.muted, marginBottom: '4px' }}>{item.label}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: S.gold, marginBottom: '2px' }}>{item.price}</p>
                  <p style={{ fontSize: '12px', color: S.muted }}>{item.sub}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Subscription plans */}
        <div style={{ textAlign: 'center', margin: '3.5rem 0 1.25rem' }}>
          <div style={{ width: '40px', height: '2px', background: S.gradient, margin: '0 auto 16px', borderRadius: '1px' }}></div>
          <p style={{ fontSize: '11px', letterSpacing: '3px', color: S.muted, textTransform: 'uppercase', marginBottom: '6px' }}>Subscription plans</p>
          <p style={{ color: '#555', fontSize: '0.9rem' }}>For ongoing access after early access ends.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', maxWidth: '680px', margin: '0 auto' }}>
          {subTiers.map((tier) => (
            <div key={tier.key} style={{ display: 'flex', flexDirection: 'column', borderRadius: S.radius, padding: '1.5rem', background: S.card, border: '1px solid ' + S.cardBorder }}>
              <p style={{ fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', color: S.muted, marginBottom: '10px' }}>{tier.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: S.white }}>{tier.price}</span>
                <span style={{ fontSize: '13px', color: S.muted }}>{tier.period}</span>
              </div>
              {'savings' in tier && tier.savings && (
                <span style={{ display: 'inline-block', fontSize: '11px', padding: '3px 10px', borderRadius: '12px', marginBottom: '8px', width: 'fit-content', background: 'rgba(65,217,138,0.12)', color: S.green }}>{tier.savings}</span>
              )}
              <p style={{ fontSize: '13px', color: S.muted, marginBottom: '1.25rem', lineHeight: 1.5 }}>{tier.description}</p>
              <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0' }}>
                {tier.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: S.text, padding: '3px 0' }}>
                    <span style={{ color: S.green, flexShrink: 0, marginTop: '1px' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleClick(tier)} disabled={loading !== null} style={{ width: '100%', padding: '11px', borderRadius: S.radiusSm, fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: S.green, outline: '1px solid rgba(65,217,138,0.3)', opacity: loading && loading !== tier.key ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {loading === tier.key ? 'Processing...' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '12px', color: '#444', marginBottom: '12px' }}>All prices in EUR. Secure payments powered by Stripe.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '12px' }}>
            <a href="https://oneill-labs.com/upgradeyourbody/" target="_blank" rel="noopener" style={{ color: '#555', textDecoration: 'none' }}>Blog</a>
            <a href="https://oneill-labs.com" target="_blank" rel="noopener" style={{ color: '#555', textDecoration: 'none' }}>O'Neill Labs</a>
            <a href="https://www.youtube.com/@GoUpYourGame" target="_blank" rel="noopener" style={{ color: '#555', textDecoration: 'none' }}>YouTube</a>
            <a href="/" style={{ color: '#555', textDecoration: 'none' }}>Home</a>
          </div>
          <p style={{ fontSize: '11px', color: '#333', marginTop: '10px' }}>© {new Date().getFullYear()} O'Neill Labs / Niall O'Neill — All rights reserved.</p>
        </footer>

      </div>
    </div>
  );
}