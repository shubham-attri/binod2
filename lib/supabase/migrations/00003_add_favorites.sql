-- Add favorites column to conversations table
alter table conversations 
add column is_favorite boolean default false;

-- Add index for faster favorite lookups
create index idx_conversations_favorite on conversations(is_favorite); 