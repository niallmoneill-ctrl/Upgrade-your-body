import Stripe from 'stripe';
import { notifyAdmin } from '@/lib/notify-admin';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!;
};

// Create Supabase admin client lazily so env vars are resolved at runtime
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env vars:', { hasUrl: !!url, hasKey: !!key });
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(url, key);
}

async function getUserByEmail(email: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return null;
  }
  return data.users.find((u) => u.email === email) || null;
}

// In Stripe API 2026-03-25, period dates are on subscription items, not the subscription
function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];
  if (!item) return { start: null, end: null };
  return {
    start: new Date(item.current_period_start * 1000).toISOString(),
    end: new Date(item.current_period_end * 1000).toISOString(),
  };
}

async function upsertSubscription(
  userId: string | null,
  stripeCustomerId: string | null,
  updates: Record<string, any>
) {
  const supabase = getSupabase();

  // Priority 1: If we have a user_id, always update their existing row (one row per user)
  if (userId) {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
          updated_at: new Date().toISOString(),
          ...updates,
        })
        .eq('id', existing.id);
      if (error) { console.error('Supabase update error:', error); throw error; }
      return;
    }

    // No existing row for this user — insert one
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
        updated_at: new Date().toISOString(),
        ...updates,
      });
    if (error) { console.error('Supabase insert error:', error); throw error; }
    return;
  }

  // Priority 2: No user_id — guest purchase, upsert by stripe_customer_id
  if (stripeCustomerId) {
    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
          ...updates,
        },
        { onConflict: 'stripe_customer_id' }
      );
    if (error) { console.error('Supabase upsert error:', error); throw error; }
  } else {
    console.error('No stripe_customer_id or user_id — cannot save subscription');
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, getWebhookSecret());
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        const productType = session.metadata?.product_type;
        const stripeCustomerId = session.customer as string;

        console.log(`Checkout complete: ${productType} for ${customerEmail}`);

        if (!customerEmail) {
          console.error('No customer email in session');
          break;
        }

        // Find the Supabase user by email (may be null for guest purchases)
        const user = await getUserByEmail(customerEmail);
        const userId = user?.id || null;

        if (!userId) {
          console.log(`No Supabase user found for ${customerEmail} — saving as guest purchase`);
        }

        if (productType === 'subscription') {
          const subscriptions = await getStripe().subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
          });
          const sub = subscriptions.data[0];
          const period = sub ? getSubscriptionPeriod(sub) : { start: null, end: null };

          await upsertSubscription(userId, stripeCustomerId, {
            stripe_subscription_id: sub?.id || null,
            plan_type: 'pro',
            status: 'active',
            customer_email: customerEmail,
            current_period_start: period.start,
            current_period_end: period.end,
          });
          notifyAdmin('New purchase: Pro subscription', 'Email: ' + customerEmail);
        console.log(`Pro subscription saved for ${customerEmail}`);
        } else if (productType === 'one_time') {
          await upsertSubscription(userId, stripeCustomerId, {
            ebook_purchased: true,
            customer_email: customerEmail,
          });
          notifyAdmin('New purchase: eBook', 'Email: ' + customerEmail);
        console.log(`eBook purchase saved for ${customerEmail}`);
        } else if (productType === 'bundle') {
          await upsertSubscription(userId, stripeCustomerId, {
            plan_type: 'pro',
            status: 'active',
            ebook_purchased: true,
            bundle_purchased: true,
            customer_email: customerEmail,
          });

          if (session.metadata?.create_trial_subscription === 'true') {
            const trialEnd =
              Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
            const trialSub = await getStripe().subscriptions.create({
              customer: stripeCustomerId,
              items: [{ price: session.metadata.trial_price_id }],
              trial_end: trialEnd,
              metadata: { source: 'bundle_purchase' },
            });

            const trialPeriod = getSubscriptionPeriod(trialSub);
            await upsertSubscription(userId, stripeCustomerId, {
              stripe_subscription_id: trialSub.id,
              current_period_end: trialPeriod.end || new Date(trialEnd * 1000).toISOString(),
            });
          }
          notifyAdmin('New purchase: Bundle', 'Email: ' + customerEmail);
        console.log(`Bundle purchase saved for ${customerEmail}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const period = getSubscriptionPeriod(subscription);

        const supabase = getSupabase();
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subRecord) {
          await upsertSubscription(subRecord.user_id, customerId, {
            status: subscription.status === 'active' ? 'active' : subscription.status,
            current_period_start: period.start,
            current_period_end: period.end,
          });
          console.log(`Subscription updated for customer ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const supabase = getSupabase();
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subRecord) {
          await upsertSubscription(subRecord.user_id, customerId, {
            plan_type: 'free',
            status: 'cancelled',
            stripe_subscription_id: null,
            current_period_start: null,
            current_period_end: null,
          });
          console.log(`Subscription cancelled for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const supabase = getSupabase();
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subRecord) {
          await upsertSubscription(subRecord.user_id, customerId, {
            status: 'past_due',
          });
          console.log(`Payment failed for customer ${customerId}`);
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message, err.stack || err);
    return NextResponse.json(
      { error: 'Webhook handler failed', detail: err.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
