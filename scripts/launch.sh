#!/usr/bin/env bash
# ============================================================
# Upgrade Your Body – Automated Launch Workflow
# Run: chmod +x scripts/launch.sh && ./scripts/launch.sh
# ============================================================

set -euo pipefail
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  Upgrade Your Body — Launch Workflow${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════${NC}\n"

# ── Phase 1: Pre-flight checks ──────────────────────────────
echo -e "${BOLD}Phase 1: Pre-flight checks${NC}\n"

# Check git status
if ! git diff --quiet 2>/dev/null; then
  echo -e "${YELLOW}⚠ Uncommitted changes detected.${NC}"
  read -p "  Stage and commit all changes? (y/n): " COMMIT
  if [[ "$COMMIT" == "y" ]]; then
    git add -A
    read -p "  Commit message: " MSG
    git commit -m "${MSG:-'Pre-launch commit'}"
    echo -e "${GREEN}  ✓ Changes committed${NC}"
  fi
fi

# Verify .env.local has production URL
if grep -q "localhost" .env.local 2>/dev/null; then
  echo -e "${RED}✗ NEXT_PUBLIC_APP_URL still points to localhost${NC}"
  read -p "  Enter your production URL (e.g. https://upgradeyourbody.com): " PROD_URL
  if [ -n "$PROD_URL" ]; then
    sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${PROD_URL}|" .env.local
    echo -e "${GREEN}  ✓ Updated .env.local with ${PROD_URL}${NC}"
  fi
fi

# ── Phase 2: Build verification ─────────────────────────────
echo -e "\n${BOLD}Phase 2: Build verification${NC}\n"

echo "  Installing dependencies..."
npm ci --silent 2>/dev/null || npm install --silent
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

echo "  Running TypeScript check..."
if npx tsc --noEmit 2>/dev/null; then
  echo -e "${GREEN}  ✓ No TypeScript errors${NC}"
else
  echo -e "${RED}  ✗ TypeScript errors — fix before deploying${NC}"
  exit 1
fi

echo "  Building project..."
if npx next build 2>/dev/null; then
  echo -e "${GREEN}  ✓ Build successful${NC}"
else
  echo -e "${RED}  ✗ Build failed — fix errors before deploying${NC}"
  exit 1
fi

# ── Phase 3: Supabase Configuration ─────────────────────────
echo -e "\n${BOLD}Phase 3: Supabase Configuration Reminders${NC}\n"

echo -e "  ${CYAN}Manual checks needed in Supabase Dashboard:${NC}"
echo "    1. Auth → URL Configuration → Set Site URL to your production domain"
echo "    2. Auth → URL Configuration → Add redirect URL: https://yourdomain.com/auth/callback"
echo "    3. Auth → Email Templates → Customize magic link email with your branding"
echo "    4. Database → Tables → Verify RLS policies on:"
echo "       • custom_metrics  (user_id = auth.uid())"
echo "       • metric_entries  (user_id = auth.uid())"
echo "       • weekly_reviews  (user_id = auth.uid())"
echo "       • reminders       (user_id = auth.uid())"
echo "    5. Auth → Rate Limits → Review email send limits for launch"
echo ""
read -p "  Have you completed Supabase config? (y/n): " SUPA_OK

# ── Phase 4: Deploy ─────────────────────────────────────────
echo -e "\n${BOLD}Phase 4: Deploy${NC}\n"

if command -v vercel &>/dev/null; then
  echo "  Vercel CLI detected."
  read -p "  Deploy to production? (y/n): " DEPLOY
  if [[ "$DEPLOY" == "y" ]]; then
    echo "  Deploying..."
    vercel --prod
    echo -e "\n${GREEN}  ✓ Deployed to production!${NC}"
  fi
else
  echo -e "  ${YELLOW}Vercel CLI not installed.${NC}"
  echo "  Install with: npm i -g vercel"
  echo "  Or deploy via: https://vercel.com/new"
  echo ""
  echo "  ${CYAN}Environment variables to set in Vercel:${NC}"
  echo "    NEXT_PUBLIC_SUPABASE_URL"
  echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "    NEXT_PUBLIC_APP_URL  (your production domain)"
  echo ""
  echo "  ${RED}DO NOT add SUPABASE_SERVICE_ROLE_KEY to Vercel${NC}"
  echo "  (unless you have server-side admin routes that need it)"
fi

# ── Phase 5: Post-deploy smoke test ─────────────────────────
echo -e "\n${BOLD}Phase 5: Post-Deploy Smoke Test${NC}\n"

PROD_URL=$(grep "NEXT_PUBLIC_APP_URL" .env.local | cut -d'=' -f2)

if [ -n "$PROD_URL" ] && [[ "$PROD_URL" != *"localhost"* ]]; then
  echo "  Testing ${PROD_URL} ..."

  # Home page
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} Home page: $STATUS"
  else
    echo -e "  ${RED}✗${NC} Home page: $STATUS"
  fi

  # Login page
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/login" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} Login page: $STATUS"
  else
    echo -e "  ${RED}✗${NC} Login page: $STATUS"
  fi

  # API check (should return 401 unauthenticated)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/metrics" 2>/dev/null || echo "000")
  if [ "$STATUS" = "401" ]; then
    echo -e "  ${GREEN}✓${NC} API /metrics returns 401 (auth working)"
  else
    echo -e "  ${YELLOW}⚠${NC} API /metrics returned $STATUS (expected 401)"
  fi
else
  echo "  Skipping — set a production URL to enable smoke tests."
fi

# ── Phase 6: Launch checklist summary ────────────────────────
echo -e "\n${BOLD}Phase 6: Post-Launch TODO${NC}\n"

echo "  □ Test magic link signup with a real email"
echo "  □ Test full flow: signup → dashboard → create metric → log entry"
echo "  □ Test weekly review save/load"
echo "  □ Connect website landing page links to the app"
echo "  □ Connect book purchase CTA / bundle link"
echo "  □ Set up custom domain in Vercel (if not done)"
echo "  □ Configure DNS (CNAME to cname.vercel-dns.com)"
echo "  □ Enable Vercel Analytics (optional)"
echo "  □ Set up error monitoring (Sentry or Vercel)"
echo "  □ Create a backup Supabase project for staging"

echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Launch workflow complete!${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════${NC}\n"
