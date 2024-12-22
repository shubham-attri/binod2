## Architecture Overview

Below is a step-by-step architectural description of how the application is structured, why each component is needed, and how each functionality is implemented. This overview integrates elements from the entire codebase, including references to Supabase (for database and API integration), Langchain (for AI and LLM orchestration), and the Lawyer/Legal “Open Canvas” or AI workflows.

---

## 1. High-Level System Layout

1. A Next.js 14 front-end (TypeScript, React) for user interaction:  
   • Provides a dual-mode legal assistant interface (Research Assistant Mode vs. Case Assistant Mode).  
   • Manages chat sessions, document operations, and case management screens.  
   • Offers UI features like file uploads, advanced search, and real-time streaming responses.

2. A Python FastAPI backend with Langchain and Anthropic integration:  
   • Exposes API endpoints to handle chat messages, store context, retrieve context, and generate LLM answers.  
   • Uses “ChatAnthropic” from Langchain Anthropic to interface with Claude.  
   • Persists chat data, document data, and case data in Supabase.  
   • Implements streaming AI responses to the front-end.

3. A Supabase instance for data storage, user authentication, Row-Level Security (RLS) policies, and serverless functions:  
   • Maintains tables for chat_contexts, chat_messages, documents, cases, and more.  
   • Enforces RLS so that each user can only view or manipulate their own data.  
   • Provides extension support (pgvector, etc.) for text embeddings and semantic search.

4. Potential Redis usage as VectorDB (mentioned in the notepad context) and/or an alternative approach to store embeddings, though the codebase also shows usage of pgvector in Supabase. In practice, embeddings can be stored either in Supabase (with “vector(1536)” columns) or in Redis Vector Store, depending on performance needs.

---

## 2. Front-End: Next.js 14 (TypeScript)

### 2.1. Overall Structure
• Implements App Router features (app directory) for routing and server-side rendering.  
• Uses TypeScript/React with Shadcn UI components.  
• Integrates AI Canvas / “Open Canvas” designs to lay out the user’s “assistant” area, document panel, search functionality, and case management screens.

### 2.2. Key Responsibilities
1. **Dual-Mode Assistant**  
   • Toggles between “Research Assistant Mode” (free-form legal research, quick citations, drafting contracts with generic artifacts) and “Case Assistant Mode” (case-specific data, client info, document attachments).  
   • Presents a unified chat UI with context-based switching.

2. **Chat UI**  
   • Renders incoming and outgoing messages in real-time.  
   • Uses streaming fetch calls (e.g., “/api/ai/stream”) to display partial AI responses.  
   • Offers syntax highlighting, markdown rendering, code block presentation, etc.

3. **Document Upload/Management**  
   • Multiple file upload with chunking.  
   • Associates documents with a user or specific case.  
   • Triggers calls to the backend to store metadata in Supabase.  
   • Provides previews and version tracking via the front-end UI.

4. **Case Management**  
   • Allows creation of new “cases,” tracking status, user info, timeline, activities, and assigned documents.  
   • Displays or filters cases with advanced search.

5. **Search & Index**  
   • Integrates advanced search (fuzzy matching, embeddings) through calls to the backend.  
   • Presents snippet highlights and relevant results in the UI.

---

## 3. Python Backend (FastAPI)

### 3.1. Main Application (examples: “backend/main.py”)
• Initializes a FastAPI instance.  
• Configures CORS middleware to allow the front-end to connect.  
• On startup, initializes Supabase connections (via “init_supabase()”).  
• Includes router modules (e.g., “chat_router”) for chat-related API endpoints.  
• Offers a health-check endpoint (GET /health).

### 3.2. Chat Service Logic (examples: “chat.py”)
1. **ChatAnthropic Integration**  
   • Imports “ChatAnthropic” from “langchain_anthropic.”  
   • Authenticates via “anthropic_api_key,” stored in settings.  
   • Configures system parameters like model name (“claude-3-opus-20240229”), max tokens, temperature, etc.

2. **Supabase for Context Storage**  
   • A “ChatService” class provides methods:  
     – “get_context(context_id)” and “create_context()” to retrieve/store chat contexts in Supabase.  
     – “add_message(context_id, message)” to track user or assistant messages.  
   • Uses asynchronous calls to the Supabase tables “chat_contexts” and “chat_messages.”

3. **Langchain Message Orchestration**  
   • “get_response(message, context)” constructs a list of messages (SystemMessage, HumanMessage) and passes to ChatAnthropic.  
   • Returns a structured “ChatMessage” with role and content.  
   • Enforces a system prompt to define the AI assistant’s persona (professional legal tone, citing sources, etc.).

### 3.3. Database Functions (examples: “functions.sql”)  
• “match_documents(query_embedding, match_count, user_id, context_id)” returns relevant documents sorted by similarity.  
• “update_document_embedding(doc_id, new_embedding)” updates vector embeddings in the “documents” table.  
• Used for semantic search to find and rank documents by closeness to a query vector.

### 3.4. API Routes (fastAPI endpoints)
• Provides route(s) for sending messages (“POST /chat/messages”), retrieving contexts (“GET /chat/contexts/{id}”), streaming responses, uploading documents, etc.  
• Ties directly into the “ChatService” methods and Supabase integration.

---

## 4. Supabase Migrations & Schema

### 4.1. Chat Context & Messages
• **Tables**: “chat_contexts” and “chat_messages.”  
• Stores conversation transcripts, linking messages to a context ID.  
• **Policies** ensure only the user who created the context can read/write messages.  
• Additional columns track created_at, updated_at, role, etc.

### 4.2. Documents Management
• “documents” table includes fields for user ownership, optional context/case references, vector(1536) embedding column, metadata, etc.  
• RLS policies restrict select/update/delete to the document’s owner (auth.uid() = user_id).  
• Indexes on user_id, context_id, embeddings for efficient lookups.

