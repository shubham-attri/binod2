-- Create user buckets
CREATE OR REPLACE FUNCTION create_user_bucket()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a bucket for the new user
    INSERT INTO storage.buckets (id, name)
    VALUES (
        'user_' || NEW.id,
        'User ' || NEW.email || ' Documents'
    )
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create bucket when new user is created
CREATE TRIGGER create_user_bucket_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_bucket();

-- Update documents table to include folder structure
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('research', 'case'));

-- Update storage policies for hierarchical structure
CREATE POLICY "Users can access their bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'user_' || auth.uid()::text
);

-- Add indexes for better performance
CREATE INDEX idx_documents_folder_path ON documents(folder_path);
CREATE INDEX idx_documents_mode ON documents(mode); 