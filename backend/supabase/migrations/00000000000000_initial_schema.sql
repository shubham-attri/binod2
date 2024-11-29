-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgvector";

-- Create users table
create table if not exists public.users (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    full_name text not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cases table
create table if not exists public.cases (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    status text default 'active',
    client_info jsonb,
    user_id uuid references public.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create documents table
create table if not exists public.documents (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    content text not null,
    file_type text not null,
    metadata jsonb,
    case_id uuid references public.cases(id) on delete set null,
    user_id uuid references public.users(id) on delete cascade not null,
    vector_id text,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create canvas table
create table if not exists public.canvas (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    content jsonb not null,
    document_id uuid references public.documents(id) on delete set null,
    case_id uuid references public.cases(id) on delete set null,
    user_id uuid references public.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table if not exists public.messages (
    id uuid primary key default uuid_generate_v4(),
    role text not null,
    content text not null,
    metadata jsonb,
    user_id uuid references public.users(id) on delete cascade not null,
    case_id uuid references public.cases(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create research_queries table
create table if not exists public.research_queries (
    id uuid primary key default uuid_generate_v4(),
    query text not null,
    context jsonb,
    user_id uuid references public.users(id) on delete cascade not null,
    case_id uuid references public.cases(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create research_responses table
create table if not exists public.research_responses (
    id uuid primary key default uuid_generate_v4(),
    query_id uuid references public.research_queries(id) on delete cascade not null,
    content text not null,
    sources jsonb not null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.users enable row level security;
alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.canvas enable row level security;
alter table public.messages enable row level security;
alter table public.research_queries enable row level security;
alter table public.research_responses enable row level security;

-- User policies
create policy "Users can view their own data"
    on public.users for select
    using (auth.uid() = id);

-- Case policies
create policy "Users can CRUD their own cases"
    on public.cases for all
    using (auth.uid() = user_id);

-- Document policies
create policy "Users can CRUD their own documents"
    on public.documents for all
    using (auth.uid() = user_id);

-- Canvas policies
create policy "Users can CRUD their own canvas"
    on public.canvas for all
    using (auth.uid() = user_id);

-- Message policies
create policy "Users can CRUD their own messages"
    on public.messages for all
    using (auth.uid() = user_id);

-- Research policies
create policy "Users can CRUD their own research queries"
    on public.research_queries for all
    using (auth.uid() = user_id);

create policy "Users can view responses to their queries"
    on public.research_responses for select
    using (exists (
        select 1 from public.research_queries
        where research_queries.id = research_responses.query_id
        and research_queries.user_id = auth.uid()
    )); 