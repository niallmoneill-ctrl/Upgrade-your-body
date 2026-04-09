import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------
const { mockPricesRetrieve, mockSessionsCreate } = vi.hoisted(() => ({
  mockPricesRetrieve: vi.fn(),
  mockSessionsCreate: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class {
    prices = { retrieve: mockPricesRetrieve };
    checkout = { sessions: { create: mockSessionsCreate } };
  },
}));

vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

// ---------------------------------------------------------------------------
// Import route AFTER mocks
// ---------------------------------------------------------------------------
import { POST } from '../../app/api/checkout/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: object) {
  return { json: async () => body } as any;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' });
  });

  it('returns 400 when priceId is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing priceId' });
  });

  it('creates a payment-mode session for a one-time price', async () => {
    mockPricesRetrieve.mockResolvedValue({ type: 'one_time' });

    const res = await POST(makeRequest({ priceId: 'price_pdf_xxx' }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: 'https://checkout.stripe.com/pay/cs_test' });

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        metadata: { product_type: 'one_time' },
      })
    );
  });

  it('creates a subscription-mode session for a recurring price', async () => {
    mockPricesRetrieve.mockResolvedValue({ type: 'recurring' });

    const res = await POST(makeRequest({ priceId: 'price_monthly_xxx' }));
    expect(res.status).toBe(200);

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        metadata: { product_type: 'subscription' },
      })
    );
  });

  it('adds bundle metadata when priceId matches BUNDLE price', async () => {
    // process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE is set in setup.ts
    mockPricesRetrieve.mockResolvedValue({ type: 'one_time' });

    const res = await POST(makeRequest({ priceId: 'price_bundle_xxx' }));
    expect(res.status).toBe(200);

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          product_type: 'bundle',
          create_trial_subscription: 'true',
          trial_price_id: 'price_monthly_xxx',
        }),
      })
    );
  });

  it('includes success and cancel URLs', async () => {
    mockPricesRetrieve.mockResolvedValue({ type: 'one_time' });

    await POST(makeRequest({ priceId: 'price_pdf_xxx' }));

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining('/success'),
        cancel_url: expect.stringContaining('/pricing'),
      })
    );
  });

  it('returns 500 when Stripe throws', async () => {
    mockPricesRetrieve.mockRejectedValue(new Error('Stripe API error'));

    const res = await POST(makeRequest({ priceId: 'price_bad' }));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Stripe API error' });
  });
});
