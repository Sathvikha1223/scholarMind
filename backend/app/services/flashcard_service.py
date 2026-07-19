import json
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.embedding_service import search_similar_chunks
from app.services.llm_service import get_llm_service
from app.models.flashcard import FlashcardDeck
from app.models.document import Document

logger = logging.getLogger(__name__)


def generate_flashcards(
    db: Session,
    document_id: str,
    user_id: str,
    num_cards: int = 10,
) -> FlashcardDeck:
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise ValueError("Document not found")

    chunks = search_similar_chunks("key concepts definitions terms", user_id, [document_id], top_k=8)
    context = "\n\n".join([c["text"] for c in chunks])[:4000]

    prompt = f"""Create exactly {num_cards} flashcards from this study material.

Content: {context}

Return a JSON array with this exact structure (no markdown, pure JSON):
[
  {{
    "front": "What is the question or term?",
    "back": "The answer or definition here."
  }}
]

Make the cards educational, concise, and test important concepts."""

    llm = get_llm_service()
    raw = llm.generate(prompt)

    try:
        clean = raw.strip()
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0]
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0]
        cards = json.loads(clean.strip())
        if not isinstance(cards, list):
            cards = []
    except json.JSONDecodeError as e:
        logger.error(f"Flashcard JSON parse error: {e}")
        cards = [{"front": "Error generating flashcards", "back": "Please try again"}]

    deck = FlashcardDeck(
        user_id=user_id,
        document_id=document_id,
        title=f"Flashcards - {doc.original_filename}",
        cards=cards,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


def get_flashcard_decks(db: Session, user_id: str, document_id: str = None) -> List[FlashcardDeck]:
    query = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == user_id)
    if document_id:
        query = query.filter(FlashcardDeck.document_id == document_id)
    return query.order_by(FlashcardDeck.created_at.desc()).all()
