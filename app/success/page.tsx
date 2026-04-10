'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

type ProductType = 'ebook' | 'bundle' | 'support' | 'subscription' | 'unknown';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [downloading, setDownloading] = useState(false);
  const [productType, setProductType] = useState<ProductType>('unknown');
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionInfo() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/checkout/session?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          const type = data.product_type || 'unknown';
          if (type === 'one_time' || type === 'ebook') setProductType('ebook');
          else if (type === 'bundle') setProductType('bundle');
          else if (type === 'support') setProductType('support');
          else if (type === 'subscription') setProductType('subscription');
          else setProductType('unknown');
          if (data.amount) setAmount(data.amount);
        }
      } catch (err) {
        console.error('Failed to fetch session info:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessionInfo();
  }, [sessionId]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch('/api/ebook/download');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <div style={{ color: '#888' }}>Loading...</div>;
  }

  const content: Record<ProductType, { emoji: string; title: string; message: string; showDownload: boolean }> = {
    ebook: {
      emoji: '📖',
      title: 'Your eBook is ready!',
      message: 'Thank you for purchasing the Upgrade Your Body eBook. Download it below — it\'s yours to keep forever.',
      showDownload: true,
    },
    bundle: {
      emoji: '🚀',
      title: 'Bundle activated!',
      message: 'You\'ve got the eBook plus 3 months of Pro access. Download the eBook below and explore the app.',
      showDownload: true,
    },
    support: {
      emoji: '💚',
      title: 'Thank you for your support!',
      message: amount
        ? `Your €${(parseInt(amount) / 100).toFixed(2)} contribution means a lot. You're helping us build something great.`
        : 'Your contribution means a lot. You\'re helping us build something great.',
      showDownload: false,
    },
    subscription: {
      emoji: '⚡',
      title: 'Pro access activated!',
      message: 'Your subscription is active. Dive into the full app experience — personalised plans, tracking, and more.',
      showDownload: false,
    },
    unknown: {
      emoji: '🎉',
      title: 'You\'re all set!',
      message: 'Thank you for your purchase. Check your email for confirmation and next steps.',
      showDownload: false,
    },
  };

  const c = content[productType];

  return (
    <div style={{ maxWidth: '440px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{c.emoji}</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>{c.title}</h1>
      <p style={{ color: '#888', marginBottom: '2rem', lineHeight: 1.6 }}>{c.message}</p>

      {c.showDownload && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: 'inline-block', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
            background: '#4a9eff', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '1rem', width: '100%',
            opacity: downloading ? 0.6 : 1,
          }}
        >
          {downloading ? 'Preparing download...' : '📥 Download your eBook (PDF)'}
        </button>
      )}

      
        href="/app/dashboard"
        style={{
          display: 'inline-block', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
          background: '#41d98a', color: '#08111f', textDecoration: 'none', width: '100%', boxSizing: 'border-box',
        }}
      >
        Go to Dashboard
      </a>

      {productType === 'support' && (
        
          href="/pricing"
          style={{
            display: 'inline-block', marginTop: '12px', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
            background: 'transparent', color: '#888', textDecoration: 'none', width: '100%', boxSizing: 'border-box',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          ← Back to pricing
        </a>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#08111f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Suspense fallback={<div style={{ color: '#888' }}>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
