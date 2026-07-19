import logging
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.services.embedding_service import search_similar_chunks
from app.services.llm_service import get_llm_service
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document

logger = logging.getLogger(__name__)

MODE_PROMPTS = {
    "beginner": "Explain in simple terms suitable for a complete beginner. Use analogies and avoid jargon.",
    "intermediate": "Explain clearly at an intermediate level, assuming basic knowledge of the subject.",
    "advanced": "Provide a technically detailed, advanced-level explanation with depth.",
    "interview": "Answer as if preparing for a technical interview. Include key points, common pitfalls, and example answers.",
}


def _build_rag_prompt(query: str, context_chunks: List[Dict], mode: str = "intermediate") -> str:
    mode_instruction = MODE_PROMPTS.get(mode, MODE_PROMPTS["intermediate"])
    
    context_text = ""
    for i, chunk in enumerate(context_chunks):
        context_text += (
            f"\n--- Source {i+1}: {chunk['filename']} (Page {chunk['page_num']}) ---\n"
            f"{chunk['text']}\n"
        )

    return f"""You are ScholarMind, an expert AI study assistant. Answer the user's question using ONLY the provided document context below.

INSTRUCTIONS:
- {mode_instruction}
- Base your answer strictly on the provided context.
- If the answer cannot be found in the context, say so clearly.
- At the end of your answer, list the sources you used as citations in this format: [Source: <filename>, Page <page_num>]
- Format your response using markdown for clarity (headers, bullet points, code blocks where appropriate).

DOCUMENT CONTEXT:
{context_text}

USER QUESTION: {query}

ANSWER:"""


def answer_question(
    db: Session,
    user_id: str,
    session_id: str,
    query: str,
    document_ids: List[str] = None,
    mode: str = "intermediate",
) -> Dict[str, Any]:
    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=query,
        citations=[],
    )
    db.add(user_msg)
    db.commit()

    # Retrieve relevant chunks
    chunks = search_similar_chunks(query, user_id, document_ids, top_k=5)

    # Build prompt and call LLM
    prompt = _build_rag_prompt(query, chunks, mode)
    llm = get_llm_service()
    answer = llm.generate(prompt)

    # Extract citations from retrieved chunks
    citations = []
    seen = set()
    for chunk in chunks:
        key = (chunk["filename"], chunk["page_num"])
        if key not in seen:
            seen.add(key)
            citations.append({
                "document_name": chunk["filename"],
                "page_num": chunk["page_num"],
                "chunk_text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
            })

    # Update session title if it's the first message
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        messages_count = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).count()
        if messages_count <= 2 and session.title == "New Chat":
            session.title = query[:60] + ("..." if len(query) > 60 else "")
            db.commit()

    # Save assistant message
    ai_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=answer,
        citations=citations,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return {
        "id": ai_msg.id,
        "session_id": session_id,
        "role": "assistant",
        "content": answer,
        "citations": citations,
        "created_at": ai_msg.created_at,
    }


def generate_summary(db: Session, document_id: str, user_id: str) -> Dict[str, Any]:
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        return {"summary": "Document not found.", "key_topics": [], "word_count": 0}

    chunks = search_similar_chunks(
        "main topics key concepts summary overview",
        user_id,
        [document_id],
        top_k=8,
    )

    context = "\n\n".join([c["text"] for c in chunks])
    prompt = f"""You are an expert study assistant. Generate a comprehensive summary of the following document content.

Document: {doc.original_filename}

Content:
{context}

Provide:
1. A 3-5 paragraph executive summary
2. A list of 5-10 key topics covered
3. Important definitions or concepts

Format with markdown."""

    llm = get_llm_service()
    summary = llm.generate(prompt)

    topics_prompt = f"""From this document content, extract exactly 8 key topics as a comma-separated list (no numbering, just the topic names):
{context[:2000]}

Topics:"""
    topics_text = llm.generate(topics_prompt)
    topics = [t.strip() for t in topics_text.split(",") if t.strip()][:8]

    return {
        "document_id": document_id,
        "summary": summary,
        "key_topics": topics,
        "word_count": len(context.split()),
    }


def generate_mindmap_mermaid(db: Session, document_id: str, user_id: str) -> str:
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        return "graph TD\n    A[Document Not Found]"

    chunks = search_similar_chunks(
        "main concepts relationships topics structure",
        user_id,
        [document_id],
        top_k=5,
    )
    context = "\n\n".join([c["text"] for c in chunks])[:3000]

    prompt = f"""Generate a Mermaid.js mindmap diagram showing the key concepts and their relationships from this document content.

Document: {doc.original_filename}
Content: {context}

Rules:
- Use the mindmap syntax starting with: mindmap
- Root node should be the document topic
- Maximum 3 levels deep
- Maximum 15 nodes total
- Keep node labels short (max 4 words)
- Return ONLY the mermaid code, no explanation

Example format:
mindmap
  root((Main Topic))
    Concept A
      Sub-concept 1
      Sub-concept 2
    Concept B
      Sub-concept 3"""

    llm = get_llm_service()
    result = llm.generate(prompt)

    # Extract only the mermaid code block
    if "```" in result:
        lines = result.split("```")
        for i, block in enumerate(lines):
            if block.strip().startswith("mindmap") or block.strip().startswith("graph"):
                return block.strip()
    
    if result.strip().startswith("mindmap") or result.strip().startswith("graph"):
        return result.strip()

    return f"mindmap\n  root(({doc.original_filename[:30]}))\n    Topics\n      See document for details"
