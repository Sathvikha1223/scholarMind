import chromadb
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.embedding_service import embedding_service

class VectorStoreService:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if settings.CHROMA_HOST and settings.CHROMA_HOST != "localhost":
                try:
                    self._client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
                except Exception as e:
                    print(f"Failed to connect to remote Chroma DB at {settings.CHROMA_HOST}: {e}. Falling back to PersistentClient.")
                    self._client = chromadb.PersistentClient(path="./chroma_db_data")
            else:
                self._client = chromadb.PersistentClient(path="./chroma_db_data")
        return self._client

    def get_or_create_collection(self, collection_name: str):
        # We handle embeddings manually using our sentence-transformers service
        return self.client.get_or_create_collection(name=collection_name)

    def add_documents(
        self, 
        collection_name: str, 
        ids: List[str], 
        texts: List[str], 
        metadatas: List[Dict[str, Any]],
        embeddings: Optional[List[List[float]]] = None
    ):
        if embeddings is None:
            embeddings = embedding_service.get_embeddings(texts)
            
        collection = self.get_or_create_collection(collection_name)
        collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )

    def query_similar(
        self, 
        collection_name: str, 
        query_text: str, 
        n_results: int = 5,
        where_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        collection = self.get_or_create_collection(collection_name)
        query_embedding = embedding_service.get_embedding(query_text)
        
        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": n_results
        }
        if where_filter:
            kwargs["where"] = where_filter
            
        results = collection.query(**kwargs)
        
        formatted_results = []
        if results and results["documents"] and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results["metadatas"] else [{}] * len(docs)
            ids = results["ids"][0]
            distances = results["distances"][0] if results["distances"] else [0.0] * len(docs)
            
            for i in range(len(docs)):
                formatted_results.append({
                    "id": ids[i],
                    "text": docs[i],
                    "metadata": metas[i],
                    "distance": distances[i]
                })
        return formatted_results

    def delete_collection(self, collection_name: str):
        try:
            self.client.delete_collection(name=collection_name)
        except Exception as e:
            print(f"Collection deletion error: {e}")

vector_store_service = VectorStoreService()
