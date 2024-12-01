-- Function to match documents based on embedding similarity
create or replace function match_documents(
    query_embedding vector(1536),
    match_count int,
    user_id uuid,
    context_id uuid default null
)
returns table (
    id uuid,
    content text,
    similarity float
)
language plpgsql
security definer
as $$
begin
    return query
    select
        d.id,
        d.content,
        1 - (d.embedding <=> query_embedding) as similarity
    from documents d
    where
        d.user_id = match_documents.user_id
        and (
            match_documents.context_id is null
            or d.context_id = match_documents.context_id
        )
    order by d.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Function to update document embeddings
create or replace function update_document_embedding(
    doc_id uuid,
    new_embedding vector(1536)
)
returns void
language plpgsql
security definer
as $$
begin
    update documents
    set
        embedding = new_embedding,
        updated_at = now()
    where id = doc_id
    and user_id = auth.uid(); -- Only allow updating own documents
end;
$$;

-- Function to search across all user documents
create or replace function search_documents(
    search_query text,
    user_id uuid,
    limit_count int default 10
)
returns table (
    id uuid,
    title text,
    content text,
    context_id uuid,
    similarity float
)
language plpgsql
security definer
as $$
begin
    return query
    select
        d.id,
        d.title,
        d.content,
        d.context_id,
        ts_rank_cd(
            to_tsvector('english', d.content),
            plainto_tsquery('english', search_query)
        ) as similarity
    from documents d
    where
        d.user_id = search_documents.user_id
        and to_tsvector('english', d.content) @@ plainto_tsquery('english', search_query)
    order by similarity desc
    limit limit_count;
end;
$$; 