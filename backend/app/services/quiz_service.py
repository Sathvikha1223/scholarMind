import json
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.embedding_service import search_similar_chunks
from app.services.llm_service import get_llm_service
from app.models.document import Document
from app.models.quiz import QuizAttempt

logger = logging.getLogger(__name__)


def generate_quiz(
    db: Session,
    document_id: str,
    user_id: str,
    quiz_type: str = "mcq",
    num_questions: int = 5,
    difficulty: str = "medium",
) -> List[Dict[str, Any]]:
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        return []

    chunks = search_similar_chunks("key concepts facts definitions", user_id, [document_id], top_k=6)
    context = "\n\n".join([c["text"] for c in chunks])[:4000]

    if quiz_type == "mcq":
        prompt = f"""Generate exactly {num_questions} multiple choice questions at {difficulty} difficulty from this content.

Content: {context}

Return a JSON array with this exact structure (no markdown, pure JSON):
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Brief explanation",
    "type": "mcq"
  }}
]"""
    elif quiz_type == "short_answer":
        prompt = f"""Generate exactly {num_questions} short answer questions at {difficulty} difficulty from this content.

Content: {context}

Return a JSON array with this exact structure (no markdown, pure JSON):
[
  {{
    "question": "Question text here?",
    "options": null,
    "correct_answer": "Expected answer here",
    "explanation": "Brief explanation",
    "type": "short_answer"
  }}
]"""
    else:  # fill_blank
        prompt = f"""Generate exactly {num_questions} fill-in-the-blank questions at {difficulty} difficulty from this content.

Content: {context}

Return a JSON array with this exact structure (no markdown, pure JSON):
[
  {{
    "question": "The process of _____ is used to convert...",
    "options": null,
    "correct_answer": "the missing word",
    "explanation": "Brief explanation",
    "type": "fill_blank"
  }}
]"""

    llm = get_llm_service()
    raw = llm.generate(prompt)

    # Parse JSON from response
    try:
        # Clean up markdown code blocks if present
        clean = raw.strip()
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0]
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0]
        questions = json.loads(clean.strip())
        return questions if isinstance(questions, list) else []
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse quiz JSON: {e}\nRaw: {raw[:500]}")
        return []


def save_quiz_attempt(
    db: Session,
    user_id: str,
    document_id: str,
    quiz_type: str,
    questions_data: List[dict],
    score: float,
    total_questions: int,
) -> QuizAttempt:
    attempt = QuizAttempt(
        user_id=user_id,
        document_id=document_id,
        quiz_type=quiz_type,
        score=score,
        total_questions=total_questions,
        questions_data=questions_data,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def get_quiz_history(db: Session, user_id: str) -> List[QuizAttempt]:
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.submitted_at.desc())
        .all()
    )
