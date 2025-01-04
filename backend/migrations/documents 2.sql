-- Create documents table if not exists
CREATE TABLE IF NOT EXISTS documents (
    id uuid primary key,
    title text not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    user_id uuid references auth.users(id) not null,
    file_path text not null,
    file_type text,
    file_size integer,
    metadata jsonb default '{}'::jsonb
);

-- Add new columns
ALTER TABLE documents 
    ADD COLUMN IF NOT EXISTS mode text,
    ADD COLUMN IF NOT EXISTS folder_path text;

-- Add mode constraint
ALTER TABLE documents 
    ADD CONSTRAINT documents_mode_check 
    CHECK (mode IN ('research', 'case'));

-- Add RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can access research documents" ON documents;

-- Create updated policies
CREATE POLICY "Users can access their documents"
    ON documents FOR ALL
    USING (
        auth.uid() = user_id 
        AND (mode = 'research' OR mode IS NULL)
    );

-- Storage policies
DROP POLICY IF EXISTS "Users can access their research files" ON storage.objects;

CREATE POLICY "Users can access their files"
    ON storage.objects FOR ALL 
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND (
            (storage.foldername(name))[2] = 'research'
            OR (storage.foldername(name))[2] = 'case'
        )
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_mode ON documents(user_id, mode);
CREATE INDEX IF NOT EXISTS idx_documents_folder_path ON documents(folder_path); 