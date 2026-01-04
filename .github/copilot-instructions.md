  # Copilot Instructions for AI Codebase

  ## Project Overview
  This project is an AI-powered web application built on Cloudflare that demonstrates LLM orchestration, workflow coordination, and persistent conversational memory.

  **Purpose**
  Build a minimal but production-ready AI application that satisfies Cloudflare's AI assignment requirements, with a focus on correctness, clarity, and architecture rather than UI complexity.

  **Main Goals**
  - Accept user input (text-based chat)
  - Generate AI responses using an external LLM (Google Gemini)
  - Maintain per-session conversational memory
  - Use Cloudflare-native primitives for orchestration and state

  **Tech Stack**
  - Cloudflare Workers (TypeScript)
  - Durable Objects (stateful memory)
  - Cloudflare Pages (frontend)
  - Google Gemini API (external LLM)
  - No traditional backend servers
  - No external databases

  ---

  ## Architecture & Key Components

  ### High-Level Architecture

  ```
  Frontend (Cloudflare Pages)
  → Cloudflare Worker (API + orchestration)
  → Durable Object (session memory)
  → Google Gemini API (LLM inference)
  ```

  ### Components

  - **Worker API**
    - Entry point for all client requests
    - Validates input
    - Routes requests to the correct Durable Object instance
    - Calls the Gemini API
    - Returns responses to the client
    - Location: `src/worker.ts`

  - **Durable Object: ChatSession**
    - Maintains per-session conversational history
    - Persists memory using `state.storage`
    - Acts as the stateful core of the application
    - Location: `src/chatSession.ts`

  - **Frontend**
    - Minimal chat UI
    - Generates and stores a sessionId in `localStorage`
    - Sends user messages to the Worker API
    - Displays AI responses
    - Location: `frontend/index.html`

  ### Data Flow
  1. User submits a message from the frontend
  2. Frontend sends `{ sessionId, userInput }` to the Worker API
  3. Worker routes the request to the matching Durable Object
  4. Durable Object:
    - Loads conversation history
    - Appends user input
    - Calls Gemini with full context
    - Stores updated history
  5. AI response is returned to the frontend

  ---

  ## Development Workflows

  ### Build
  ```bash
  npm run build
  ```

  ### Test
  ```bash
  npm run test
  ```

  ### Run/Deploy
  ```bash
  # Local development with Wrangler
  npm run dev

  # Deploy to Cloudflare
  npm run deploy
  ```

  ---

  ## Code Conventions

  ### Durable Object Pattern
  - Instantiate via `env.CHAT_SESSION.get(sessionId)` in the Worker
  - Call `stub.fetch()` to invoke methods
  - Use `state.storage` for persistence
  - Example: `src/chatSession.ts` implements the RPC-style interface

  ### Message Format
  Client requests to the Worker API:
  ```json
  {
    "sessionId": "string (UUID or generated ID)",
    "userInput": "string"
  }
  ```

  Response format:
  ```json
  {
    "sessionId": "string",
    "userInput": "string",
    "aiResponse": "string",
    "history": [{"role": "user|assistant", "content": "string"}]
  }
  ```

  ### Environment Variables
  - `GEMINI_API_KEY`: Google Gemini API key (set in `wrangler.toml` secrets)
  - `CHAT_SESSION`: Durable Object binding (defined in `wrangler.toml`)

  ---

  ## Integration Points

  ### Google Gemini API
  - Called from the Durable Object with full conversation history as context
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
  - Response parsed for `text` content from the first choice

  ### Cloudflare Pages (Frontend)
  - Static HTML served from `frontend/` directory
  - Communicates exclusively through fetch requests to the Worker API
  - Session ID persisted in browser `localStorage` as `chatSessionId`

  ---

  ## Key Files & Directories
  - `src/worker.ts`: Main Worker entry point and API routes
  - `src/chatSession.ts`: Durable Object class for session state
  - `frontend/index.html`: Chat UI and client-side logic
  - `wrangler.toml`: Cloudflare Workers configuration and bindings
  - `package.json`: Dependencies and build scripts

  ---

  ## Important Notes
  - **Stateless Workers + Stateful Durable Objects**: The architecture separates concerns—Workers are ephemeral request handlers, while Durable Objects provide guaranteed single-instance execution and storage.
  - **No backend database**: Conversation history is stored in Durable Object state. Each session has its own isolated storage.
  - **Context window management**: When calling Gemini, the full conversation history is sent. Consider implementing a "summarize old messages" strategy if conversations grow very long.
