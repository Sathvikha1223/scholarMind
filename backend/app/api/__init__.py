from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.quiz import router as quiz_router
from app.api.flashcards import router as flashcards_router
from app.api.revision import router as revision_router
from app.api.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "documents_router",
    "chat_router",
    "quiz_router",
    "flashcards_router",
    "revision_router",
    "analytics_router",
]
