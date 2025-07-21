from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict
import time
from app.services.tts_service import TTSService

# ✅ TTS Request Model - Simple
class TTSRequest(BaseModel):
    testContent: str = Field(..., description="Test content chứa listening scripts")
    voice: str = Field(default="alloy", description="OpenAI voice (alloy/echo/nova)")
    speed: float = Field(default=1.0, description="Speech speed (0.9-1.1)")
    listeningSplit: Dict[str, int] = Field(default={"part1Count": 5, "part2Count": 5})

router = APIRouter()
tts_service = TTSService()

@router.post("/generate")
async def generate_tts(request: TTSRequest):
    """Port từ router.post('/generate') trong tts.js - COMPLETE WORKFLOW"""
    try:
        print('🎧 Received TTS generation request')
        
        if not request.testContent:
            raise HTTPException(status_code=400, detail="Test content is required")
        
        # Default split nếu không được provide (backward compatibility)
        split = request.listeningSplit or {"part1Count": 5, "part2Count": 5}
        print(f'📊 Using listening split: Part 1={split["part1Count"]}, Part 2={split["part2Count"]}')
        
        # ✅ Extract scripts với dynamic split
        scripts = tts_service.extract_listening_scripts(request.testContent, split)
        
        if len(scripts['part1']) == 0 and len(scripts['part2']) == 0:
            raise HTTPException(status_code=400, detail="No listening scripts found in test content")
        
        timestamp = int(time.time() * 1000)
        audio_files = []
        
        # ✅ Generate audio cho Part 1 conversations với Speaker Labels
        print(f'🚀 Processing {len(scripts["part1"])} conversations với speaker labels...')
        
        for conv in scripts['part1']:
            try:
                print(f'🎙️ Starting TTS for {conv["id"]}')
                
                # Thêm speaker labels để phân biệt voices
                labeled_text = tts_service.add_speaker_labels(conv['text'])
                print(f'📝 Applied speaker labels for {conv["id"]}')
                
                # Generate audio
                audio_bytes = await tts_service.call_openai_tts(
                    labeled_text, 
                    request.voice, 
                    request.speed
                )
                
                # Save file
                filename = tts_service.generate_filename(conv['id'], timestamp)
                audio_url = tts_service.save_audio_file(audio_bytes, filename)
                
                audio_files.append({
                    'id': conv['id'],
                    'title': conv['title'],
                    'url': audio_url,
                    'filename': filename,
                    'type': 'conversation',
                    'size_bytes': len(audio_bytes),
                    'duration_estimate': int(len(conv['text']) * 0.08)  # Estimate duration
                })
                
                print(f'✅ Audio generated for {conv["id"]}: {filename}')
                
            except Exception as error:
                print(f'❌ Error generating audio for {conv["id"]}: {error}')
                # Continue với conversations khác
                continue
        
        valid_part1 = len(audio_files)
        print(f'✅ Part 1 complete: {valid_part1}/{len(scripts["part1"])} successful')
        
        # ✅ Generate audio cho Part 2 passage - CONDITIONAL
        if split["part2Count"] > 0 and len(scripts['part2']) > 0:
            print(f'🎙️ Processing Part 2 passage for {split["part2Count"]} questions...')
            
            for passage in scripts['part2']:
                try:
                    audio_bytes = await tts_service.call_openai_tts(
                        passage['text'], 
                        request.voice, 
                        request.speed
                    )
                    
                    filename = tts_service.generate_filename(passage['id'], timestamp)
                    audio_url = tts_service.save_audio_file(audio_bytes, filename)
                    
                    audio_files.append({
                        'id': passage['id'],
                        'title': passage['title'],
                        'url': audio_url,
                        'filename': filename,
                        'type': 'passage',
                        'size_bytes': len(audio_bytes),
                        'duration_estimate': int(len(passage['text']) * 0.08)  # Estimate duration
                    })
                    
                    print(f'✅ Part 2 passage audio generated successfully: {filename}')
                    
                except Exception as error:
                    print(f'❌ Error generating audio for {passage["id"]}: {error}')
        else:
            print(f'⏭️ Skipping Part 2 audio generation (part2Count = {split["part2Count"]})')
        
        if len(audio_files) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate any audio files")
        
        # Success response với thông tin về split
        total_duration = sum(file['duration_estimate'] for file in audio_files)
        total_size = sum(file['size_bytes'] for file in audio_files)
        
        return {
            "success": True,
            "message": f"Generated {len(audio_files)} audio files ({valid_part1} conversations + {len(audio_files) - valid_part1} passages)",
            "audioFiles": audio_files,  # Frontend expects audioFiles (camelCase)
            "totalDuration": total_duration,
            "totalSize": total_size,
            "voice": request.voice,
            "speed": request.speed,
            "timestamp": timestamp,
            "listeningSplit": split,  # Return split info for verification
            "extraction_stats": {
                "part1_found": len(scripts['part1']),
                "part1_target": split['part1Count'],
                "part2_found": len(scripts['part2']),
                "part2_target": split['part2Count'],
                "success_rate": f"{len(audio_files)}/{len(scripts['part1']) + len(scripts['part2'])}"
            }
        }
        
    except HTTPException:
        raise  # Re-raise HTTPException as-is
    except Exception as e:
        import traceback
        print(f'❌ TTS generation error: {e}')
        print('Full traceback:', traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@router.get("/health")
async def tts_health():
    """Health check cho TTS service"""
    import os
    from pathlib import Path
    
    audio_dir = Path('static/audio/temp')
    has_api_key = bool(os.environ.get('OPENAI_API_KEY'))
    
    return {
        "status": "ok",
        "service": "TTS API", 
        "message": "COMPLETE TTS system implemented",
        "hasOpenAIKey": has_api_key,
        "audioDirectory": "exists" if audio_dir.exists() else "missing",
        "functions_available": [
            "add_speaker_labels",
            "call_openai_tts", 
            "save_audio_file",
            "generate_filename",
            "extract_listening_scripts"  # ✅ NEW!
        ]
    }

@router.get("/voices")
async def get_voices():
    """Port từ router.get('/voices') trong tts.js"""
    return {
        "voices": tts_service.TTS_CONFIG['voices'],
        "speeds": tts_service.TTS_CONFIG['speeds'],
        "model": tts_service.TTS_CONFIG['model']
    }
