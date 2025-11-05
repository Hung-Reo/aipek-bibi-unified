from fastapi import APIRouter, HTTPException
from app.services.tts_service import TTSService
from pydantic import BaseModel
from typing import Dict, List, Optional
import time

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
    try:
        # Extract listening scripts với dynamic split
        scripts = tts_service.extract_listening_scripts(
            request.testContent, 
            request.listeningSplit
        )
        
        # Generate audio files
        audio_files = []
        timestamp = int(time.time() * 1000)
        
        # Process Part 1 conversations
        for i, conv in enumerate(scripts['part1']):
            enhanced_text = tts_service.add_speaker_labels(conv['text'])
            audio_bytes = await tts_service.call_openai_tts(
                enhanced_text, 
                request.voice, 
                request.speed
            )
            
            filename = tts_service.generate_filename(conv['id'], timestamp + i)
            audio_url = tts_service.save_audio_file(audio_bytes, filename)
            
            audio_files.append({
                'title': conv['title'],
                'filename': filename,
                'url': audio_url,
                'type': 'conversation',
                'size_bytes': len(audio_bytes),
                'duration_estimate': min(30, len(enhanced_text) // 10)
            })
        
        # Process Part 2 passage (if any)
        for i, passage in enumerate(scripts['part2']):
            audio_bytes = await tts_service.call_openai_tts(
                passage['text'], 
                request.voice, 
                request.speed
            )
            
            filename = tts_service.generate_filename(passage['id'], timestamp + 100 + i)
            audio_url = tts_service.save_audio_file(audio_bytes, filename)
            
            audio_files.append({
                'title': passage['title'],
                'filename': filename,
                'url': audio_url,
                'type': 'passage',
                'size_bytes': len(audio_bytes),
                'duration_estimate': min(60, len(passage['text']) // 8)
            })
        
        return {
            'success': True,
            'audioFiles': audio_files,
            'message': f'Generated {len(audio_files)} audio files'
        }
        
    except Exception as error:
        print(f'❌ TTS generation error: {error}')
        raise HTTPException(status_code=500, detail=str(error))