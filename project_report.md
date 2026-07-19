# ScholarMind: System Architecture & GitHub Project Report

ScholarMind is a production-ready, full-stack AI-Powered Personal Knowledge Assistant that enables users to securely upload, organize, and interact with study materials using Retrieval-Augmented Generation (RAG).

## Key Features

1. **Secure JWT Authentication**: Sign-up and login with password hashing (`bcrypt`), isolating workspaces per user.
2. **Dynamic Document Parser**: Extracts content from PDF (with page marker tracking via `PyMuPDF`), DOCX, PPTX, TXT, MD, and source code files.
3. **High-Performance RAG Pipeline**: Chunks documents, generates embeddings (`all-MiniLM-L6-v2`), indexes vectors in ChromaDB, and performs semantic search queries.
4. **LLM Provider Isolation**: Integrates the Google Gemini API securely on the backend while allowing drop-in switches (e.g., OpenAI).
5. **AI Study Tools**: Features custom chatbots, JSON quiz generation, flashcards, and automated Mermaid.js conceptual mind maps.
6. **Smart Revision Planner**: Evaluates exams/dates to generate timetables modifiable via natural language commands.
7. **Analytics Dashboard**: Renders study patterns, scores, strengths, and weaknesses using interactive charts.


## Technical Stack

* **Frontend**: React (TypeScript), Vite, Tailwind CSS, Lucide Icons, Recharts, Mermaid.js
* **Backend**: FastAPI (Python), SQLAlchemy ORM, Pydantic, Alembic
* **Databases**: SQLite / PostgreSQL (Relational metadata), ChromaDB (Vector store)
* **Embedding Model**: Sentence-Transformers (`all-MiniLM-L6-v2`)

