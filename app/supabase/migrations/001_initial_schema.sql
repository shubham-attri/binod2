-- Enable pgvector extension
create extension if not exists vector;

-- Create cases table
create table cases (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  client_name text not null,
  description text,
  status text check (status in ('active', 'pending', 'closed')) default 'active',
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade,
  starred boolean default false
);

-- Create documents table
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  type text check (type in ('contract', 'memo', 'analysis', 'other')) default 'other',
  case_id uuid references cases(id) on delete cascade,
  version integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade,
  embedding vector(1536),
  starred boolean default false
);

-- Create document versions table
create table document_versions (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  content text,
  version integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Create chat threads table
create table chat_threads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text check (type in ('research', 'case')) not null,
  case_id uuid references cases(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Create chat messages table
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references chat_threads(id) on delete cascade,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Enable Row Level Security
alter table cases enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;

-- Create RLS policies
create policy "Users can view their own cases"
  on cases for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cases"
  on cases for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cases"
  on cases for update
  using (auth.uid() = user_id);

create policy "Users can view documents in their cases"
  on documents for select
  using (
    auth.uid() = user_id or
    case_id in (select id from cases where user_id = auth.uid())
  );

create policy "Users can view messages in their threads"
  on chat_messages for select
  using (
    auth.uid() = user_id or
    thread_id in (select id from chat_threads where user_id = auth.uid())
  ); 