### 4.3. Cases & Case Activities
• “cases” table tracks case info, status, user ownership, and optional references to “chat_sessions.”  
• “case_activities” logs changes or events for each case.  
• Similar RLS policies and foreign-key constraints to maintain relationships.

### 4.4. Row-Level Security & Access
• The migrations define “create policy” statements so each user can only see, insert, update, or delete rows that match their user_id.  
• This ensures robust data protection for multi-tenant usage.

---

## 5. Langchain Usage  

1. **Chat Flow**  
   • Uses “ChatAnthropic” as the underlying LLM driver.  
   • Combines system instructions, user messages, and assistant messages to produce a response.  
   • Freed from lower-level token management by delegating to Langchain’s abstractions.

2. **Embedding & Vector Search**  
   • For “match_documents,” queries are turned into embeddings (via an embedding model) and then matched against the “documents” table.  
   • Alternatively, in code or additional pipelines, calls to “generateEmbedding” might come from a React front end or fastAPI route and store vectors in Supabase.

3. **Memory Handling**  
   • A conversation “context” is partially acting like a memory mechanism.  
   • The last N messages can be retrieved from Supabase to maintain context in chat responses.

---

## 6. AI “Open Canvas” or “AI Canvas” Workflows

1. **Purpose**  
   • To visualize or iterate on complex user interactions and legal documents in a more flexible whiteboard-like environment.  
   • Possibly used for advanced brainstorming, contract drafting with real-time AI suggestions.

2. **Implementation**  
   • The front-end Next.js code is designed for a dynamic, interactive UI.  
   • The backend extends typical chat flows with support for chunked streaming, multiple message roles, and context retrieval.  
   • This “Open Canvas” approach blends with standard chat to incorporate document uploads, highlights, or snippet expansions.

3. **Why We Need It**  
   • Legal workflows often involve multiple documents, references, and complex logic. An “open canvas” approach helps users track, visualize, and refine content beyond a simple text chat.

---

## 7. Document & Case Management

### 7.1. Document Handling
• Storing documents involves uploading files (via the front-end), saving metadata to Supabase, and optionally associating them to a specific case ID or chat context ID.  
• Searching and retrieving documents uses text embeddings, pg_trgm-based full-text indexes, or other search strategies.

### 7.2. Case System
• Each case has a unique ID, user reference, status, textual details, and optional attachments.  
• Ties into “chat_sessions,” so an assistant can read from relevant case documents to produce context-specific answers or summaries.

### 7.3. Why We Need This
• Legal projects typically revolve around a “case”: tracks all evidence, documents, parties, and conversation histories under one container.  
• The system surfaces relevant documents or prior messages automatically to the AI assistant.

---

## 8. Search and Metadata

1. **Full-Text Search**  
   • Achieved via Supabase’s pg_trgm extension or text pattern matching.  
   • Allows fast substring or fuzzy lookups on case titles, document names, or chat transcripts.

2. **Embedding/Vector Search**  
   • The “vector(1536)” column in the “documents” table plus a function like “match_documents” provides semantic search.  
   • Users can look for conceptually related documents, not just exact matching keywords.

3. **Why We Need Both**  
   • Full-text searches handle literal string matches.  
   • Vector search handles conceptual/semantic matches. Combining them yields a richer “legal research” experience.

---

## 9. Security & Permissions

1. **Row-Level Security (RLS) in Supabase**  
   • Ensures each user can only see and manipulate rows attached to their “auth.uid()”.  
   • Critical in a multi-tenant environment (multiple users, each with private data).  

2. **Policies**  
   • Insert, update, select, and delete policies exist for chat_contexts, chat_messages, documents, cases, etc.  
   • Example:  
     “Users can view messages from their contexts” – verifying that the user_id matches the context’s user_id.  
   • Maintains privacy and compliance for legal data.

3. **Why We Need This**  
   • Legal data must remain confidential. RLS ensures no accidental cross-user leakage.  
   • Automated enforcement of domain-level restrictions without custom application logic.

---

## 10. Putting It All Together

1. **User Flow**  
   (a) User logs into the Next.js front-end → (b) Chooses “Research” or “Case” mode → (c) Initiates chat or uploads documents → (d) Front-end sends requests to FastAPI routes → (e) FastAPI/ChatService integrates with Supabase to store or retrieve data → (f) LLM (Claude) is called via Langchain for AI responses → (g) The streaming response is returned to the front-end chat interface.

2. **Why This Works**  
   • Each piece – Next.js for advanced UX, FastAPI for flexible logic and integration, Supabase for robust data & policies, and Langchain for orchestrating AI prompts – matches the need for a secure, real-time, multi-document legal assistant environment.

3. **Extensibility**  
   • Additional features (like referencing external APIs, advanced analytics, scheduling tasks) can be layered on top.  
   • The code architecture is modular: migrations set up the DB schema, the Python backend handles domain logic, and the Next.js front-end orchestrates user interactions.

---

## Conclusion

This architecture provides a secure, scalable, and feature-rich platform for a legal AI assistant:

• Supabase manages data via a Postgres database, with row-level security and table policies for multi-tenant privacy.  
• FastAPI and Langchain-based ChatAnthropic handle the AI conversation flow, context retrieval, and streaming answers.  
• The Next.js 14 front-end offers an accessible dual-mode interface, either for broad legal research or for case-specific operations—both integrated into an “Open Canvas” style framework to handle complex workflows.  

By structuring the project in this step-by-step fashion, each critical part (chat system, document management, case handling, advanced search, and user security) interlocks tightly to support a professional legal workflow with powerful AI capabilities.



