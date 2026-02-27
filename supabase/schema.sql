-- Neighborhood Navigator schema
-- Run this in the Supabase SQL editor after creating the project.

-- Anonymous screening events (no PII)
create table if not exists screenings (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text,
  zip text not null,
  household_size int,
  income_range text,
  housing_status text,
  matched_program_ids text[] default '{}',
  match_count int default 0,
  strong_count int default 0,
  likely_count int default 0,
  opted_into_intake boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_screenings_tenant on screenings (tenant_slug);
create index if not exists idx_screenings_created on screenings (created_at);

-- Intake records (PII, tenant-restricted)
create table if not exists intakes (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  first_name text not null,
  phone text not null,
  email text,
  contact_method text not null default 'phone',
  screening_inputs jsonb,
  matched_programs jsonb,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'applied', 'served', 'declined')),
  crm_synced boolean default false,
  crm_reference text,
  created_at timestamptz default now()
);

create index if not exists idx_intakes_tenant on intakes (tenant_slug);
create index if not exists idx_intakes_status on intakes (status);
create index if not exists idx_intakes_created on intakes (created_at);

-- Row-Level Security
alter table screenings enable row level security;
alter table intakes enable row level security;

-- Screenings: service role can insert, authenticated users read their tenant
create policy "Service role inserts screenings"
  on screenings for insert
  to service_role
  with check (true);

create policy "Tenant users read own screenings"
  on screenings for select
  to authenticated
  using (
    tenant_slug = (current_setting('request.jwt.claims', true)::json ->> 'tenant_slug')
    or (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  );

-- Intakes: service role can insert/update, authenticated users read their tenant
create policy "Service role manages intakes"
  on intakes for all
  to service_role
  with check (true);

create policy "Tenant users read own intakes"
  on intakes for select
  to authenticated
  using (
    tenant_slug = (current_setting('request.jwt.claims', true)::json ->> 'tenant_slug')
  );
