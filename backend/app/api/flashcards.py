from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.flashcard import FlashcardGenerateRequest, FlashcardDeckResponse
from app.services import flashcard_service, analytics_service

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


@router.post("/generate", response_model=FlashcardDeckResponse, status_code=201)
def generate_flashcards(
    data: FlashcardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deck = flashcard_service.generate_flashcards(
        db=db,
        document_id=data.document_id,
        user_id=current_user.id,
        num_cards=data.num_cards,
    )
    analytics_service.log_event(db, current_user.id, "flashcards_generated", {"document_id": data.document_id})
    return deck


@router.get("/", response_model=List[FlashcardDeckResponse])
def list_flashcard_decks(
    document_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return flashcard_service.get_flashcard_decks(db, current_user.id, document_id)


@router.get("/{document_id}", response_model=List[FlashcardDeckResponse])
def get_flashcards_by_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return flashcard_service.get_flashcard_decks(db, current_user.id, document_id)
