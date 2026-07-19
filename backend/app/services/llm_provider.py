import abc
import google.generativeai as genai
from typing import Optional
from app.core.config import settings

class BaseLLMProvider(abc.ABC):
    @abc.abstractmethod
    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        pass

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.api_key:
            return "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables."
        
        # Use gemini-1.5-flash as the default fast and capable model
        model_name = "gemini-1.5-flash"
        
        try:
            if system_instruction:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction
                )
            else:
                model = genai.GenerativeModel(model_name=model_name)
                
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error communicating with Gemini API: {str(e)}"

class MockProvider(BaseLLMProvider):
    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        return (
            "This is a simulated response from ScholarMind Knowledge Engine.\n\n"
            "To connect this assistant to live artificial intelligence models, please verify "
            "that your `GEMINI_API_KEY` has been correctly configured in the backend environment."
        )

def get_llm_provider() -> BaseLLMProvider:
    if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider()
    return MockProvider()
