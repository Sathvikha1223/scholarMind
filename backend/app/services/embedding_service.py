import logging
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = logging.getLogger(__name__)

_chroma_client = None
_embedding_model = None


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        if settings.CHROMA_HOST and settings.CHROMA_HOST not in ["localhost", "127.0.0.1", ""]:
            try:
                _chroma_client = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT,
                )
            except Exception as e:
                logger.warning(f"Failed to connect to Chroma host: {e}. Falling back to PersistentClient.")
                _chroma_client = chromadb.PersistentClient(path="./chroma_db_data")
        else:
            _chroma_client = chromadb.PersistentClient(path="./chroma_db_data")
    return _chroma_client


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded.")
    return _embedding_model


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into chunks with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start = end - overlap
    return chunks


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()


def store_document_chunks(
    document_id: str,
    user_id: str,
    filename: str,
    text: str,
) -> int:
    """Chunk text, embed, and store in ChromaDB. Returns chunk count."""
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=f"user_{user_id}",
        metadata={"hnsw:space": "cosine"},
    )

    chunks = chunk_text(text)
    if not chunks:
        return 0

    embeddings = generate_embeddings(chunks)

    # Parse page numbers from chunk text markers
    ids = []
    metadatas = []
    for i, chunk in enumerate(chunks):
        page_num = 1
        if "[Page " in chunk:
            try:
                page_str = chunk.split("[Page ")[1].split("]")[0]
                page_num = int(page_str)
            except (IndexError, ValueError):
                pass
        elif "[Slide " in chunk:
            try:
                slide_str = chunk.split("[Slide ")[1].split("]")[0]
                page_num = int(slide_str)
            except (IndexError, ValueError):
                pass

        ids.append(f"{document_id}_chunk_{i}")
        metadatas.append({
            "document_id": document_id,
            "filename": filename,
            "page_num": page_num,
            "chunk_index": i,
        })

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


def search_similar_chunks(
    query: str,
    user_id: str,
    document_ids: List[str] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """Embed query and search ChromaDB for similar chunks."""
    try:
        client = get_chroma_client()
        collection = client.get_or_create_collection(name=f"user_{user_id}")

        query_embedding = generate_embeddings([query])[0]

        where = None
        if document_ids:
            if len(document_ids) == 1:
                where = {"document_id": document_ids[0]}
            else:
                where = {"document_id": {"$in": document_ids}}

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count() or top_k),
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        chunks = []
        if results and results["documents"] and results["documents"][0]:
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                chunks.append({
                    "text": doc,
                    "document_id": meta.get("document_id", ""),
                    "filename": meta.get("filename", ""),
                    "page_num": meta.get("page_num", 1),
                    "score": 1 - dist,  # Convert distance to similarity
                })
        return chunks
    except Exception as e:
        logger.error(f"ChromaDB search failed: {e}")
        return []


def delete_document_chunks(document_id: str, user_id: str) -> None:
    """Remove all chunks for a document from ChromaDB."""
    try:
        client = get_chroma_client()
        collection = client.get_or_create_collection(name=f"user_{user_id}")
        collection.delete(where={"document_id": document_id})
    except Exception as e:
        logger.warning(f"Failed to delete chunks for {document_id}: {e}")
