-- Add file size column to documents table
alter table documents 
add column size bigint;

-- Update the document versioning function to include size
create or replace function create_document_version()
returns trigger as $$
begin
  insert into document_versions (
    document_id, 
    content, 
    version, 
    user_id,
    size
  )
  values (
    old.id, 
    old.content, 
    old.version, 
    old.user_id,
    old.size
  );
  return new;
end;
$$ language plpgsql; 