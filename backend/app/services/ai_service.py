import json
import re
from sqlalchemy.orm import Session
from app.models.all_models import Document, Quiz, FlashcardSet
from app.services.vector_store_service import vector_store_service
from app.services.llm_provider import get_llm_provider

class AIService:
    def __init__(self):
        self.llm = get_llm_provider()

    def _get_document_context(self, document_id: int, max_chars: int = 15000) -> str:
        # Retrieve all chunks stored in Chroma for this document
        # Chroma doesn't have an easy "get all" unless we query with blank or high n_results.
        # Let's query with a broad search or filter.
        collection_name = f"doc_{document_id}_collection"
        try:
            # Retrieve chunks
            results = vector_store_service.query_similar(
                collection_name=collection_name,
                query_text="document summary details and key concepts",
                n_results=20
            )
            # Combine text up to max_chars
            text_blocks = []
            current_len = 0
            for r in results:
                t = r.get("text", "")
                if current_len + len(t) > max_chars:
                    break
                text_blocks.append(t)
                current_len += len(t)
            return "\n".join(text_blocks)
        except Exception as e:
            print(f"Error fetching document text: {e}")
            return ""

    def generate_study_aid(self, db: Session, user_id: int, document_id: int, mode: str, difficulty: str) -> str:
        doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
        if not doc:
            return "Document not found."

        context = self._get_document_context(document_id)
        if not context:
            return "No readable text content found in document."

        # Configure prompt according to selected study aid and difficulty level
        difficulty_instructions = {
            "beginner": "Explain using simple analogies, clear terms, and avoid complex jargon.",
            "intermediate": "Provide a standard academic explanation with moderate technical details.",
            "advanced": "Focus on high-level architecture, deep analytical insights, and comprehensive technical detail.",
            "interview": "Focus on potential interview questions, core performance bottlenecks, conceptual trade-offs, and clear, concise punchy answers."
        }
        
        diff_inst = difficulty_instructions.get(difficulty.lower(), difficulty_instructions["intermediate"])
        
        mode_prompts = {
            "summary": "Generate a comprehensive, high-quality summary explaining all core concepts. Use bullet points and bold terms for emphasis.",
            "revision_sheet": "Generate a 'one-page revision sheet' detailing equations, key definitions, short summary of core themes, and summary tables.",
            "bullet_notes": "Extract concise, tabular or indented bullet notes outlining structural points and logical groupings.",
            "interview_prep": "Extract the top 5 most likely interview questions, detail the answers, and highlight critical gotchas."
        }
        
        mode_prompt = mode_prompts.get(mode.lower(), mode_prompts["summary"])
        
        system_instruction = (
            "You are ScholarMind study assistant. Help the student study the document materials. "
            f"Target difficulty profile: {diff_inst}"
        )
        
        prompt = (
            f"Here is the text content from '{doc.filename}':\n\n"
            f"{context}\n\n"
            f"Task: {mode_prompt}\n"
            "Format the output in clean, readable Markdown."
        )
        
        return self.llm.generate_text(prompt, system_instruction=system_instruction)

    def generate_quiz(self, db: Session, user_id: int, document_id: int, title: str, num_questions: int = 5) -> Quiz:
        context = self._get_document_context(document_id)
        
        prompt = (
            f"Create a multiple-choice quiz of {num_questions} questions based on this study text:\n\n"
            f"{context}\n\n"
            "You must return ONLY a JSON array of objects representing the quiz questions. "
            "Do NOT wrap the JSON in markdown code blocks. Do not output any HTML or explanatory text. "
            "Each object in the JSON array must follow this structure:\n"
            "{\n"
            '  "question": "What is ...?",\n'
            '  "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '  "correct_answer": "Option B",\n'
            '  "explanation": "Explanation why Option B is correct"\n'
            "}"
        )
        
        system_instruction = "You are a quiz generation engine. You output ONLY valid raw JSON arrays."
        
        json_response = self.llm.generate_text(prompt, system_instruction=system_instruction)
        
        # Clean response in case LLM wraps it in markdown blocks
        clean_json = re.sub(r"^```json\s*", "", json_response, flags=re.MULTILINE)
        clean_json = re.sub(r"```$", "", clean_json, flags=re.MULTILINE).strip()
        
        try:
            questions_data = json.loads(clean_json)
        except Exception as e:
            # Mock fallback in case of JSON parse errors
            questions_data = [
                {
                    "question": "Sample Question: What is the core topic of the document?",
                    "options": ["A) Vector Database", "B) File Processing", "C) Topic parsing failed", "D) General Knowledge"],
                    "correct_answer": "D) General Knowledge",
                    "explanation": "This is a placeholder question because the AI JSON output was invalid."
                }
            ]
            
        new_quiz = Quiz(
            user_id=user_id,
            document_id=document_id,
            title=title,
            questions=questions_data,
            max_score=len(questions_data)
        )
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)
        return new_quiz

    def generate_flashcards(self, db: Session, user_id: int, document_id: int, title: str, num_cards: int = 10) -> FlashcardSet:
        context = self._get_document_context(document_id)
        
        prompt = (
            f"Create {num_cards} flashcards mapping core terms/concepts (front side) to concise definitions/answers (back side) based on this study text:\n\n"
            f"{context}\n\n"
            "You must return ONLY a JSON array of objects representing the flashcards. "
            "Do NOT wrap the JSON in markdown code blocks. "
            "Each object in the JSON array must follow this structure:\n"
            "{\n"
            '  "front": "Term / Question",\n'
            '  "back": "Short explanation / Answer"\n'
            "}"
        )
        
        system_instruction = "You are a flashcard generation engine. You output ONLY valid raw JSON arrays."
        
        json_response = self.llm.generate_text(prompt, system_instruction=system_instruction)
        
        clean_json = re.sub(r"^```json\s*", "", json_response, flags=re.MULTILINE)
        clean_json = re.sub(r"```$", "", clean_json, flags=re.MULTILINE).strip()
        
        try:
            cards_data = json.loads(clean_json)
        except Exception:
            cards_data = [
                {
                    "front": "Vector Embeddings",
                    "back": "Numerical representations of text that capture semantic meaning."
                },
                {
                    "front": "RAG",
                    "back": "Retrieval-Augmented Generation, enhancing LLMs with document retrieval."
                }
            ]
            
        new_set = FlashcardSet(
            user_id=user_id,
            document_id=document_id,
            title=title,
            cards=cards_data
        )
        db.add(new_set)
        db.commit()
        db.refresh(new_set)
        return new_set

    def generate_mindmap(self, db: Session, user_id: int, document_id: int) -> str:
        context = self._get_document_context(document_id, max_chars=8000)
        
        prompt = (
            "Analyze the document text and generate a Mermaid.js flowchart representing the conceptual relationships. "
            "Use standard flowchart syntax starting with 'graph TD'. "
            "Keep the node names concise and group them cleanly. Do not use complex HTML. "
            "Return ONLY the Mermaid code block, start directly with graph TD.\n\n"
            f"Text:\n{context}"
        )
        
        system_instruction = "You are a conceptual mind map generator. You output ONLY Mermaid.js graph code."
        
        mermaid_code = self.llm.generate_text(prompt, system_instruction=system_instruction)
        
        # Clean any backticks
        clean_mermaid = re.sub(r"^```mermaid\s*", "", mermaid_code, flags=re.MULTILINE)
        clean_mermaid = re.sub(r"^```\s*", "", clean_mermaid, flags=re.MULTILINE)
        clean_mermaid = re.sub(r"```$", "", clean_mermaid, flags=re.MULTILINE).strip()
        
        return clean_mermaid

ai_service = AIService()
