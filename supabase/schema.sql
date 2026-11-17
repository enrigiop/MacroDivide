-- Billing records are written only by trusted server functions.
create table public.md_billing (
 user_id uuid primary key references auth.users(id) on delete cascade,
 customer_id text unique not null,
 subscription_id text unique,
 status text not null default 'none',
 trial_used boolean not null default false,
 trial_end timestamptz,
 period_end timestamptz,
 cancel_at_period_end boolean not null default false,
 risk_hold boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.md_billing enable row level security;
revoke all on public.md_billing from anon, authenticated;
grant all on public.md_billing to service_role;
create table public.md_stripe_events (
 id text primary key,
 event_type text not null,
 processed_at timestamptz not null default now()
);
alter table public.md_stripe_events enable row level security;
revoke all on public.md_stripe_events from anon, authenticated;
grant all on public.md_stripe_events to service_role;
