# MacroDivide authentication email delivery

Sender: MacroDivide <noreply@auth.macrodivide.com>. Supabase sends through Brevo SMTP; credentials remain encrypted in Supabase and are not stored here.

## Templates

- `supabase/templates/confirmation.html`: confirmation subject `MacroDivide: confirm your account`.
- `supabase/templates/recovery.html`: recovery subject `MacroDivide: password reset requested`.

These templates are deployed in Supabase Auth > Emails, not uploaded to the public OVH web root. Keep the `{{ .ConfirmationURL }}` variable intact.

## Brevo configuration

Settings > Contacts > Per-contact pixel tracking consent:

- Per-contact tracking consent: Yes.
- Track contacts whose consent is unknown: No.

These settings limit individual tracking, but an actual delivered SMTP message still contained a Brevo redirect. Do not describe SMTP link rewriting as disabled. Brevo may retain aggregate transactional tracking.

## Evidence on 18 November 2026

Gmail's original-message view reported SPF PASS, DKIM PASS for auth.macrodivide.com, and DMARC PASS on the earlier signup message. Its spam explanation described similarity to previously identified spam, rather than a failed authentication result.

After template and consent-setting changes, a password-reset message to the existing owner test account arrived naturally in Gmail Inbox. No Gmail filter or Not spam action was used. This is one mailbox observation, not a guarantee of inbox placement for all recipients.

One further fresh signup-confirmation test requires explicit user approval because automatic review rejected creating another persistent test user. The original test user had already confirmed its address, so the signup-resend endpoint did not produce another confirmation for that account.
