# OVH deployment

Production: https://macrodivide.com/ (sales), https://macrodivide.com/app.html (account).

Frontend runs on OVH free 100 MB hosting, service macrodh.cluster129.hosting.ovh.net, web root /home/macrodh/www. Upload only index.html, app.html, member-auth.js, assets/, and .htaccess. Never upload .env, .projects, .git, or backend secrets. GitHub remains the source backup.

Supabase remains the authentication and protected application backend. Billing v6 and member-app v5 were deployed on 18 November 2026. Stripe remains the billing provider: 14-day trial then EUR 5.99 monthly, inclusive tax pricing through Managed Payments. Production return URLs use the canonical domain. Legacy GitHub origin remains temporarily allowed for migration compatibility.

Supabase Auth site URL: https://macrodivide.com/app.html. Allowlisted redirect URLs include canonical and www app.html, plus the previous GitHub Pages account URL.

Brevo authenticated auth.macrodivide.com with verification TXT, two DKIM CNAMEs and DMARC. Auth sender: MacroDivide <noreply@auth.macrodivide.com>. Support remains support.macrodivide@proton.me. SMTP credentials are encrypted in Supabase only.

Verification: HTTPS sales/account/assets respond 200; HTTP and www redirect to canonical HTTPS; .htaccess returns 403; account JavaScript uses no-store; both backend endpoints allow the canonical CORS origin. Access, webhook and origin tests pass. A paid subscription/card transaction has not been submitted during migration. Browser-local recipes/cookware from GitHub Pages do not automatically transfer to the new origin.
