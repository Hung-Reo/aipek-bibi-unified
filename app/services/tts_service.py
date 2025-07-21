# Migrate từ tts.js sang Python
import openai
import aiohttp
import asyncio
import os
import time
from typing import Dict, List, Any, Optional
from pathlib import Path

class TTSService:
    def __init__(self):
        # ✅ TTS Config - Port từ TTS_CONFIG trong tts.js
        self.TTS_CONFIG = {
            'model': 'tts-1',  # Fast model cho educational use
            'voices': {
                'alloy': 'alloy',     # Natural, balanced
                'echo': 'echo',       # Clear, educational
                'nova': 'nova'        # Warm, friendly
            },
            'speeds': {
                'slow': 0.9,
                'normal': 1.0,
                'fast': 1.1
            }
        }
        
    def ensure_audio_directory(self) -> str:
        """✅ Port từ ensureAudioDirectory() trong tts.js"""
        audio_dir = Path('static/audio/temp')
        audio_dir.mkdir(parents=True, exist_ok=True)
        print(f'✅ Audio directory ready: {audio_dir}')
        return str(audio_dir)
        
    def generate_filename(self, script_id: str, timestamp: int) -> str:
        """✅ Port từ generateFilename() trong tts.js"""
        return f"test_{timestamp}_{script_id}.mp3"
        
    def save_audio_file(self, audio_bytes: bytes, filename: str) -> str:
        """✅ Port từ saveAudioFile() trong tts.js
        
        Lưu audio file và return URL accessible từ frontend
        """
        try:
            audio_dir = self.ensure_audio_directory()
            file_path = Path(audio_dir) / filename
            
            # Write bytes to file
            file_path.write_bytes(audio_bytes)
            
            # Return URL accessible từ frontend (giống Node.js)
            audio_url = f"/static/audio/temp/{filename}"
            print(f'✅ Saved audio: {filename} ({len(audio_bytes)} bytes)')
            
            return audio_url
            
        except Exception as error:
            print(f'❌ Error saving audio file: {error}')
            raise error
    
    async def call_openai_tts(self, text: str, voice: str = 'alloy', speed: float = 1.0) -> bytes:
        """✅ Port từ callOpenAITTS() trong tts.js
        
        Gọi OpenAI TTS API với timeout protection và retry mechanism
        """
        print(f'🎙️ Calling OpenAI TTS: {text[:50]}...')
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise Exception('OPENAI_API_KEY not configured')
            
        # Try with retry mechanism (max 1 retry giống Node.js)
        return await self._call_openai_tts_with_retry(text, voice, speed, max_retries=1)
        
    async def _call_openai_tts_with_retry(self, text: str, voice: str, speed: float, max_retries: int) -> bytes:
        """✅ Port từ callOpenAITTSWithRetry() trong tts.js
        
        Internal function với retry logic
        """
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                is_retry = attempt > 0
                timeout = 35 if is_retry else 25  # Longer timeout for retry
                
                if is_retry:
                    print(f'🔄 Retry attempt {attempt} for TTS call ({timeout}s timeout)')
                    
                # Prepare request data
                request_data = {
                    'model': self.TTS_CONFIG['model'],
                    'input': text[:4000],  # Limit input length giống Node.js
                    'voice': voice,
                    'speed': speed,
                    'response_format': 'mp3'
                }
                
                headers = {
                    'Authorization': f'Bearer {os.environ.get("OPENAI_API_KEY")}',
                    'Content-Type': 'application/json'
                }
                
                # Make API call với timeout protection
                timeout_config = aiohttp.ClientTimeout(total=timeout)
                
                async with aiohttp.ClientSession(timeout=timeout_config) as session:
                    async with session.post(
                        'https://api.openai.com/v1/audio/speech',
                        json=request_data,
                        headers=headers
                    ) as response:
                        
                        if not response.ok:
                            error_text = await response.text()
                            raise Exception(f'OpenAI TTS API error: {response.status} - {error_text}')
                            
                        audio_bytes = await response.read()
                        print(f'✅ TTS success: {len(audio_bytes)} bytes (attempt {attempt + 1})')
                        return audio_bytes
                        
            except Exception as error:
                last_error = error
                is_timeout = 'timeout' in str(error).lower() or 'aborted' in str(error).lower()
                
                print(f'❌ TTS attempt {attempt + 1} failed: {error}')
                
                # Only retry on timeout errors, not API errors
                if attempt < max_retries and is_timeout:
                    print('⏳ Will retry due to timeout...')
                    continue
                else:
                    break
                    
        # All attempts failed
        print(f'❌ All TTS attempts failed: {last_error}')
        raise last_error
        
    def add_speaker_labels(self, conversation_text: str) -> str:
        """✅ Port từ addSpeakerLabels() trong tts.js
        
        Chuyển "Speaker A:" thành "Speaker A says:" để audio rõ ràng hơn cho học sinh
        """
        if not conversation_text:
            return ''
            
        print('🎙️ Adding speaker labels for voice differentiation...')
        
        # Simple string replacement - exact port từ JavaScript
        result = conversation_text.replace('Speaker A:', 'Speaker A says:')
        result = result.replace('Speaker B:', 'Speaker B says:')
        
        return result
    
    def extract_listening_scripts(self, test_content: str, listening_split: Dict) -> Dict:
        """✅ Port từ extractListeningScripts() trong tts.js
        
        Extract listening scripts từ test content với dynamic count
        Chỉ extract số lượng conversations và passages theo listeningSplit từ frontend
        """
        print('🔍 Extracting listening scripts from test content...')
        print(f'📄 Content length: {len(test_content)}')
        print(f'📊 Target extraction: {listening_split.get("part1Count", 5)} conversations, {listening_split.get("part2Count", 5)} passage questions')
        
        try:
            # Tìm audio scripts section
            audio_section = ''
            import re
            
            # Tìm AUDIO SCRIPTS section
            audio_match = re.search(r'AUDIO SCRIPTS[\s\S]*?(?=ĐÁP ÁN|SCORING|$)', test_content, re.IGNORECASE)
            if audio_match:
                audio_section = audio_match.group(0)
                print(f'✅ Found AUDIO SCRIPTS section, length: {len(audio_section)}')
            else:
                raise Exception('Không tìm thấy AUDIO SCRIPTS section')
            
            part1_conversations = []
            part1_count = listening_split.get('part1Count', 5)
            
            # Method 1: Tìm **Conversation X** patterns - DYNAMIC COUNT
            print(f'🔍 Trying Method 1: **Conversation X** patterns (target: {part1_count})')
            for i in range(1, part1_count + 1):
                patterns = [
                    rf'\*\*Conversation {i}\*\*[\s\S]*?(?=\*\*Conversation {i + 1}\*\*|\*\*Part 2|### Part 2|Part 2|$)',
                    rf'Conversation {i}[\s\S]*?(?=Conversation {i + 1}|Part 2|$)',
                    rf'\[Conversation {i}\][\s\S]*?(?=\[Conversation {i + 1}\]|Part 2|$)'
                ]
                
                found = False
                for pattern in patterns:
                    match = re.search(pattern, audio_section, re.IGNORECASE)
                    if match:
                        conv_text = match.group(0)
                        # Clean up text
                        conv_text = re.sub(rf'\*\*Conversation {i}\*\*', '', conv_text, flags=re.IGNORECASE)
                        conv_text = re.sub(rf'Conversation {i}', '', conv_text, flags=re.IGNORECASE)
                        conv_text = re.sub(rf'\[Conversation {i}\]', '', conv_text, flags=re.IGNORECASE)
                        conv_text = re.sub(r'\*\*', '', conv_text)
                        conv_text = conv_text.strip()
                        
                        if len(conv_text) > 50:
                            part1_conversations.append({
                                'id': f'part1_conv{i}',
                                'text': conv_text,
                                'title': f'Conversation {i}'
                            })
                            print(f'✅ Method 1: Found conversation {i}, length: {len(conv_text)}')
                            print(f'📝 Preview: {conv_text[:100]}...')
                            found = True
                            break
                
                if not found:
                    print(f'⚠️ Method 1: Conversation {i} not found')
            
            # Method 2: Nếu Method 1 thất bại, split by paragraph breaks
            if len(part1_conversations) == 0:
                print('🔍 Trying Method 2: Split by paragraph breaks')
                
                # Tìm Part 1 section trước
                part1_match = re.search(r'Part 1[\s\S]*?(?=Part 2|$)', audio_section, re.IGNORECASE)
                if part1_match:
                    part1_section = part1_match.group(0)
                    print(f'📝 Part 1 section found, length: {len(part1_section)}')
                    
                    # Split by double line breaks hoặc conversation markers
                    chunks = re.split(r'\n\s*\n|\*\*\s*\*\*', part1_section)
                    chunks = [chunk.strip() for chunk in chunks if 
                             len(chunk.strip()) > 50 and 
                             'Speaker A:' in chunk and 
                             'Speaker B:' in chunk]
                    
                    print(f'📊 Found {len(chunks)} conversation chunks')
                    
                    # DYNAMIC: Chỉ lấy số lượng conversations cần thiết
                    for index, chunk in enumerate(chunks[:part1_count]):
                        cleaned = re.sub(r'Part 1.*?minutes?\)', '', chunk, flags=re.IGNORECASE)
                        cleaned = re.sub(r'\*\*', '', cleaned).strip()
                        
                        if len(cleaned) > 50:
                            part1_conversations.append({
                                'id': f'part1_conv{index + 1}',
                                'text': cleaned,
                                'title': f'Conversation {index + 1}'
                            })
                            print(f'✅ Method 2: Added conversation {index + 1}, length: {len(cleaned)}')
                            print(f'📝 Preview: {cleaned[:150]}...')
            
            # Method 3: Manual parsing nếu cả hai thất bại
            if len(part1_conversations) == 0:
                print('🔍 Trying Method 3: Manual conversation parsing')
                
                # Tìm complete conversation blocks
                speaker_a_matches = re.findall(r'Speaker A:[^]*?(?=(?:Speaker A:|Part 2|$))', audio_section)
                
                if speaker_a_matches:
                    print(f'📊 Found {len(speaker_a_matches)} Speaker A blocks')
                    
                    # DYNAMIC: Chỉ process số lượng cần thiết
                    for index, block in enumerate(speaker_a_matches[:part1_count]):
                        # Clean up the block
                        cleaned = re.sub(r'Part 1.*?minutes?\)', '', block, flags=re.IGNORECASE)
                        cleaned = re.sub(r'\*\*', '', cleaned).strip()
                        
                        # Chỉ include nếu có cả hai speakers
                        if 'Speaker A:' in cleaned and 'Speaker B:' in cleaned and len(cleaned) > 50:
                            part1_conversations.append({
                                'id': f'part1_conv{index + 1}',
                                'text': cleaned,
                                'title': f'Conversation {index + 1}'
                            })
                            print(f'✅ Method 3: Added conversation {index + 1}, length: {len(cleaned)}')
                            print(f'📝 Preview: {cleaned[:150]}...')
            
            # Extract Part 2 - CONDITIONAL based on listeningSplit
            part2_scripts = []
            part2_count = listening_split.get('part2Count', 5)
            
            if part2_count > 0:
                print(f'🔍 Extracting Part 2 passage for {part2_count} questions')
                
                part2_text = ''
                part2_patterns = [
                    r'Part 2[\s\S]*?Narrator:\s*(.*?)(?=ĐÁP ÁN|$)',
                    r'### Part 2[\s\S]*?Narrator:\s*(.*?)(?=ĐÁP ÁN|$)',
                    r'Extended Passage[\s\S]*?Narrator:\s*(.*?)(?=ĐÁP ÁN|$)'
                ]
                
                for pattern in part2_patterns:
                    match = re.search(pattern, audio_section, re.DOTALL)
                    if match and match.group(1):
                        part2_text = match.group(1).strip()
                        print(f'✅ Found Part 2 passage, length: {len(part2_text)}')
                        break
                
                if part2_text:
                    part2_scripts.append({
                        'id': 'part2_passage',
                        'text': part2_text,
                        'title': 'Extended Passage'
                    })
            else:
                print(f'⏭️ Skipping Part 2 extraction (15-minute test với part2Count = {part2_count})')
            
            # Return scripts với exact count theo listeningSplit
            scripts = {
                'part1': part1_conversations[:part1_count],
                'part2': part2_scripts
            }
            
            print(f'✅ Final extraction: {len(scripts["part1"])}/{part1_count} conversations + {len(scripts["part2"])}/{part2_count} passage')
            
            # Log each conversation for verification
            for index, conv in enumerate(scripts['part1']):
                print(f'📝 Conversation {index + 1} text: {conv["text"][:200]}...')
            
            if len(scripts['part1']) == 0 and len(scripts['part2']) == 0:
                raise Exception('Không extract được scripts nào')
            
            return scripts
            
        except Exception as error:
            print(f'❌ Error extracting scripts: {error}')
            raise Exception(f'Script extraction failed: {error}')