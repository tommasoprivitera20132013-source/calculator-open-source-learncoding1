-- AURA Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'ultra')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now()
);

-- Chats table
create table public.chats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null default 'New Chat',
  created_at timestamptz not null default now()
);

-- Messages table
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Generations table (images, music, video, etc.)
create table public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  tool text not null,
  prompt text not null,
  result_url text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Folders table (for notebook)
create table public.folders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Notes table
create table public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete set null,
  title text not null default 'Untitled',
  content text not null default '',
  created_at timestamptz not null default now()
);

-- Flashcard decks table
create table public.flashcard_decks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  created_at timestamptz not null default now()
);

-- Flashcards table
create table public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid references public.flashcard_decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  next_review timestamptz,
  created_at timestamptz not null default now()
);

-- Mind maps table
create table public.mind_maps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  data jsonb not null default '{"nodes": [], "edges": []}',
  created_at timestamptz not null default now()
);

-- Tasks table
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  labels text[] default '{}',
  created_at timestamptz not null default now()
);

-- Usage table (rate limiting)
create table public.usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  tool text not null,
  date date not null default current_date,
  count integer not null default 0,
  unique(user_id, date)
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.generations enable row level security;
alter table public.folders enable row level security;
alter table public.notes enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.mind_maps enable row level security;
alter table public.tasks enable row level security;
alter table public.usage enable row level security;

-- Users: own data only
create policy "Users can view own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);

-- Chats
create policy "Users own chats" on public.chats for all using (auth.uid() = user_id);

-- Messages
create policy "Users own messages" on public.messages for all using (auth.uid() = user_id);

-- Generations
create policy "Users own generations" on public.generations for all using (auth.uid() = user_id);

-- Folders
create policy "Users own folders" on public.folders for all using (auth.uid() = user_id);

-- Notes
create policy "Users own notes" on public.notes for all using (auth.uid() = user_id);

-- Flashcard decks
create policy "Users own decks" on public.flashcard_decks for all using (auth.uid() = user_id);

-- Flashcards (via deck ownership)
create policy "Users own flashcards" on public.flashcards for all using (
  exists (select 1 from public.flashcard_decks where id = deck_id and user_id = auth.uid())
);

-- Mind maps
create policy "Users own mind maps" on public.mind_maps for all using (auth.uid() = user_id);

-- Tasks
create policy "Users own tasks" on public.tasks for all using (auth.uid() = user_id);

-- Usage
create policy "Users own usage" on public.usage for all using (auth.uid() = user_id);

-- Trigger: create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for images
insert into storage.buckets (id, name, public) values ('generations', 'generations', true);
create policy "Users can upload own files" on storage.objects for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
create policy "Public read access" on storage.objects for select using (bucket_id = 'generations');
