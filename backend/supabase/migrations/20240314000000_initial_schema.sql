-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgvector";

-- Create tables
create table if not exists public.users (
    id uuid references auth.users on delete cascade not null primary key,
    email text unique not null,
    full_name text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.chat_contexts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    mode text not null check (mode in ('research', 'case', 'playground')),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.chat_messages (
    id uuid default uuid_generate_v4() primary key,
    context_id uuid references public.chat_contexts(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create table if not exists public.documents (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    context_id uuid references public.chat_contexts(id) on delete set null,
    title text not null,
    content text not null,
    embedding vector(1536),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes
create index if not exists chat_contexts_user_id_idx on public.chat_contexts(user_id);
create index if not exists chat_messages_context_id_idx on public.chat_messages(context_id);
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_context_id_idx on public.documents(context_id);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.chat_contexts enable row level security;
alter table public.chat_messages enable row level security;
alter table public.documents enable row level security;

-- Create RLS policies
create policy "Users can view own profile"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can manage own chat contexts"
    on public.chat_contexts for all
    using (auth.uid() = user_id);

create policy "Users can manage own chat messages"
    on public.chat_messages for all
    using (
        auth.uid() in (
            select user_id from public.chat_contexts
            where id = chat_messages.context_id
        )
    );

create policy "Users can manage own documents"
    on public.documents for all
    using (auth.uid() = user_id); 