import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const BUNDLE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE;
const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRICE_PRO_MONTHLY;

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const price = await stripe.prices.retrieve(priceId);
    const isSubscription = price.type === 'recurring';
    const isBundle = priceId === BUNDLE_PRICE_ID;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      allow_promotion_codes: true,
      metadata: {
        product_type: isBundle ? 'bundle' : isSubscription ? 'subscription' : 'one_time',
      },
    };

    if (isBundle) {
      sessionConfig.metadata!.create_trial_subscription = 'true';
      sessionConfig.metadata!.trial_price_id = PRO_MONTHLY_PRICE_ID!;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
