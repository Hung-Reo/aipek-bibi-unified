from fastapi import APIRouter, HTTPException
from app.services.tts_service import TTSService
from pydantic import BaseModel
from typing import Dict, List, Optional

class TTSRequest(BaseModel):
    testContent: str
    voice: str = 'alloy'
    speed: float = 1.0
    listeningSplit: Dict[str, int]


router = APIRouter()
tts_service = TTSService()

@router.post("/generate")
async def generate_tts(request: TTSRequest):
    """Port từ router.post('/generate') trong tts.js"""
    # Main endpoint cho tab kiểm tra