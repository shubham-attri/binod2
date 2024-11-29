-- Development policies for local testing
CREATE POLICY "Enable insert access for development user"
  ON cases FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

CREATE POLICY "Enable select access for development user"
  ON cases FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

CREATE POLICY "Enable update access for development user"
  ON cases FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Add development user if it doesn't exist
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'dev@example.com')
ON CONFLICT (id) DO NOTHING; 