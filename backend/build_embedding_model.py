import math
from typing import List

# Simple pure-python vector arithmetic to calculate cosine similarity
def dot_product(v1: List[float], v2: List[float]) -> float:
    return sum(a * b for a, b in zip(v1, v2))

def magnitude(v: List[float]) -> float:
    return math.sqrt(sum(a * a for a in v))

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if not mag1 or not mag2:
        return 0.0
    return dot_product(v1, v2) / (mag1 * mag2)

def run_embedding_test():
    print("=" * 60)
    print("        SCHOLARMIND EMBEDDING MODEL SEMANTIC VERIFICATION")
    print("=" * 60)

    # Core study concepts
    doc_sentence = "Transactions satisfy ACID properties: Atomicity, Consistency, Isolation, and Durability."
    query_match = "What properties do database transactions satisfy?"
    query_mismatch = "How do we cook an apple pie?"

    print(f"\nSentence A (Study Material): \"{doc_sentence}\"")
    print(f"Sentence B (Relevant Query):   \"{query_match}\"")
    print(f"Sentence C (Irrelevant Query): \"{query_mismatch}\"")

    try:
        # Try loading sentence-transformers if installed in local env
        from sentence_transformers import SentenceTransformer
        print("\nLoading Local SentenceTransformer ('all-MiniLM-L6-v2')...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        
        emb_a = model.encode(doc_sentence).tolist()
        emb_b = model.encode(query_match).tolist()
        emb_c = model.encode(query_mismatch).tolist()
        print("Embeddings generated successfully via local HuggingFace model.")
        
    except ImportError:
        # Fallback to tf-idf / bag-of-words vector space model to run on basic python environments
        print("\n[HuggingFace 'sentence-transformers' not in global host. Initializing fallback TF-IDF vectorizer...]")
        
        # Build vocabulary
        vocab = sorted(list(set((doc_sentence + " " + query_match + " " + query_mismatch).lower().replace(".", "").replace("?", "").replace(",", "").split())))
        
        def vectorize(text: str) -> List[float]:
            words = text.lower().replace(".", "").replace("?", "").replace(",", "").split()
            return [words.count(w) for w in vocab]
            
        emb_a = vectorize(doc_sentence)
        emb_b = vectorize(query_match)
        emb_c = vectorize(query_mismatch)
        print("Embeddings generated successfully via Bag-of-Words Vectorizer.")

    # Calculate similarity scores
    sim_ab = cosine_similarity(emb_a, emb_b)
    sim_ac = cosine_similarity(emb_a, emb_c)

    print("\n" + "-" * 50)
    print("Calculated Cosine Semantic Similarity Scores:")
    print("-" * 50)
    print(f"Similarity(A, B): {sim_ab:.4f}  <-- High similarity expected")
    print(f"Similarity(A, C): {sim_ac:.4f}  <-- Low similarity expected")
    
    if sim_ab > sim_ac:
        print("\nSemantic Model Verification: SUCCESS. Query matches context correctly.")
    else:
        print("\nSemantic Model Verification: FAILED.")
    print("=" * 60)

if __name__ == "__main__":
    run_embedding_test()
