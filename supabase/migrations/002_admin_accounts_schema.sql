-- Enable the pgsodium extension for encryption
create extension if not exists pgsodium with schema pgsodium;

-- Create a table for Grand Shooting accounts
create table
  public.grand_shooting_accounts (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name text not null,
    base_url text not null,
    bearer_token_encrypted bytea null, -- Encrypted token
    status text not null default 'active'::text,
    primary key (id),
    constraint name_unique unique (name)
  );

comment on column public.grand_shooting_accounts.bearer_token_encrypted is 'Encrypted bearer token using pgsodium';

-- Create a table for synchronizations
create table
  public.synchronizations (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    principal_account_id uuid not null,
    secondary_account_id uuid not null,
    status text not null default 'disabled'::text,
    primary key (id),
    foreign key (principal_account_id) references public.grand_shooting_accounts (id) on delete cascade,
    foreign key (secondary_account_id) references public.grand_shooting_accounts (id) on delete cascade
  );

-- Enable Row Level Security
alter table public.grand_shooting_accounts enable row level security;
alter table public.synchronizations enable row level security;

-- Create policies for access
create policy "Allow read for authenticated users" on public.grand_shooting_accounts for select to authenticated using (true);
create policy "Allow full access for service_role" on public.grand_shooting_accounts for all to service_role using (true) with check (true);
create policy "Allow read for authenticated users" on public.synchronizations for select to authenticated using (true);
create policy "Allow full access for service_role" on public.synchronizations for all to service_role using (true) with check (true);


-- RPC Functions for secure operations

-- Important: You must create a key and store its ID in Supabase Vault.
-- Example: `insert into pgsodium.key (raw_key) values (pgsodium.crypto_aead_det_keygen())`
-- Then get the ID and create a secret in the vault named 'GS_ENCRYPTION_KEY_ID'.

create or replace function public.create_gs_account(
    name text,
    base_url text,
    bearer_token text
)
returns uuid
language plpgsql
security definer -- To run with the permissions of the function creator
as $$
declare
  encrypted_token bytea;
  new_account_id uuid;
begin
  -- Encrypt the token using pgsodium
  encrypted_token := pgsodium.crypto_aead_det_encrypt(
    bearer_token::bytea,
    'additional_data'::bytea, -- Optional additional data
    (SELECT vault.get_secret_by_name('GS_ENCRYPTION_KEY_ID'))::uuid
  );

  -- Insert the new account with the encrypted token
  insert into public.grand_shooting_accounts (name, base_url, bearer_token_encrypted)
  values (name, base_url, encrypted_token)
  returning id into new_account_id;
  
  return new_account_id;
end;
$$;


create or replace function public.get_decrypted_gs_accounts()
returns table (
    id uuid,
    name text,
    base_url text,
    bearer_token text,
    status text,
    created_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query
  select
    a.id,
    a.name,
    a.base_url,
    pgsodium.crypto_aead_det_decrypt(
      a.bearer_token_encrypted,
      'additional_data'::bytea,
      (SELECT vault.get_secret_by_name('GS_ENCRYPTION_KEY_ID'))::uuid
    )::text as bearer_token,
    a.status,
    a.created_at
  from public.grand_shooting_accounts as a;
end;
$$;


comment on table public.grand_shooting_accounts is 'Stores Grand Shooting account credentials and details.';
comment on table public.synchronizations is 'Defines synchronization relationships between a principal and a secondary account.'; 