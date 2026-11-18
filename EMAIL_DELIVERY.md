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

After explicit owner approval, a fresh disposable signup was created. The updated confirmation arrived naturally in Gmail Inbox. Opening its confirmation link returned to macrodivide.com/app.html with a confirmed session and the account-ready subscription selection. No trial, subscription or payment was initiated. The test session was signed out afterwards.

Both confirmation and recovery messages have now been observed in Inbox in the owner Gmail mailbox. This does not guarantee placement for every customer or mailbox provider.
