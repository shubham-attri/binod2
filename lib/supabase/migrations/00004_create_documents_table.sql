-- Create documents table for file ingestion metadata
create table documents (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  ingested_chunks int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups by conversation
create index idx_documents_conversation_id on documents(conversation_id);
