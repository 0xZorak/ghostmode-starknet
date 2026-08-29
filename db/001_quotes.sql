create table if not exists ghostmode_quotes (
  quote_id text primary key,
  quote jsonb not null,
  resource jsonb not null,
  created_at bigint not null,
  valid_until bigint not null,
  status text not null check (status in ('pending', 'submitted', 'verified', 'released', 'expired', 'rejected')),
  transaction_hash text unique,
  verified_at bigint,
  note_id text
);

create index if not exists ghostmode_quotes_expiry_idx on ghostmode_quotes (valid_until);
