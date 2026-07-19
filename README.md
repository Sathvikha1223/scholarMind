# ScholarMind: AI-Powered Personal Knowledge Assistant

ScholarMind is a production-ready, full-stack AI platform that enables users to securely upload, organize, and study their materials using Retrieval-Augmented Generation (RAG). By combining modern web architectures, secure cryptography, and local vector embeddings, ScholarMind serves as a fully isolated private knowledge companion for students and professionals.

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Retrieval-Augmented Generation (RAG) Pipeline](#%EF%B8%8F-retrieval-augmented-generation-rag-pipeline)
5. [Authentication & Workspace Authorization](#-authentication--workspace-authorization)
6. [LLM & API Key Connection Security](#-llm--api-key-connection-security)
7. [AI-Generated Study Aids](#-ai-generated-study-aids)
8. [Docker & Containerization](#-docker--containerization)
9. [API Endpoints & Swagger Documentation](#-api-endpoints--swagger-documentation)
10. [Setup & Installation Instructions](#-setup--installation-instructions)

---

## 🌟 Core Features

* **Complete Multi-Tenant Isolation**: Each user gets a fully isolated, private workspace. User documents, chat sessions, flashcards, and revision schedules are invisible to others.
* **Semantic Document Q&A (RAG)**: Chat directly with your notes, papers, slides, and source code. Receive instant answers with **precise citations** (document name and page number).
* **Automated Concept Mapping**: ScholarMind parses uploaded texts and generates visual concept mind maps using **Mermaid.js**.
* **Smart Study Planner**: Generates exam timetables using customizable break styles, adjustable through natural language commands (e.g., *"Move DBMS to tomorrow"*).
* **Analytics Center**: Tracks streaks, quiz performance, document reading usage, and active study hours.

---

## 🏗️ System Architecture

ScholarMind implements a clean, modular architecture separating the Presentation Layer (Frontend), Application Layer (FastAPI services), and Persistence Layer (PostgreSQL & ChromaDB).

```
┌──────────────────────────────────────────────────────────┐
│                    React SPA Frontend                    │
│      (Vite + TypeScript + Tailwind CSS + Mermaid.js)     │
└────────────────────────────┬─────────────────────────────┘
                             │ REST Requests (JSON / JWT)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   FastAPI Backend API                    │
│      (Routers, SlowAPI rate-limit, Pydantic Schemas)     │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴───────────────┐
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│     SQLAlchemy ORM    │        │   ChromaDB Client     │
│  (Postgres / SQLite)  │        │     (Vector DB)       │
└───────────┬───────────┘        └───────────┬───────────┘
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│ User workspaces, chat │        │ Chunked Embeddings    │
│ history, quiz cards,  │        │ (Sentence-Transformer │
│ study calendars       │        │  all-MiniLM-L6-v2)    │
└───────────────────────┘        └───────────────────────┘
```

---

## 🛠️ Technology Stack

### **Frontend**
* **Framework**: React.js with TypeScript (bundled via Vite)
* **Styling**: Tailwind CSS for responsive layouts and animations (using Framer Motion)
* **State Management**: Zustand
* **Visualizations**: Recharts (for analytics charts) and Mermaid.js (for mind maps)

### **Backend**
* **Framework**: FastAPI (Asynchronous Python endpoints)
* **ORM & Database**: SQLAlchemy (Postgres mapping) with Alembic for migrations
* **Text Parsers**: PyMuPDF (`fitz` for PDFs), python-docx (DOCX), python-pptx (PPTX)
* **Embedding Model**: Sentence Transformers (`all-MiniLM-L6-v2`)

---

## 🧠 Retrieval-Augmented Generation (RAG) Pipeline

```
  [Upload PDF] ──▶ [Extract text with page numbers] ──▶ [Chunk text]
                                                            │
  [Query] ──▶ [Embed Query] ──▶ [Cosine Similarity Search] ◀─┘
    │                                │
    ▼                                ▼
  [Google Gemini API] ◀── [Context + Prompt Injection]
    │
    ▼
  [Cited Answer Output]
```

1. **Extraction**: Uploaded documents are parsed. For PDFs, page markers (`[Page X]`) are embedded into the raw string to guarantee page-level citation tracing.
2. **Preprocessing & Chunking**: Document text is divided into sliding semantic blocks with sliding overlaps (500-character chunks, 50-character overlap) to prevent loss of context.
3. **Embedding Vectorization**: Chunks are processed locally using the `all-MiniLM-L6-v2` transformer model to create 384-dimensional dense vectors.
4. **Vector Store Indexing**: Embeddings and structural metadata (document ID, filename, page number) are stored in user-specific ChromaDB collections.
5. **Contextual Generation**: When a user queries a document, the query is embedded, relevant chunks are pulled from ChromaDB, and a context-stuffed prompt is submitted to the Gemini API.

---

## 🔒 Authentication & Workspace Authorization

ScholarMind implements secure, stateless authentication using **JSON Web Tokens (JWT)**:

* **Password Security**: Passwords are encrypted on register and verify using the **bcrypt** hashing function (via `passlib`).
* **Tokens**: Upon successful login, the backend issues an HS256-signed JWT access token.
* **Multi-Tenant Protection**: Every database query and vector store request is scoped to the user ID extracted from the authenticated token's `sub` claim. Users can never view or search another user's collection.

---

## 🔑 LLM & API Key Connection Security

ScholarMind interfaces with the **Google Gemini API** (using the fast and capable `gemini-1.5-flash` model).

* **Zero-Frontend Exposure**: The Gemini API key is loaded only in the backend via environment variables. The client browser has no access to the keys, mitigating exfiltration risks.
* **Provider Switching**: The backend employs an abstract service provider pattern (`llm_provider.py`). You can easily swap the LLM engine to OpenAI, Grok, or Claude simply by editing the environment keys without refactoring the code.

---

## 📝 AI-Generated Study Aids

* **Automatic Flashcard Generator**: Analyzes text chunks to draft vocabulary decks featuring front/back terms.
* **AI Quiz Center**: Formulates multiple-choice quizzes complete with distractors, correct answers, and text explanations formatted as structured JSON.
* **Conceptual Mind Mapping**: Instructs the LLM to output syntax-conforming Mermaid.js code blocks mapping relational ideas extracted from files.

---

## 🐳 Docker & Containerization

The system is configured to launch as an isolated cluster using Docker Compose:

1. **`postgres`**: Relational database storing credentials, chat logs, revision tables, and events.
2. **`chromadb`**: Vector store hosting index maps.
3. **`backend`**: FastAPI application hosting the services.
4. **`frontend`**: Nginx/Node container serving the React single-page application.

*Networking is automatically bridged via a custom internal network `scholarmind_network` so that database credentials and hostnames are not exposed externally.*

---

## 📌 API Endpoints & Swagger Documentation

FastAPI automatically parses Pydantic models to compile OpenAPI documentation. With the backend running, you can access interactive documentation at `http://localhost:8000/docs` (or `/redoc`):

* **`/api/v1/auth`**: User registration, login, and profile fetching.
* **`/api/v1/documents`**: Workspace file upload, collection lookup, and deletion.
* **`/api/v1/chat`**: Thread creation, citation-rich Q&A, mind map generation, and summaries.
* **`/api/v1/quizzes` & `/api/v1/flashcards`**: Dynamic study aid generation endpoints.
* **`/api/v1/revision`**: Study schedule creation and NLP calendar commands.
* **`/api/v1/analytics`**: Learning dashboard statistics.

---

## 🚀 Setup & Installation Instructions

### Running Locally (Without Docker)

If you do not have Docker installed, follow these steps to run bare-metal using SQLite:

1. **Clone & Open Project Workspace**:
   ```bash
   cd "C:\Users\Sathvikha Manish\.gemini\antigravity\scratch\scholarmind"
   ```

2. **Configure Environment Variable**:
   * Open `backend/.env` in a text editor and add your API key:
     ```env
     GEMINI_API_KEY=your-actual-gemini-key-from-ai-studio
     DATABASE_URL=sqlite:///./scholarmind.db
     CHROMA_HOST=
     ```

3. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --port 8000
   ```

4. **Start Frontend (In a New Terminal)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*
