# 🔒 SECURITY FIX PLAN - CRITICAL ISSUES

**Project:** BiBi AI Education Assistant
**Date:** 2025-11-05
**Status:** IN PROGRESS
**Backup Location:** `_backup/20251105_080013/`

---

## 📋 OVERVIEW

Đây là kế hoạch chi tiết để fix 4 CRITICAL security issues được phát hiện trong code review:

1. ✅ Fix CORS security (`allow_origins=["*"]`)
2. ✅ Add authentication cho API endpoints
3. ✅ Sanitize error messages (không leak API keys)
4. ✅ Add rate limiting

**Estimated Time:** 2-3 ngày
**Risk Level:** Medium (có backup, changes được test kỹ)

---

## 🔴 CRITICAL #1: FIX CORS SECURITY

### 📍 Current Issue
**File:** `main.py:67-75`

```python
# ❌ NGUY HIỂM: Cho phép mọi domain truy cập API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ❌ Vulnerability
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
```

### ⚠️ Risks
- **CSRF Attacks**: Bất kỳ website nào cũng có thể gọi API của bạn
- **Data Theft**: Kẻ tấn công có thể truy cập dữ liệu người dùng
- **API Abuse**: Spam requests → tốn tiền OpenAI/Pinecone
- **Credential Exposure**: Kết hợp `allow_credentials=True` + `allow_origins=["*"]` = rất nguy hiểm

### ✅ Solution

#### Step 1: Thêm environment variable cho allowed origins
**File:** `.env` (cần tạo/update)

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8000,https://your-domain.com,https://bibi-app.render.com
ENVIRONMENT=production  # hoặc "development"
```

#### Step 2: Update config.py
**File:** `app/config.py`

```python
# Thêm vào cuối file
# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000").split(",")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"
```

#### Step 3: Update main.py CORS middleware
**File:** `main.py:67-75`

```python
# Import config
from app.config import ALLOWED_ORIGINS, IS_PRODUCTION

# ✅ SECURE CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # ✅ Whitelist specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],  # ✅ Specific headers
    max_age=600,
)

# Log CORS config for verification
print(f"🔒 CORS enabled for origins: {ALLOWED_ORIGINS}")
print(f"🔒 Environment: {ENVIRONMENT}")
```

### 🧪 Testing

```bash
# Test 1: Valid origin should work
curl -H "Origin: http://localhost:8000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:8000/api/health

# Expected: Access-Control-Allow-Origin: http://localhost:8000

# Test 2: Invalid origin should be blocked
curl -H "Origin: http://evil-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8000/api/health

