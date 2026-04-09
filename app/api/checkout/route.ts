import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: req.headers.get('Authorization') || '',
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    } catch {
      // Not logged in — continue as guest
    }

    const stripe = getStripe();
    const bundlePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE;
    const proMonthlyPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;

    const price = await stripe.prices.retrieve(priceId);
    const isSubscription = price.type === 'recurring';
    const isBundle = priceId === bundlePriceId;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      allow_promotion_codes: true,
      ...(!isSubscription && { customer_creation: 'always' as const }),
      metadata: {
        product_type: isBundle ? 'bundle' : isSubscription ? 'subscription' : 'one_time',
        ...(userId && { user_id: userId }),
        ...(userEmail && { customer_email: userEmail }),
      },
    };

    if (userEmail) {
      sessionConfig.customer_email = userEmail;
    }

    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: {
          ...(userId && { user_id: userId }),
          ...(userEmail && { customer_email: userEmail }),
        },
      };
    }

    if (isBundle) {
      sessionConfig.metadata!.create_trial_subscription = 'true';
      sessionConfig.metadata!.trial_price_id = proMonthlyPriceId!;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
