'use client';

export default function SuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#08111f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>You're all set!</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Thank you for your purchase. Check your email for confirmation and next steps.</p>
        <a href="/app" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: '#41d98a', color: '#08111f', textDecoration: 'none' }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
