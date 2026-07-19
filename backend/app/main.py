import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.api import auth, documents, chat, quiz, flashcards, revision, analytics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting ScholarMind backend...")
    import app.models  # noqa: F401 — ensure all models are imported for Alembic/create_all
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified.")
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Upload directory ready: {settings.UPLOAD_DIR}")
    yield
    # Shutdown
    logger.info("ScholarMind backend shutting down.")


app = FastAPI(
    title="ScholarMind API",
    description="AI-Powered Personal Knowledge Assistant — RAG-based document Q&A, quiz generation, flashcards, revision planning, and analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


# Health check
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "ScholarMind API", "version": "1.0.0"}


# Include all routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(quiz.router, prefix="/api/v1")
app.include_router(flashcards.router, prefix="/api/v1")
app.include_router(revision.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
