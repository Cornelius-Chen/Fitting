create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  sex text not null,
  age integer not null,
  height_cm integer not null,
  weight_kg numeric not null,
  goal text not null,
  target_calories_train integer not null,
  target_calories_rest integer not null,
  protein integer not null,
  fat integer not null,
  carbs_train integer not null,
  carbs_rest integer not null,
  steps integer not null,
  water numeric not null,
  sleep numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_plan_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_week integer not null,
  selected_day integer not null,
  meal_selection jsonb not null,
  checklist jsonb not null,
  exercise_checks jsonb not null,
  daily_log_draft jsonb not null,
  grocery_checks_by_week jsonb not null,
  today_generated_at text,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week integer not null,
  day integer not null,
  report_date text not null,
  score integer not null,
  weight numeric not null,
  steps integer not null,
  protein integer not null,
  sleep numeric not null,
  workout_status text not null,
  note text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week, day)
);

alter table public.profiles enable row level security;
alter table public.user_plan_state enable row level security;
alter table public.daily_reports enable row level security;

create policy "profiles owner access" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "plan state owner access" on public.user_plan_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily reports owner access" on public.daily_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
