'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div style={{ maxWidth: '400px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>You're all set!</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Thank you for your purchase. Check your email for confirmation and next steps.</p>

      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: '#4a9eff', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '1rem', width: '100%', opacity: downloading ? 0.6 : 1 }}
      >
        {downloading ? 'Preparing download...' : '📥 Download your eBook (PDF)'}
      </button>

      <a href="/app/dashboard" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: '#41d98a', color: '#08111f', textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
        Go to Dashboard
      </a>
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
