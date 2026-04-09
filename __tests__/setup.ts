// Set env vars before any module imports so module-level code picks them up
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key_xxx';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';
process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE = 'price_bundle_xxx';
process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_monthly_xxx';
