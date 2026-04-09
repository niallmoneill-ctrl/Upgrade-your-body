import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state — must be declared before vi.mock() factories run
// ---------------------------------------------------------------------------
const {
  mockConstructEvent,
  mockSubscriptionsList,
  mockSubscriptionsCreate,
  mockListUsers,
  mockUpsert,
  mockSingle,
  mockCreateClient,
  mockHeaders,
} = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockCreateClient = vi.fn();
  const mockConstructEvent = vi.fn();
  const mockSubscriptionsList = vi.fn();
  const mockSubscriptionsCreate = vi.fn();
  const mockListUsers = vi.fn();
  const mockHeaders = vi.fn();
  return {
    mockConstructEvent,
    mockSubscriptionsList,
    mockSubscriptionsCreate,
    mockListUsers,
    mockUpsert,
    mockSingle,
    mockCreateClient,
    mockHeaders,
  };
});

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: mockConstructEvent };
    subscriptions = {
      list: mockSubscriptionsList,
      create: mockSubscriptionsCreate,
    };
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
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
// Import route AFTER mocks are registered
// ---------------------------------------------------------------------------
import { POST } from '../../../app/api/webhooks/stripe/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: string) {
  return { text: async () => body } as any;
}

function makeSupabaseClient({
  upsertError = null,
  selectData = null as { user_id: string } | null,
  listUsersData = { users: [] as { id: string; email: string }[] },
} = {}) {
  mockUpsert.mockResolvedValue({ error: upsertError });
  mockSingle.mockResolvedValue({ data: selectData, error: null });

  const eq = vi.fn().mockReturnValue({ single: mockSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ upsert: mockUpsert, select });

  mockListUsers.mockResolvedValue({ data: listUsersData, error: null });

  return {
    from,
    auth: { admin: { listUsers: mockListUsers } },
  };
}

