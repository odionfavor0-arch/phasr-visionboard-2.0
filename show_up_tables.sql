create extension if not exists pgcrypto;

create table if not exists public.show_up_rooms (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  user_id text not null,
  user_initials text,
  checked_in boolean not null default false,
  check_in_time timestamptz,
  task_completed boolean not null default false,
  streak_count integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists show_up_rooms_user_room_key
  on public.show_up_rooms (user_id, room_name);

create table if not exists public.user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
