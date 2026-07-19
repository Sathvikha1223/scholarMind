import logging
from abc import ABC, abstractmethod
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseLLMService(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        pass


class GeminiLLMService(BaseLLMService):
    def __init__(self):
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def generate(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise RuntimeError(f"LLM generation failed: {str(e)}")


class OpenAILLMService(BaseLLMService):
    def __init__(self):
        from openai import OpenAI
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def generate(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise RuntimeError(f"LLM generation failed: {str(e)}")


class MockLLMService(BaseLLMService):
    """Fallback when no API key is configured."""
    def generate(self, prompt: str) -> str:
        return (
            "⚠️ **No LLM API key configured.** Please set `GEMINI_API_KEY` in your `.env` file "
            "and restart the backend to enable AI responses.\n\n"
            "You can get a free Gemini API key at: https://aistudio.google.com/apikey"
        )


_llm_service: BaseLLMService = None


def get_llm_service() -> BaseLLMService:
    global _llm_service
    if _llm_service is None:
        provider = settings.LLM_PROVIDER.lower()
        if provider == "gemini" and settings.GEMINI_API_KEY:
            _llm_service = GeminiLLMService()
            logger.info("Using Gemini LLM service")
        elif provider == "openai" and settings.OPENAI_API_KEY:
            _llm_service = OpenAILLMService()
            logger.info("Using OpenAI LLM service")
        else:
            _llm_service = MockLLMService()
            logger.warning("No LLM API key found. Using MockLLMService.")
    return _llm_service
