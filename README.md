## Binod 2 

This is a full stack application for legal domain inspired by "HARVEY" or "LEGALFLY". 
I am trying to build this product to understand for building a domain which will only care about the output of the application, so understanding another domain of people will be an interesting approach for me, and then how can i use deep tech and innovate on the backend part on how the reasoning and functionality is working would be interesting. Designing my own architecture for queries, caching, and how i use the agentic workflows will be interesting to see. 

This will help me understand what a good UX is, and also if you want to innovate on the backend how you do that and building a simple product can be so interesting. 

If my agentic workflow will be better and optimal for a particular use-case will be interesting. The purpose is that i will gain and acquire knowledge for solving a problem that i will have no idea about and how i approach to it, what new i've learned which doesn't exist out there will also be interesting. 

I intend to implement things in the backend with as much control as I can, because the frontend element parts will just be taken care of. 

### What is Agent Binod
Legal Works require a load of paperwork. There are paralegals and there are lawyers, their tasks can be broken down into  3 subtasks, "ANALYSE", "RESEARCH" and "DRAFT". 

And every line on the contracts or in the legal domains can be cited. 

This is the insight and the thesis on which Agent Binod is being build. It will help you analyse contracts/documents, now the research is all about how good of a search engine do you have for retrieval and drafting is how cited and backed each of your line in contract. 

### How I am approaching building this 

I'll focus on the 3 things for building agentic workflows:
- how good my agent can reason
- how good my agent can retrieve 
- how good my agent can draft

but there is also one thing which is important which is
how good the ingestion of information process is.  

Now, we break it down into simpler step by step approach. 

#### Ingestion
Documents and information will be ingested and will be multimodal, like handwritten notes, long contract papers, company financials, party information, can have hearing recordings or personal lawyer can have settlement evidences.

#### Reasoning
This will be approached by chain of thoughts and understanding every bit of information and making how relevant one thing is to another, as the information grows on a subject how do we keep the memory and not provide wrong information.

There is an interesting approach which suggests that you can make bigger pretrained models fine tune on smaller amount of long chain data, as is if we can give good enough data to how reasoning is done we can get great results. 

We answer questions, some internally to mimic reason and some to help the person using it reason.

#### Retrieval 
Whatever reason or node we have, we will back it by articles, or laws or cases, the good thing about legal domain is that everything needs to be documented, and every line is relevant.

#### Draft
This step is where, how we organise and write down things backed by each statement and reasoning will help us, this is the goal for someone using it, here we are a mere tool. We don't make what is right or what is wrong we have set of rules and understanding and citations, we use them and break down every bit of necessary information in the way it should be. 

There are templates for each type of document draft, the more people will use the more we'll learn. 

### Software
We have to use the approach of SOFTWARE 2.0, where we have to write code, as it grows it get's better. The more code write itselves from what people using it are telling the better it is.

### Project Structure

```
binod2/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── chat/                 # Chat page and components
│   ├── history/              # History page and components
│   ├── layout.tsx            # Root layout with global styles
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
│
├── components/               # React components
│   ├── chat/                 # Chat-related components
│   ├── layout/               # Layout components (sidebar, etc.)
│   ├── shared/               # Shared UI components
│   ├── features/             # Feature-specific components
│   ├── history/              # History-related components
│   ├── hooks/                # Custom React hooks
│   └── ui/                   # Base UI components
│
├── lib/                      # Utility functions and services
│   ├── api/                  # API client and endpoints
│   ├── supabase/            # Supabase client and database operations
│   ├── utils/               # Utility functions
│   ├── hooks/               # Shared hooks
│   └── constants/           # Constants and configurations
│
└── backend/                 # Python backend service
    ├── app/                 # FastAPI application
    ├── venv/               # Python virtual environment
    ├── docker-compose.yml  # Docker compose configuration
    └── requirements.txt    # Python dependencies
```

### Key Components and Their Responsibilities

#### Frontend Components
- `components/chat/`: Contains all chat-related components including the main chat interface, message components, and chat settings
- `components/layout/`: Layout components like sidebar and main layout structure
- `components/shared/`: Reusable UI components used across the application
- `components/features/`: Feature-specific components that implement particular functionality
- `components/ui/`: Base UI components using shadcn/ui

#### App Directory Structure
- `app/api/`: Next.js API routes for handling backend requests
- `app/chat/`: Chat page implementation and related components
- `app/history/`: History page implementation and related components
- `app/layout.tsx`: Root layout with global styles and providers
- `app/page.tsx`: Landing page with chat input

#### Library Structure
- `lib/api/`: API client implementation and endpoint definitions
- `lib/supabase/`: Supabase client configuration and database operations
- `lib/utils/`: Utility functions and helpers
- `lib/hooks/`: Shared React hooks
- `lib/constants/`: Application constants and configurations

### Implementation Details

#### Frontend Architecture
1. **Component Organization**
   - Components are organized by feature and responsibility
   - Shared components are separated from feature-specific ones
   - UI components use shadcn/ui for consistent styling

2. **State Management**
   - Uses React hooks for local state management
   - Supabase for real-time data and persistence
   - Context API for global state when needed

3. **Routing**
   - Next.js App Router for file-based routing
   - API routes for backend communication
   - Dynamic routes for chat and history pages

#### Backend Architecture (Future Implementation)
1. **API Design**
   - RESTful endpoints for document operations
   - WebSocket support for real-time chat
   - Authentication and authorization

2. **Database Design**
   - Supabase for user data and chat history
   - Document storage and retrieval
   - Real-time subscriptions

3. **AI Integration**
   - Document analysis pipeline
   - Research and retrieval system
   - Contract drafting system

### Development Guidelines

1. **Code Style**
   - TypeScript for type safety
   - ESLint and Prettier for code formatting
   - Component-based architecture

2. **Testing**
   - Unit tests for components
   - Integration tests for features
   - E2E tests for critical flows

3. **Documentation**
   - JSDoc for component documentation
   - README files for major features
   - API documentation

4. **Performance**
   - Code splitting and lazy loading
   - Image optimization
   - Caching strategies

### Getting Started

1. **Prerequisites**
   - Node.js 18+
   - Python 3.8+
   - Docker (for backend)

2. **Installation**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Development**
   ```bash
   # Frontend
   npm run dev
   
   # Backend
   cd backend
   uvicorn app.main:app --reload
   ```

4. **Building for Production**
   ```bash
   # Frontend
   npm run build
   
   # Backend
   docker-compose up --build
   ```

