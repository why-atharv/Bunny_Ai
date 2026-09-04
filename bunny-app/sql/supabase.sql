-- Cute Female Bunny — Supabase schema
-- Run this once in the SQL editor of your Supabase project.

create extension if not exists "pgcrypto";

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_label text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  language text default 'en',
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at);

create index if not exists chat_sessions_created_idx
  on public.chat_sessions (created_at desc);

-- Row Level Security: this app uses the anon key from the browser, so we
-- enable read/write for anonymous users. Tighten these policies before
-- shipping to anyone other than yourself.
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "anon_all_sessions" on public.chat_sessions;
create policy "anon_all_sessions"
  on public.chat_sessions
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon_all_messages" on public.chat_messages;
create policy "anon_all_messages"
  on public.chat_messages
  for all
  to anon
  using (true)
  with check (true);