function setStripeEvent(type: string, data: object) {
  mockConstructEvent.mockReturnValue({ type, data: { object: data } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: valid signature
    mockHeaders.mockResolvedValue({ get: () => 'test-sig' });

    // Default Supabase client
    mockCreateClient.mockReturnValue(makeSupabaseClient());
  });

  // -------------------------------------------------------------------------
  // Signature verification
  // -------------------------------------------------------------------------
  it('returns 400 when stripe signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid signature' });
  });

  // -------------------------------------------------------------------------
  // checkout.session.completed — subscription
  // -------------------------------------------------------------------------
  it('upserts pro subscription on checkout.session.completed (subscription)', async () => {
    const client = makeSupabaseClient({
      listUsersData: { users: [{ id: 'user_123', email: 'user@test.com' }] },
    });
    mockCreateClient.mockReturnValue(client);

    mockSubscriptionsList.mockResolvedValue({
      data: [
        {
          id: 'sub_abc',
          items: {
            data: [{ current_period_start: 1700000000, current_period_end: 1702592000 }],
          },
        },
      ],
    });

    setStripeEvent('checkout.session.completed', {
      customer: 'cus_123',
      customer_details: { email: 'user@test.com' },
      metadata: { product_type: 'subscription' },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user_123',
        stripe_customer_id: 'cus_123',
        plan_type: 'pro',
        status: 'active',
        stripe_subscription_id: 'sub_abc',
        customer_email: 'user@test.com',
      }),
      { onConflict: 'stripe_customer_id' }
    );
  });

  // -------------------------------------------------------------------------
  // checkout.session.completed — one_time (eBook)
  // -------------------------------------------------------------------------
  it('records ebook purchase on checkout.session.completed (one_time)', async () => {
    const client = makeSupabaseClient({
      listUsersData: { users: [{ id: 'user_456', email: 'buyer@test.com' }] },
    });
    mockCreateClient.mockReturnValue(client);

    setStripeEvent('checkout.session.completed', {
      customer: 'cus_456',
      customer_details: { email: 'buyer@test.com' },
      metadata: { product_type: 'one_time' },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_customer_id: 'cus_456',
        ebook_purchased: true,
        customer_email: 'buyer@test.com',
      }),
      { onConflict: 'stripe_customer_id' }
    );
  });

  // -------------------------------------------------------------------------
  // checkout.session.completed — bundle
  // -------------------------------------------------------------------------
  it('saves bundle and creates trial subscription on checkout.session.completed (bundle)', async () => {
    const client = makeSupabaseClient({
      listUsersData: { users: [{ id: 'user_789', email: 'bundle@test.com' }] },
    });
    mockCreateClient.mockReturnValue(client);

    mockSubscriptionsCreate.mockResolvedValue({
      id: 'sub_trial_xxx',
      items: {
        data: [{ current_period_start: 1700000000, current_period_end: 1707776000 }],
      },
    });

    setStripeEvent('checkout.session.completed', {
      customer: 'cus_789',
      customer_details: { email: 'bundle@test.com' },
      metadata: {
        product_type: 'bundle',
        create_trial_subscription: 'true',
        trial_price_id: 'price_monthly_xxx',
      },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    // First upsert: bundle flags
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_customer_id: 'cus_789',
        plan_type: 'pro',
        ebook_purchased: true,
        bundle_purchased: true,
      }),
      { onConflict: 'stripe_customer_id' }
    );

    // Trial subscription created with correct price
    expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_789',
        items: [{ price: 'price_monthly_xxx' }],
      })
    );
  });

  // -------------------------------------------------------------------------
  // checkout.session.completed — no email (guest)
  // -------------------------------------------------------------------------
  it('handles missing customer email gracefully', async () => {
    setStripeEvent('checkout.session.completed', {
      customer: 'cus_no_email',
      customer_details: {},
      metadata: { product_type: 'one_time' },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // customer.subscription.updated
  // -------------------------------------------------------------------------
  it('updates subscription status on customer.subscription.updated', async () => {
    const client = makeSupabaseClient({ selectData: { user_id: 'user_upd' } });
    mockCreateClient.mockReturnValue(client);

    setStripeEvent('customer.subscription.updated', {
      customer: 'cus_upd',
      status: 'active',
      items: {
        data: [{ current_period_start: 1700000000, current_period_end: 1702592000 }],
      },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user_upd',
        stripe_customer_id: 'cus_upd',
        status: 'active',
      }),
      { onConflict: 'stripe_customer_id' }
    );
  });

  // -------------------------------------------------------------------------
  // customer.subscription.deleted
  // -------------------------------------------------------------------------
  it('cancels subscription on customer.subscription.deleted', async () => {
    const client = makeSupabaseClient({ selectData: { user_id: 'user_del' } });
    mockCreateClient.mockReturnValue(client);

    setStripeEvent('customer.subscription.deleted', {
      customer: 'cus_del',
      items: { data: [] },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_customer_id: 'cus_del',
        plan_type: 'free',
        status: 'cancelled',
        stripe_subscription_id: null,
      }),
      { onConflict: 'stripe_customer_id' }
    );
  });

  // -------------------------------------------------------------------------
  // invoice.payment_failed
  // -------------------------------------------------------------------------
  it('marks subscription as past_due on invoice.payment_failed', async () => {
    const client = makeSupabaseClient({ selectData: { user_id: 'user_fail' } });
    mockCreateClient.mockReturnValue(client);

    setStripeEvent('invoice.payment_failed', {
      customer: 'cus_fail',
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_customer_id: 'cus_fail',
        status: 'past_due',
      }),
      { onConflict: 'stripe_customer_id' }
    );
  });

  // -------------------------------------------------------------------------
  // Supabase error → 500
  // -------------------------------------------------------------------------
  it('returns 500 when Supabase upsert fails', async () => {
    const client = makeSupabaseClient({
      upsertError: { message: 'DB write failed', code: '23505' },
      listUsersData: { users: [{ id: 'u1', email: 'err@test.com' }] },
    });
    mockCreateClient.mockReturnValue(client);

    mockSubscriptionsList.mockResolvedValue({
      data: [
        {
          id: 'sub_err',
          items: {
            data: [{ current_period_start: 1700000000, current_period_end: 1702592000 }],
          },
        },
      ],
    });

    setStripeEvent('checkout.session.completed', {
      customer: 'cus_err',
      customer_details: { email: 'err@test.com' },
      metadata: { product_type: 'subscription' },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'Webhook handler failed' });
  });

  // -------------------------------------------------------------------------
  // Missing Supabase env vars
  // -------------------------------------------------------------------------
  it('returns 500 when Supabase env vars are missing', async () => {
    const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    setStripeEvent('checkout.session.completed', {
      customer: 'cus_noenv',
      customer_details: { email: 'noenv@test.com' },
      metadata: { product_type: 'one_time' },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(500);

    process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
  });
});
