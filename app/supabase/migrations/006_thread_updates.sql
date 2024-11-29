-- Supabase AI is experimental and may produce incorrect answers
-- Always verify the output before executing

-- Add initial_query column to chat_threads table
alter table chat_threads
add column if not exists initial_query text;

-- Add index for faster thread search
create extension if not exists pg_trgm;

create index if not exists idx_chat_threads_title_trgm on chat_threads using gin (title gin_trgm_ops);

-- Create function to search threads within a case
create
or replace function search_case_threads (case_id_param uuid, search_query text) returns table (
  id uuid,
  title text,
  type text,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  initial_query text,
  case_id uuid
) as $$
BEGIN
  RETURN QUERY
    SELECT 
      t.id,
      t.title,
      t.type,
      t.created_at,
      t.updated_at,
      t.initial_query,
      t.case_id
    FROM chat_threads t
    WHERE 
      t.case_id = case_id_param 
      AND (
        t.title ILIKE '%' || search_query || '%'
        OR t.initial_query ILIKE '%' || search_query || '%'
      )
    ORDER BY t.created_at DESC;
END;
$$ language plpgsql;