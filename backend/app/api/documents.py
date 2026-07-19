import logging
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.schemas.document import DocumentResponse, DocumentListResponse, DocumentSummaryResponse
from app.services import document_service, embedding_service
from app.services.rag_service import generate_summary

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


def process_document_background(doc_id: str, user_id: str, db_url: str):
    """Background task to extract text and store embeddings."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return
        doc.status = DocumentStatus.processing.value
        db.commit()

        text, page_count = document_service.extract_text_from_document(doc)
        chunk_count = embedding_service.store_document_chunks(
            document_id=doc.id,
            user_id=doc.user_id,
            filename=doc.original_filename,
            text=text,
        )
        doc.status = DocumentStatus.ready.value
        doc.chunk_count = chunk_count
        doc.page_count = page_count
        db.commit()
        logger.info(f"Document {doc_id} processed: {chunk_count} chunks")
    except Exception as e:
        logger.error(f"Document processing failed for {doc_id}: {e}")
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = DocumentStatus.failed.value
            db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.core.config import settings
    doc = await document_service.save_uploaded_file(file, current_user.id, db)
    background_tasks.add_task(
        process_document_background, doc.id, current_user.id, settings.DATABASE_URL
    )
    return doc


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = document_service.get_user_documents(db, current_user.id)
    return {"documents": docs, "total": len(docs)}


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.get_document_by_id(db, document_id, current_user.id)


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = document_service.get_document_by_id(db, document_id, current_user.id)
    embedding_service.delete_document_chunks(document_id, current_user.id)
    document_service.delete_document(db, document_id, current_user.id)


@router.get("/{document_id}/summary", response_model=DocumentSummaryResponse)
def get_document_summary(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return generate_summary(db, document_id, current_user.id)
