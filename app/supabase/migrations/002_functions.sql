-- Function to search across cases and documents
create or replace function search_vault_items(
  search_query text,
  user_id uuid
) returns table (
  id uuid,
  title text,
  type text,
  created_at timestamptz,
  updated_at timestamptz,
  starred boolean,
  tags text[],
  case_id uuid
) language plpgsql as $$
begin
  return query
    -- Search cases
    select 
      c.id,
      c.title,
      'case'::text as type,
      c.created_at,
      c.updated_at,
      c.starred,
      c.tags,
      null::uuid as case_id
    from cases c
    where 
      c.user_id = search_vault_items.user_id
      and (
        c.title ilike '%' || search_query || '%'
        or c.description ilike '%' || search_query || '%'
        or search_query = any(c.tags)
      )
    union all
    -- Search documents
    select 
      d.id,
      d.title,
      'document'::text as type,
      d.created_at,
      d.updated_at,
      d.starred,
      null::text[] as tags,
      d.case_id
    from documents d
    where 
      d.user_id = search_vault_items.user_id
      and (
        d.title ilike '%' || search_query || '%'
        or d.content ilike '%' || search_query || '%'
      )
    order by updated_at desc;
end;
$$;

-- Function to get recent items
create or replace function get_recent_vault_items(
  user_id uuid,
  items_limit int
) returns table (
  id uuid,
  title text,
  type text,
  created_at timestamptz,
  updated_at timestamptz,
  starred boolean,
  tags text[],
  case_id uuid
) language plpgsql as $$
begin
  return query
    (select 
      c.id,
      c.title,
      'case'::text as type,
      c.created_at,
      c.updated_at,
      c.starred,
      c.tags,
      null::uuid as case_id
    from cases c
    where c.user_id = get_recent_vault_items.user_id
    union all
    select 
      d.id,
      d.title,
      'document'::text as type,
      d.created_at,
      d.updated_at,
      d.starred,
      null::text[] as tags,
      d.case_id
    from documents d
    where d.user_id = get_recent_vault_items.user_id)
    order by updated_at desc
    limit items_limit;
end;
$$;

-- Function for document versioning
create or replace function create_document_version()
returns trigger as $$
begin
  insert into document_versions (document_id, content, version, user_id)
  values (old.id, old.content, old.version, old.user_id);
  return new;
end;
$$ language plpgsql;

-- Create trigger for document versioning
create trigger document_version_trigger
  before update on documents
  for each row
  when (old.content is distinct from new.content)
  execute function create_document_version(); 