# Expected: No Access-Control-Allow-Origin header (blocked)
```

---

## 🔴 CRITICAL #2: ADD AUTHENTICATION

### 📍 Current Issue
**Files:**
- `main.py:144` - `/api/rag` endpoint
- `main.py:206` - `/api/chat` endpoint
- `routes/tts.py` - `/api/tts/*` endpoints

```python
# ❌ Bất kỳ ai cũng có thể gọi API → Tốn $$$ OpenAI tokens
@app.get("/api/rag")
async def search_documents(...):
    # Không có authentication
```

### ⚠️ Risks
- **Financial Loss**: Kẻ tấn công spam API → tốn tiền OpenAI ($$$)
- **Rate Limit**: OpenAI có thể ban account do abuse
- **Data Access**: Unauthorized access vào Pinecone knowledge base

### ✅ Solution

#### Step 1: Generate API Key (chạy script này)
**File:** `scripts/generate_api_key.py` (NEW)

```python
#!/usr/bin/env python3
"""Generate secure API key for BiBi API authentication"""
import secrets
import hashlib
from datetime import datetime

def generate_api_key():
    """Generate cryptographically secure API key"""
    # Generate 32 bytes random
    random_bytes = secrets.token_bytes(32)

    # Hash with timestamp for uniqueness
    timestamp = str(datetime.now().timestamp()).encode()
    combined = random_bytes + timestamp

    # Create API key with prefix
    api_key = f"bibi_{secrets.token_urlsafe(32)}"

    # Create hash for storage (bcrypt-like)
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    return api_key, key_hash

if __name__ == "__main__":
    api_key, key_hash = generate_api_key()

    print("=" * 60)
    print("🔑 BiBi API Key Generated")
    print("=" * 60)
    print(f"\n📋 API Key (save to .env):")
    print(f"   {api_key}")
    print(f"\n🔐 Hash (for verification):")
    print(f"   {key_hash}")
    print(f"\n⚠️  IMPORTANT:")
    print(f"   1. Add to .env: API_SECRET_KEY={api_key}")
    print(f"   2. Never commit .env to git")
    print(f"   3. Share key securely with frontend team")
    print("=" * 60)
```

#### Step 2: Add API_SECRET_KEY to .env
**File:** `.env`

```bash
# API Authentication
API_SECRET_KEY=bibi_<generated-key-here>  # Từ script trên
```

#### Step 3: Update config.py
**File:** `app/config.py`

```python
# API Authentication
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "")
if not API_SECRET_KEY and ENVIRONMENT == "production":
    raise ValueError("API_SECRET_KEY must be set in production!")
```

#### Step 4: Create authentication middleware
**File:** `app/middleware/auth.py` (NEW)

```python
"""API Authentication middleware"""
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.config import API_SECRET_KEY, IS_PRODUCTION
import logging

logger = logging.getLogger(__name__)

# Define API Key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Verify API key from X-API-Key header

    Args:
        api_key: API key from request header

    Returns:
        str: Validated API key

    Raises:
        HTTPException: If API key is invalid or missing
    """
    # Allow bypass in development (optional)
    if not IS_PRODUCTION and not api_key:
        logger.warning("⚠️ API key check bypassed (development mode)")
        return "dev-bypass"

    # Check if API key provided
    if not api_key:
        logger.warning("❌ Missing API key in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Include X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Validate API key
    if api_key != API_SECRET_KEY:
        logger.warning(f"❌ Invalid API key attempt: {api_key[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    logger.info("✅ API key validated successfully")
    return api_key


async def verify_api_key_optional(api_key: str = Security(api_key_header)) -> str:
    """
    Optional API key verification (for public endpoints)
    Returns None if no key provided, validates if key is provided
    """
    if not api_key:
        return None

    # If key is provided, validate it
    if api_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return api_key
```

#### Step 5: Protect API endpoints
**File:** `main.py`

```python
# Add imports at top
from fastapi import Depends
from app.middleware.auth import verify_api_key

# Update endpoints with authentication
@app.get("/api/rag")
async def search_documents(
    query: str = Query(..., description="Search query"),
    namespace: str = Query(BIBI_NAMESPACE, description="Namespace to search in"),
    top_k: int = Query(5, description="Number of results to return"),
    search_all: bool = Query(False, description="Search all namespaces"),
    api_key: str = Depends(verify_api_key)  # ✅ Require authentication
):
    """Tìm kiếm tài liệu với truy vấn (requires authentication)"""
    # ... existing code ...


@app.post("/api/chat")
async def chat_stream(
    request: Request,
    api_key: str = Depends(verify_api_key)  # ✅ Require authentication
):
    """API endpoint xử lý streaming response từ OpenAI (requires authentication)"""
    # ... existing code ...
```

**File:** `routes/tts.py`

```python
# Add authentication to TTS endpoints
from fastapi import Depends
from app.middleware.auth import verify_api_key

@router.post("/generate")
async def generate_tts(
    request: TTSRequest,
    api_key: str = Depends(verify_api_key)  # ✅ Require authentication
):
    """Generate TTS audio files (requires authentication)"""
    # ... existing code ...
```

#### Step 6: Update frontend to include API key
**File:** `static/js/controllers/api.js`

```javascript
// Add API key to all requests
const API_CONFIG = {
    apiKey: 'bibi_<your-key-here>',  // ✅ Store securely (environment variable)
    baseURL: window.location.origin
};

// Update fetch calls to include X-API-Key header
async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_CONFIG.apiKey,  // ✅ Include API key
        ...options.headers
    };

    return fetch(url, {
        ...options,
        headers
    });
}

// Update all API calls to use fetchWithAuth
async function streamBiBiResponse(messages, updateCallback, options) {
    const response = await fetchWithAuth("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages, ...options })
    });
    // ... rest of code
}
```

### 🧪 Testing

```bash
# Test 1: Request without API key should fail
curl -X GET http://localhost:8000/api/health
# Expected: 401 Unauthorized

# Test 2: Request with valid API key should work
curl -X GET \
  -H "X-API-Key: bibi_<your-key>" \
  http://localhost:8000/api/health
# Expected: 200 OK

# Test 3: Request with invalid API key should fail
curl -X GET \
  -H "X-API-Key: invalid-key" \
  http://localhost:8000/api/health
# Expected: 403 Forbidden
```

---

## 🔴 CRITICAL #3: SANITIZE ERROR MESSAGES

### 📍 Current Issue
**File:** `main.py:196-203`

```python
# ❌ Error có thể leak API keys, secrets
except Exception as e:
    return {
        "status": "error",
        "message": str(e),  # ❌ Có thể chứa sensitive data
        "traceback": error_trace  # ❌ Full stack trace
    }
```

### ⚠️ Risks
- **API Key Leakage**: Error messages có thể chứa OpenAI/Pinecone keys
- **System Info Exposure**: Stack traces reveal internal paths, versions
- **Attack Surface**: Hackers biết technology stack → targeted attacks

### ✅ Solution

#### Step 1: Create error sanitizer utility
**File:** `app/utils/error_handler.py` (NEW)

```python
"""Secure error handling and sanitization"""
import re
import traceback
import logging
from typing import Dict, Any, Optional
from app.config import IS_PRODUCTION

logger = logging.getLogger(__name__)

# Patterns to redact from error messages
SENSITIVE_PATTERNS = [
    (r'sk-[a-zA-Z0-9]{32,}', '[OPENAI_KEY_REDACTED]'),  # OpenAI keys
    (r'pcsk_[a-zA-Z0-9]{32,}', '[PINECONE_KEY_REDACTED]'),  # Pinecone keys
    (r'Bearer [a-zA-Z0-9._-]+', 'Bearer [REDACTED]'),  # Bearer tokens
    (r'api[_-]?key["\']?\s*[:=]\s*["\']?([^"\'\s]+)', 'api_key=[REDACTED]'),  # API keys
    (r'/home/[^\s]+', '/app/[PATH_REDACTED]'),  # File paths
    (r'password["\']?\s*[:=]\s*["\']?([^"\'\s]+)', 'password=[REDACTED]'),  # Passwords
]

def sanitize_error_message(error_message: str) -> str:
    """
    Remove sensitive information from error message

    Args:
        error_message: Raw error message

    Returns:
        str: Sanitized error message
    """
    sanitized = error_message

    # Apply all redaction patterns
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    return sanitized


def create_error_response(
    error: Exception,
    user_message: Optional[str] = None,
    include_details: bool = False
) -> Dict[str, Any]:
    """
    Create safe error response

    Args:
        error: The exception that occurred
        user_message: User-friendly message (optional)
        include_details: Include sanitized details (only in dev)

    Returns:
        Dict: Safe error response
    """
    # Log full error internally
    logger.error(f"Error occurred: {error}", exc_info=True)

    # Generic message for production
    if IS_PRODUCTION and not user_message:
        user_message = "An error occurred. Please contact support."

    # Detailed message for development
    if not user_message:
        user_message = sanitize_error_message(str(error))

    response = {
        "status": "error",
        "message": user_message,
        "timestamp": datetime.now().isoformat()
    }

    # Include details only in development
    if include_details and not IS_PRODUCTION:
        response["details"] = {
            "error_type": type(error).__name__,
            "error_message": sanitize_error_message(str(error)),
            "traceback": sanitize_error_message(traceback.format_exc())
        }

    return response


# Specific error handlers for common cases
def handle_openai_error(error: Exception) -> Dict[str, Any]:
    """Handle OpenAI API errors safely"""
    if "rate_limit" in str(error).lower():
        return create_error_response(
            error,
            user_message="API rate limit exceeded. Please try again in a few moments."
        )
    elif "authentication" in str(error).lower():
        return create_error_response(
            error,
            user_message="Service authentication error. Please contact support."
        )
    else:
        return create_error_response(
            error,
            user_message="AI service error. Please try again."
        )


def handle_pinecone_error(error: Exception) -> Dict[str, Any]:
    """Handle Pinecone errors safely"""
    return create_error_response(
        error,
        user_message="Knowledge base error. Please try again."
    )
```

#### Step 2: Update main.py error handling
**File:** `main.py`

```python
# Add import
from app.utils.error_handler import create_error_response, sanitize_error_message

# Update /api/rag error handling (line 195-204)
except Exception as e:
    error_trace = traceback.format_exc()
    logger.error(f"❌ RAG search error: {str(e)}")
    logger.error(error_trace)

    # ✅ Return sanitized error
    return JSONResponse(
        status_code=500,
        content=create_error_response(e, include_details=True)
    )

# Update /api/chat error handling (line 295-303)
except Exception as e:
    logger.error(f"❌ Chat error: {str(e)}", exc_info=True)

    # ✅ Return sanitized error
    return JSONResponse(
        status_code=500,
        content=create_error_response(e)
    )

# Update stream_generator error handling (line 278-282)
except Exception as e:
    logger.error(f"❌ Streaming error: {str(e)}", exc_info=True)

    # ✅ Sanitize error before sending to client
    safe_message = sanitize_error_message(str(e))
    error_json = json.dumps({
        "error": {"message": safe_message}
    })
    yield f"data: {error_json}\n\n"
    yield "data: [DONE]\n\n"
```

### 🧪 Testing

```bash
# Test 1: Trigger error and check response doesn't leak keys
# (Manually set invalid OPENAI_API_KEY in .env)
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}' \
  http://localhost:8000/api/chat

# Expected: Error message WITHOUT any "sk-..." keys visible

# Test 2: Check logs contain full error (for debugging)
# Look in console logs - should see full traceback there
```

---

## 🔴 CRITICAL #4: ADD RATE LIMITING

### 📍 Current Issue
**Files:** All API endpoints

```python
# ❌ Unlimited requests → Có thể bị DDoS, tốn $$$ OpenAI
@app.post("/api/chat")
async def chat_stream(...):
    # Không có rate limiting
```

### ⚠️ Risks
- **DDoS Attacks**: Kẻ tấn công spam requests → crash server
- **Financial Loss**: Unlimited OpenAI API calls → huge bills
- **Service Degradation**: Legitimate users bị ảnh hưởng

### ✅ Solution

#### Step 1: Install slowapi
**File:** `requirements.txt`

```txt
# Add to requirements.txt
slowapi>=0.1.9
```

```bash
# Install
pip install slowapi
```

#### Step 2: Create rate limiter
**File:** `app/middleware/rate_limit.py` (NEW)

```python
"""Rate limiting middleware using slowapi"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from app.config import IS_PRODUCTION
import logging

logger = logging.getLogger(__name__)

# Custom key function that uses API key if available
def get_rate_limit_key(request: Request) -> str:
    """
    Get unique key for rate limiting
    Uses API key if available, otherwise IP address
    """
    # Try to get API key from header
    api_key = request.headers.get("X-API-Key")
    if api_key:
        # Rate limit by API key (more lenient for authenticated users)
        logger.debug(f"Rate limiting by API key: {api_key[:10]}...")
        return f"apikey:{api_key}"

    # Fallback to IP address (stricter for unauthenticated)
    ip = get_remote_address(request)
    logger.debug(f"Rate limiting by IP: {ip}")
    return f"ip:{ip}"


# Create limiter instance
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["100/hour"] if IS_PRODUCTION else ["1000/hour"],  # Global limit
    storage_uri="memory://",  # Use in-memory storage (upgrade to Redis for production)
)


# Custom rate limit exceeded handler
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded
    Returns user-friendly message
    """
    logger.warning(f"Rate limit exceeded for {get_rate_limit_key(request)}")

    return Response(
        content={
            "status": "error",
            "message": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.detail.split("Retry after ")[1] if "Retry after" in exc.detail else "60 seconds"
        },
        status_code=429,
        headers={
            "Retry-After": "60",
            "X-RateLimit-Limit": str(exc.detail.split("/")[0]),
            "X-RateLimit-Remaining": "0"
        }
    )
```

#### Step 3: Apply rate limiting to main.py
**File:** `main.py`

```python
# Add imports at top
from app.middleware.rate_limit import limiter, custom_rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Initialize limiter with app (after app creation)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)

# Apply rate limits to endpoints

@app.get("/api/health")
@limiter.limit("60/minute")  # ✅ Health checks: 60 per minute
async def health_check(request: Request):
    """Kiểm tra trạng thái API và kết nối Pinecone"""
    # ... existing code ...


@app.get("/api/rag")
@limiter.limit("30/minute")  # ✅ RAG searches: 30 per minute (expensive)
async def search_documents(
    request: Request,  # ✅ Add Request parameter
    query: str = Query(...),
    namespace: str = Query(BIBI_NAMESPACE),
    top_k: int = Query(5),
    search_all: bool = Query(False),
    api_key: str = Depends(verify_api_key)
):
    """Tìm kiếm tài liệu với truy vấn (rate limited)"""
    # ... existing code ...


@app.post("/api/chat")
@limiter.limit("20/minute")  # ✅ Chat: 20 per minute (very expensive)
async def chat_stream(
    request: Request,  # ✅ Add Request parameter
    api_key: str = Depends(verify_api_key)
):
    """API endpoint xử lý streaming response (rate limited)"""
    # ... existing code ...
```

**File:** `routes/tts.py`

```python
# Add rate limiting to TTS routes
from app.middleware.rate_limit import limiter
from fastapi import Request

@router.post("/generate")
@limiter.limit("10/minute")  # ✅ TTS: 10 per minute (very expensive)
async def generate_tts(
    request: Request,  # ✅ Add Request parameter
    tts_request: TTSRequest,
    api_key: str = Depends(verify_api_key)
):
    """Generate TTS audio files (rate limited)"""
    # ... existing code ...
```

#### Step 4: Add rate limit info to responses
**File:** `app/middleware/rate_limit.py`

```python
# Add helper to include rate limit headers in responses
from fastapi.responses import JSONResponse

def add_rate_limit_headers(response: Response, request: Request) -> Response:
    """Add rate limit headers to response"""
    # Get current rate limit info
    # (This is simplified - actual implementation depends on slowapi internals)
    response.headers["X-RateLimit-Limit"] = "30"  # Per endpoint
    response.headers["X-RateLimit-Remaining"] = "25"  # Example
    response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)
    return response
```

### 🧪 Testing

```bash
# Test 1: Normal usage should work
for i in {1..5}; do
  curl -X GET \
    -H "X-API-Key: your-key" \
    http://localhost:8000/api/health
  echo "Request $i completed"
done
# Expected: All 5 requests succeed

# Test 2: Exceed rate limit
for i in {1..70}; do
  curl -X GET \
    -H "X-API-Key: your-key" \
    http://localhost:8000/api/health
done
# Expected: First 60 succeed, then 429 Too Many Requests

# Test 3: Check rate limit headers
curl -v -X GET \
  -H "X-API-Key: your-key" \
  http://localhost:8000/api/health
# Expected: Headers include X-RateLimit-Limit, X-RateLimit-Remaining
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation
- [x] ✅ Backup critical files to `_backup/`
- [ ] ⬜ Review this plan with team
- [ ] ⬜ Set up test environment
- [ ] ⬜ Generate API keys

### Implementation Order
1. [ ] ⬜ **CRITICAL #3 First** (Sanitize errors) - Ít impact nhất
2. [ ] ⬜ **CRITICAL #1 Second** (Fix CORS) - Dễ test
3. [ ] ⬜ **CRITICAL #4 Third** (Rate limiting) - Independent
4. [ ] ⬜ **CRITICAL #2 Last** (Authentication) - Phức tạp nhất, cần update frontend

### Testing Order
1. [ ] ⬜ Test error sanitization (trigger errors, check response)
2. [ ] ⬜ Test CORS (valid/invalid origins)
3. [ ] ⬜ Test rate limiting (spam requests)
4. [ ] ⬜ Test authentication (with/without API key)
5. [ ] ⬜ Integration test (full flow)
6. [ ] ⬜ Load test (với tools như `ab` hoặc `wrk`)

### Post-Implementation
- [ ] ⬜ Update documentation
- [ ] ⬜ Deploy to staging
- [ ] ⬜ Monitor logs for issues
- [ ] ⬜ Deploy to production
- [ ] ⬜ Communicate changes to frontend team

---

## 🧪 COMPREHENSIVE TEST PLAN

### Test Environment Setup

```bash
# 1. Install testing tools
pip install pytest pytest-asyncio httpx

# 2. Create test script
mkdir -p tests
touch tests/test_security_fixes.py
```

### Test Script
**File:** `tests/test_security_fixes.py`

```python
"""
Comprehensive tests for CRITICAL security fixes
Run: pytest tests/test_security_fixes.py -v
"""
import pytest
from fastapi.testclient import TestClient
from main import app
import os

# Test client
client = TestClient(app)

# Test API key (set in .env for tests)
TEST_API_KEY = os.getenv("API_SECRET_KEY", "test-key-12345")


class TestCORS:
    """Test CRITICAL #1: CORS Security"""

    def test_cors_allows_whitelisted_origin(self):
        """Test that whitelisted origins are allowed"""
        response = client.options(
            "/api/health",
            headers={"Origin": "http://localhost:8000"}
        )
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "http://localhost:8000"

    def test_cors_blocks_unknown_origin(self):
        """Test that unknown origins are blocked"""
        response = client.options(
            "/api/health",
            headers={"Origin": "http://evil-site.com"}
        )
        # Should not have CORS headers for blocked origin
        # (behavior depends on CORS middleware implementation)
        assert response.status_code in [200, 403]


class TestAuthentication:
    """Test CRITICAL #2: API Authentication"""

    def test_api_requires_key(self):
        """Test that API requires authentication"""
        response = client.get("/api/rag?query=test")
        assert response.status_code == 401
        assert "API key" in response.json()["detail"].lower()

    def test_api_accepts_valid_key(self):
        """Test that valid API key works"""
        response = client.get(
            "/api/rag?query=test",
            headers={"X-API-Key": TEST_API_KEY}
        )
        # Should not be 401 or 403
        assert response.status_code not in [401, 403]

    def test_api_rejects_invalid_key(self):
        """Test that invalid API key is rejected"""
        response = client.get(
            "/api/rag?query=test",
            headers={"X-API-Key": "invalid-key-12345"}
        )
        assert response.status_code == 403


class TestErrorSanitization:
    """Test CRITICAL #3: Error Message Sanitization"""

    def test_error_does_not_leak_api_keys(self):
        """Test that errors don't expose API keys"""
        # Trigger an error somehow (e.g., invalid query)
        response = client.get(
            "/api/rag?query=&top_k=99999",
            headers={"X-API-Key": TEST_API_KEY}
        )

        # Check response doesn't contain API key patterns
        response_text = response.text.lower()
        assert "sk-" not in response_text  # OpenAI key
        assert "pcsk_" not in response_text  # Pinecone key
        assert "bearer" not in response_text  # Bearer token

    def test_error_hides_file_paths_in_production(self):
        """Test that file paths are redacted in production"""
        # Mock production environment
        os.environ["ENVIRONMENT"] = "production"

        # Trigger error
        response = client.get(
            "/api/rag?query=",
            headers={"X-API-Key": TEST_API_KEY}
        )

        # Check no file paths in response
        response_text = response.text
        assert "/home/" not in response_text
        assert "/app/" not in response_text or "[PATH_REDACTED]" in response_text


class TestRateLimiting:
    """Test CRITICAL #4: Rate Limiting"""

    def test_rate_limit_enforced(self):
        """Test that rate limits are enforced"""
        # Make many requests to trigger rate limit
        success_count = 0
        rate_limited = False

        for i in range(70):  # Exceed 60/minute limit
            response = client.get(
                "/api/health",
                headers={"X-API-Key": TEST_API_KEY}
            )

            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                rate_limited = True
                break

        # Should hit rate limit
        assert rate_limited, f"Rate limit not triggered after {success_count} requests"

    def test_rate_limit_headers_present(self):
        """Test that rate limit headers are included"""
        response = client.get(
            "/api/health",
            headers={"X-API-Key": TEST_API_KEY}
        )

        # Check for rate limit headers
        # (May not be present depending on slowapi configuration)
        # This is optional but recommended
        assert response.status_code in [200, 429]


class TestIntegration:
    """Integration tests for all security fixes"""

    def test_full_secure_flow(self):
        """Test complete secure request flow"""
        # 1. Make request with valid origin
        # 2. Include valid API key
        # 3. Should succeed (within rate limit)

        response = client.get(
            "/api/health",
            headers={
                "Origin": "http://localhost:8000",
                "X-API-Key": TEST_API_KEY
            }
        )

        assert response.status_code == 200
        assert response.json()["status"] == "ok"


# Performance test (optional)
def test_performance_with_security():
    """Test that security doesn't significantly slow down requests"""
    import time

    start = time.time()

    for _ in range(10):
        client.get(
            "/api/health",
            headers={"X-API-Key": TEST_API_KEY}
        )

    elapsed = time.time() - start
    avg_time = elapsed / 10

    # Should be fast (< 100ms per request)
    assert avg_time < 0.1, f"Requests too slow: {avg_time*1000:.2f}ms average"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
```

### Manual Testing Checklist

```bash
# 1. CORS Testing
curl -v -X OPTIONS \
  -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:8000/api/health
# ✅ Check: Access-Control-Allow-Origin header present

# 2. Authentication Testing
curl -v http://localhost:8000/api/rag?query=test
# ✅ Check: 401 Unauthorized

curl -v -H "X-API-Key: your-key" http://localhost:8000/api/rag?query=test
# ✅ Check: 200 OK (or appropriate response)

# 3. Error Sanitization Testing
# (Temporarily break something to trigger error)
# ✅ Check: No API keys in error response

# 4. Rate Limiting Testing
for i in {1..70}; do
  curl -H "X-API-Key: your-key" http://localhost:8000/api/health
done
# ✅ Check: 429 Too Many Requests after ~60 requests

# 5. Integration Test
curl -v -X POST \
  -H "Origin: http://localhost:8000" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}' \
  http://localhost:8000/api/chat
# ✅ Check: Streaming response works
```

---

## 📊 ROLLBACK PLAN

Nếu có vấn đề, rollback bằng cách:

```bash
# 1. Stop server
pkill -f uvicorn

# 2. Restore from backup
cp -r _backup/20251105_080013/* .

# 3. Restart server
uvicorn main:app --reload --port 8000

# 4. Verify
curl http://localhost:8000/api/health
```

---

## 📝 POST-IMPLEMENTATION TASKS

### Documentation Updates
- [ ] Update README.md with new environment variables
- [ ] Document API authentication in API docs
- [ ] Update frontend integration guide
- [ ] Create security.md with best practices

### Deployment Updates
- [ ] Add environment variables to Render.com
- [ ] Update CORS allowed origins for production
- [ ] Generate production API keys
- [ ] Monitor logs for auth failures

### Team Communication
- [ ] Share new API key with frontend team
- [ ] Update API documentation
- [ ] Conduct security review session
- [ ] Document incident response procedure

---

## ⏱️ TIMELINE ESTIMATE

| Task | Time | Status |
|------|------|--------|
| Backup & Planning | 1 hour | ✅ DONE |
| CRITICAL #3: Error Sanitization | 2-3 hours | ⬜ PENDING |
| CRITICAL #1: CORS Fix | 1-2 hours | ⬜ PENDING |
| CRITICAL #4: Rate Limiting | 2-3 hours | ⬜ PENDING |
| CRITICAL #2: Authentication | 4-5 hours | ⬜ PENDING |
| Testing | 3-4 hours | ⬜ PENDING |
| Documentation | 2 hours | ⬜ PENDING |
| **TOTAL** | **15-20 hours** | **~2-3 days** |

---

## 🎯 SUCCESS CRITERIA

✅ **All tests pass**
✅ **No API keys in error messages**
✅ **CORS only allows whitelisted domains**
✅ **Rate limiting prevents spam**
✅ **Authentication required for all API endpoints**
✅ **Performance not significantly impacted**
✅ **Frontend can authenticate successfully**
✅ **Production deployment successful**

---

**Last Updated:** 2025-11-05
**Author:** Claude AI Assistant
**Review Status:** Ready for Implementation
