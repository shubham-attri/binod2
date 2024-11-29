-- Add tags column to documents table if not exists
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create function to search vault items
CREATE OR REPLACE FUNCTION search_vault_items(search_query TEXT, user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  starred BOOLEAN,
  tags TEXT[],
  case_id UUID
) AS $$
BEGIN
  RETURN QUERY
    SELECT 
      c.id,
      c.title,
      'case'::TEXT as type,
      c.created_at,
      c.updated_at,
      c.starred,
      c.tags,
      NULL::UUID as case_id
    FROM cases c
    WHERE 
      c.user_id = user_id 
      AND (
        c.title ILIKE '%' || search_query || '%'
        OR c.description ILIKE '%' || search_query || '%'
        OR search_query = ANY(c.tags)
      )
    UNION ALL
    SELECT 
      d.id,
      d.title,
      'document'::TEXT as type,
      d.created_at,
      d.updated_at,
      d.starred,
      d.tags,
      d.case_id
    FROM documents d
    WHERE 
      d.user_id = user_id 
      AND (
        d.title ILIKE '%' || search_query || '%'
        OR search_query = ANY(d.tags)
      );
END;
$$ LANGUAGE plpgsql;

-- Create function to get recent vault items
CREATE OR REPLACE FUNCTION get_recent_vault_items(user_id UUID, items_limit INTEGER)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  starred BOOLEAN,
  tags TEXT[],
  case_id UUID
) AS $$
BEGIN
  RETURN QUERY
    (SELECT 
      c.id,
      c.title,
      'case'::TEXT as type,
      c.created_at,
      c.updated_at,
      c.starred,
      c.tags,
      NULL::UUID as case_id
    FROM cases c
    WHERE c.user_id = user_id
    UNION ALL
    SELECT 
      d.id,
      d.title,
      'document'::TEXT as type,
      d.created_at,
      d.updated_at,
      d.starred,
      d.tags,
      d.case_id
    FROM documents d
    WHERE d.user_id = user_id)
    ORDER BY updated_at DESC
    LIMIT items_limit;
END;
$$ LANGUAGE plpgsql; 