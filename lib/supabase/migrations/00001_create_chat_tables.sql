-- Create chat related tables
create type message_role as enum ('user', 'assistant');

-- Conversations/Threads table
create table conversations (
  id uuid default gen_random_uuid() primary key,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  role message_role not null,
  content text not null,
  thinking_steps jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_conversations_updated_at on conversations(updated_at desc); 