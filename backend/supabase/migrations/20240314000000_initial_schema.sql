-- First, drop existing tables if they exist (optional, be careful with this in production!)
DROP TABLE IF EXISTS case_activities CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_contexts CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS research_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create Cases table first (since it's referenced by other tables)
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Then create Chat Contexts
CREATE TABLE IF NOT EXISTS chat_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Changed from context_id to id for consistency
    user_id UUID NOT NULL REFERENCES auth.users(id),
    case_id UUID REFERENCES cases(id),
    mode TEXT NOT NULL CHECK (mode IN ('research', 'case')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Then Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Changed from message_id to id for consistency
    session_id UUID NOT NULL REFERENCES chat_contexts(id) ON DELETE CASCADE, -- Changed from context_id to session_id
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Then Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Changed from document_id to id for consistency
    user_id UUID NOT NULL REFERENCES auth.users(id),
    case_id UUID REFERENCES cases(id),
    session_id UUID REFERENCES chat_contexts(id), -- Changed from context_id to session_id
    title TEXT NOT NULL,
    content TEXT,
    content_vector vector(1536),
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Finally Case Activities
CREATE TABLE IF NOT EXISTS case_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Add research_session table to track research sessions
CREATE TABLE IF NOT EXISTS research_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Update documents table to handle research mode better
ALTER TABLE documents ADD COLUMN IF NOT EXISTS research_session_id UUID REFERENCES research_sessions(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT CHECK (document_type IN ('research', 'case'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_path TEXT; -- For organization
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[]; -- For categorization

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cases"
    ON cases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases"
    ON cases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat contexts"
    ON chat_contexts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat contexts"
    ON chat_contexts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages from their sessions"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM chat_contexts
            WHERE chat_contexts.id = chat_messages.session_id
              AND chat_contexts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their sessions"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM chat_contexts
            WHERE chat_contexts.id = chat_messages.session_id
              AND chat_contexts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can view their own research sessions"
    ON research_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own research sessions"
    ON research_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_chat_contexts_user_id ON chat_contexts(user_id);
CREATE INDEX idx_chat_contexts_case_id ON chat_contexts(case_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_session_id ON documents(session_id);
CREATE INDEX idx_case_activities_case_id ON case_activities(case_id);

-- Vector similarity search index
CREATE INDEX idx_documents_content_vector ON documents USING ivfflat (content_vector vector_cosine_ops)
    WITH (lists = 100);

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_chat_contexts_updated_at
    BEFORE UPDATE ON chat_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create users table with proper schema
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view their own data"
    ON public.users FOR ALL
    USING (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();