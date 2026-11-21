# Ticketing (Next.js + Paystack + Upstash Redis)

## Deploy
1. Import this repo in Vercel.
2. Vercel > Storage > add **Upstash Redis** (sets KV_REST_API_URL / KV_REST_API_TOKEN automatically).
3. Env vars (Production): PAYSTACK_SECRET_KEY, TICKET_SECRET (`openssl rand -hex 48`), STAFF_PASSWORD (12+ chars).
4. Paystack dashboard > Settings > API Keys & Webhooks > Webhook URL: https://YOUR-DOMAIN/api/webhook
5. Edit lib/events.js (name, date, venue, tiers, prices, capacity), redeploy.
6. Test with sk_test_ key first; then scan at /scan.
