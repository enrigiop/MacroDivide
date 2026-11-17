# MacroDivide subscription integration

## Account configuration

- Stripe product: `prod_VdsR86KEsWR4hI`
- EUR 5.99/month inclusive price: `price_1Ucah3RYIvKi4dXuwLuEQWkD`
- Tax classification confirmed by owner: SaaS personal use (`txcd_10103000`).
- Checkout: Managed Payments, payment method collected, 14-day trial for first subscription only.
- Portal configuration: `bpc_1UcahoRYIvKi4dXu43ZJz5rl`, cancellation at period end.
- Supabase project: `jgmzkzhgxieswcrekmew`, Free tier, eu-west-1.

## Server secrets

Set `STRIPE_API_KEY` (restricted) and `STRIPE_WEBHOOK_SIGNING_SECRET` in Supabase Edge Function Secrets. Never store their values in this repository. Supabase injects its own server database key into the functions.

Restricted Stripe key: Customers Write; Checkout Sessions Write; Customer Portal Write; Subscriptions Read; Prices Read; Products Read; Charges and Refunds Read. No payouts or transfers.

## Flow

The sales page opens app.html. Supabase verifies email/password sign-in and confirmed email ownership. Customer support uses support.macrodivide@proton.me. Brevo SMTP is configured for confirmations and password recovery. Actual inbox delivery must be verified before launch. The billing function verifies the session with Auth, associates one Stripe Customer with that user, and creates a hosted Checkout session. Trial use is stored server-side. Repeat subscriptions do not get a fresh trial.

The member-app function serves the original calculator only to a verified user with a live active/trialing subscription and no risk hold. The return URL itself never grants access. Refreshing billing status reads current Stripe state and reconciles it with the database, so out-of-order webhook events do not restore stale access.

Backend tables have RLS and no anonymous or authenticated grants or policies: only service-role functions may read or write billing records. User-editable metadata is never used for authorization.

## Webhook destination

`https://jgmzkzhgxieswcrekmew.supabase.co/functions/v1/stripe-webhook`

Subscribe to:

- checkout.session.completed
- checkout.session.async_payment_succeeded
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- customer.subscription.paused
- customer.subscription.resumed
- invoice.paid
- invoice.payment_failed
- charge.dispute.created
- charge.refunded
- radar.early_fraud_warning.created

The webhook verifies Stripe's raw-body signature before database writes, processes events idempotently, and re-reads current subscription state. A dispute, early fraud warning, or full refund places the mapped customer on an access hold pending manual review. Partial refunds do not revoke access automatically.

## Current deployment

Billing, member-app, and stripe-webhook functions are deployed. Both custom Stripe secrets are stored in Supabase. Webhook `we_1Ucbq4RYIvKi4dXudzLr9Zoe` is active with the 12 events below and API version 2026-10-28.endive. Auth Site URL and redirect allow-list are configured. Production HTTP checks returned 401 for unsigned-in billing and app access, and 400 for an unsigned webhook.

The owner chose email/password accounts with Proton for support and Brevo for outbound authentication email. Brevo Free is active and support.macrodivide@proton.me is a verified sender named MacroDivide. Supabase SMTP is enabled using smtp-relay.brevo.com:587; the SMTP key is stored only in Supabase encrypted SMTP settings. The key is named MacroDivide Supabase Auth, expires November 17, 2027, and can expire after 90 days of inactivity. An actual Supabase authentication-email request succeeded (HTTP 200), and Brevo logged it as sent. Proton initially deferred it with SMTP 421 4.3.0, then Brevo recorded delivery at 15:33 Europe/Rome on November 17, 2026. Brevo reports server delivery, but the messages were not visible in the owner’s Proton mailbox. The owner successfully confirmed the test account through Brevo’s preview at 15:47 Europe/Rome; Supabase confirmed email ownership. Inbox placement and completion of password recovery remain unverified. Brevo rewrites unverified/free sender domains to brevosend.com as a temporary deliverability measure; this is not a permanent custom-domain guarantee. Google project utopian-outlook-515002-r3 was created but its OAuth client/provider setup was not completed.

## Before launch

- Configure Auth Site URL and allowed redirects to `https://enrigiop.github.io/MacroDivide/app.html`.
- Verify delivered confirmation and password-reset messages in real inboxes. The initial Proton deferral resolved on retry. Brevo transactional link tracking is enabled by default and the current Free settings expose anonymization, not a tracking-disable toggle; verify auth links end to end. Stay on the Free plan and do not enable paid upgrades.
- Install backend secrets and register the webhook destination.
- Test account creation, confirmation email, sign-in, password recovery, checkout, app access, cancellation, expiry, failed payment, and signature rejection in a separate Stripe sandbox. Do not use test cards against the live account.
- Before broadly promoting the app, complete the remaining inbox-placement, password recovery and payment-lifecycle checks. The owner requested publishing the connected page while these limitations remain documented. The public calculator source is not DRM; authorization protects the hosted service, not copies of open-source code.

## Validation

Run `node tests/access.test.mjs` for authorization boundary cases. Inspect Supabase security advisors after schema changes. RLS-with-no-policy informational findings on billing tables are intentional: all browser access is denied.
