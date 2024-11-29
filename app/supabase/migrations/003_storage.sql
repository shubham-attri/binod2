-- Create storage bucket for case documents
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false);

-- Create storage policies
create policy "Users can upload their own case documents"
on storage.objects for insert
with check (
  auth.uid() = owner and 
  bucket_id = 'case-documents' and
  -- Ensure case_id exists and belongs to user
  (storage.foldername(name))[1] in (
    select id::text from cases where user_id = auth.uid()
  )
);

create policy "Users can view their own case documents"
on storage.objects for select
using (
  auth.uid() = owner and
  bucket_id = 'case-documents' and
  -- Allow access if user owns the case
  (storage.foldername(name))[1] in (
    select id::text from cases where user_id = auth.uid()
  )
);

create policy "Users can delete their own case documents"
on storage.objects for delete
using (
  auth.uid() = owner and
  bucket_id = 'case-documents'
); 