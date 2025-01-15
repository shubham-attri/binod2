-- Add file support to messages table
alter table messages 
add column file_url text,
add column file_name text,
add column file_type text;

-- Create storage bucket for files
insert into storage.buckets (id, name)
values ('chat-files', 'chat-files');

-- Set up storage policy
create policy "Chat files are publicly accessible"
on storage.objects for select
using ( bucket_id = 'chat-files' );

create policy "Authenticated users can upload files"
on storage.objects for insert
with check ( bucket_id = 'chat-files' ); 