from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class FlashcardGenerateRequest(BaseModel):
    document_id: str
    num_cards: int = 10


class FlashcardItem(BaseModel):
    front: str
    back: str


class FlashcardDeckResponse(BaseModel):
    id: str
    user_id: str
    document_id: Optional[str]
    title: str
    cards: List[FlashcardItem]
    created_at: datetime

    model_config = {"from_attributes": True}
