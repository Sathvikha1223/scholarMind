from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class Citation(BaseModel):
    document_name: str
    page_num: int
    chunk_text: str


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"
    document_ids: Optional[List[str]] = []


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    document_ids: List[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageCreate(BaseModel):
    session_id: str
    content: str
    document_ids: Optional[List[str]] = []
    mode: Optional[str] = "intermediate"  # beginner/intermediate/advanced/interview


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    citations: Optional[List[Citation]] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class MindMapResponse(BaseModel):
    document_id: str
    mermaid_code: str
