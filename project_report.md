# ScholarMind: System Architecture & GitHub Project Report

ScholarMind is a production-ready, full-stack AI-Powered Personal Knowledge Assistant that enables users to securely upload, organize, and interact with study materials using Retrieval-Augmented Generation (RAG).

## 🚀 Key Features

1. **Secure JWT Authentication**: Sign-up and login with password hashing (`bcrypt`), isolating workspaces per user.
2. **Dynamic Document Parser**: Extracts content from PDF (with page marker tracking via `PyMuPDF`), DOCX, PPTX, TXT, MD, and source code files.
3. **High-Performance RAG Pipeline**: Chunks documents, generates embeddings (`all-MiniLM-L6-v2`), indexes vectors in ChromaDB, and performs semantic search queries.
4. **LLM Provider Isolation**: Integrates the Google Gemini API securely on the backend while allowing drop-in switches (e.g., OpenAI).
5. **AI Study Tools**: Features custom chatbots, JSON quiz generation, flashcards, and automated Mermaid.js conceptual mind maps.
6. **Smart Revision Planner**: Evaluates exams/dates to generate timetables modifiable via natural language commands.
7. **Analytics Dashboard**: Renders study patterns, scores, strengths, and weaknesses using interactive charts.

---

## 🛠️ Technical Stack

* **Frontend**: React (TypeScript), Vite, Tailwind CSS, Lucide Icons, Recharts, Mermaid.js
* **Backend**: FastAPI (Python), SQLAlchemy ORM, Pydantic, Alembic
* **Databases**: SQLite / PostgreSQL (Relational metadata), ChromaDB (Vector store)
* **Embedding Model**: Sentence-Transformers (`all-MiniLM-L6-v2`)

---

## 📁 Repository Structure

Your workspace contains the following files, organized for clean architecture:

```
scholarmind/
├── docker-compose.yml       # Docker environment orchestrator
├── README.md                # Main repository README
├── project_report.md        # Detailed system report
├── backend/
│   ├── Dockerfile           # Python runner image configuration
│   ├── requirements.txt     # Python dependencies
│   ├── test_backend.py      # System mock test suite
│   ├── .env.example         # Template for environment keys
│   └── app/
│       ├── main.py          # FastAPI application entrypoint
│       ├── core/            # Configs, security, JWT
│       ├── db/              # SQLAlchemy connection sessions
│       ├── models/          # Relational tables
│       ├── schemas/         # Pydantic schemas
│       ├── api/             # API routes (auth, chat, etc.)
│       └── services/        # RAG pipelines, planning, AI providers
└── frontend/
    ├── Dockerfile           # Frontend container configurations
    ├── package.json         # Node.js dependencies
    ├── vite.config.ts       # Vite bundler options
    ├── tailwind.config.js   # Style customizer
    ├── index.html           # SPA root HTML template
    └── src/
        ├── App.tsx          # Single Page Application core
        ├── main.tsx         # React root renderer
        ├── index.css        # Stylesheet & Tailwind directives
        ├── components/      # UI components (e.g. Mindmap)
        ├── context/         # Auth contexts
        ├── services/        # Backend API integration clients
        └── types/           # TS Interfaces
```

---

## 📝 How to Put This Project on GitHub

Run the following commands in your terminal from the root folder (`C:\Users\Sathvikha Manish\.gemini\antigravity\scratch\scholarmind`) to upload this project to your GitHub account:

### 1. Initialize Git Repository
```bash
git init
```

### 2. Create a `.gitignore` File
Ensure temporary runtime files and secrets are never committed. Create a `.gitignore` file with:
```text
# Python
__pycache__/
*.pyc
.venv/
backend/chroma_db_data/
backend/uploads/
backend/scholarmind.db

# Node.js
frontend/node_modules/
frontend/dist/

# Environments
.env
backend/.env
frontend/.env
```

### 3. Commit the Files
```bash
git add .
git commit -m "Initial commit: Complete ScholarMind Full-Stack RAG application"
```

### 4. Create a Repository on GitHub
Go to [github.com/new](https://github.com/new), name your repository `scholarmind`, and click **Create repository**.

### 5. Link and Push to GitHub
Copy the commands from your GitHub page and run them:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scholarmind.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username).*
