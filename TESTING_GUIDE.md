# 🧪 TESTING GUIDE - Security Fixes

**Quick guide để test các CRITICAL security fixes**

---

## 📋 PRE-TEST SETUP

### 1. Install Dependencies

```bash
# Install testing tools
pip install pytest pytest-asyncio httpx slowapi

# Verify installation
pytest --version
```

### 2. Generate API Key

```bash
# Run the key generation script
python scripts/generate_api_key.py

# Copy the generated key to .env
# Example: API_SECRET_KEY=bibi_abc123xyz...
```

### 3. Configure Environment

```bash
# Edit .env file
nano .env

# Add these variables:
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
ENVIRONMENT=development
API_SECRET_KEY=<your-generated-key>
```

### 4. Start Server

```bash
# Terminal 1: Start the server
uvicorn main:app --reload --port 8000

# Wait for: "Application startup complete"
```

---

## 🧪 TEST SUITE 1: CORS Security (CRITICAL #1)

### ✅ Test 1.1: Valid Origin (Should Work)

```bash
# Test with localhost origin
curl -v -X OPTIONS \
  -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:8000/api/health
```

**Expected Result:**
```
< HTTP/1.1 200 OK
< access-control-allow-origin: http://localhost:8000
< access-control-allow-credentials: true
```

### ❌ Test 1.2: Invalid Origin (Should Block)

```bash
# Test with evil site origin
curl -v -X OPTIONS \
  -H "Origin: http://evil-site.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:8000/api/health
```

**Expected Result:**
- **No** `access-control-allow-origin` header for evil-site.com
- Origin should be blocked

### 📊 Test 1.3: Check CORS Configuration

```bash
# Check server logs for CORS config
# Should see: "🔒 CORS enabled for origins: ['http://localhost:8000', ...]"
```

**Pass Criteria:**
- ✅ Valid origins allowed
- ✅ Invalid origins blocked
- ✅ No wildcard (*) in config

---

## 🔐 TEST SUITE 2: Authentication (CRITICAL #2)

### ❌ Test 2.1: No API Key (Should Fail)

```bash
# Try to access API without key
curl -v http://localhost:8000/api/rag?query=test
```

**Expected Result:**
```json
{
  "status_code": 401,
  "detail": "Missing API key. Include X-API-Key header."
}
```

### ✅ Test 2.2: Valid API Key (Should Work)

```bash
# Replace YOUR_KEY with actual key from .env
curl -v \
  -H "X-API-Key: YOUR_KEY" \
  http://localhost:8000/api/rag?query=grammar
```

**Expected Result:**
```json
{
  "status": "success",
  "query": "grammar",
  "results": [...]
}
```

### ❌ Test 2.3: Invalid API Key (Should Fail)

```bash
# Try with wrong key
curl -v \
  -H "X-API-Key: wrong-key-12345" \
  http://localhost:8000/api/rag?query=test
```

**Expected Result:**
```json
{
  "status_code": 403,
  "detail": "Invalid API key"
}
```

### ✅ Test 2.4: Chat Endpoint Authentication

```bash
# Test chat endpoint with valid key
curl -v -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}' \
  http://localhost:8000/api/chat
```

**Expected Result:**
- Streaming response starts
- No 401/403 errors

### 📊 Test 2.5: Check Logs

```bash
# Server logs should show:
# ✅ API key validated successfully
# (when using valid key)

# ❌ Invalid API key attempt: wrong-key...
# (when using invalid key)
```

**Pass Criteria:**
- ✅ All endpoints require API key
- ✅ Valid keys accepted
- ✅ Invalid keys rejected
- ✅ Proper error messages

---

## 🛡️ TEST SUITE 3: Error Sanitization (CRITICAL #3)

### Test 3.1: Trigger OpenAI Error

```bash
# Temporarily break OPENAI_API_KEY in .env to trigger error
# Change to: OPENAI_API_KEY=sk-invalid-key-for-testing

# Restart server, then:
curl -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}' \
  http://localhost:8000/api/chat
```

**Expected Result:**
```json
{
  "status": "error",
  "message": "AI service error. Please try again."
  // ❌ Should NOT contain: "sk-..." or actual API key
}
```

### Test 3.2: Check Error Doesn't Leak Keys

```bash
# Search response for sensitive data
# Run test above, capture output:
curl ... > response.txt

# Check for leaks:
grep -i "sk-" response.txt    # Should be empty
grep -i "pcsk_" response.txt  # Should be empty
grep -i "/home/" response.txt # Should be empty or [REDACTED]
```

**Expected Result:**
- ✅ No API keys in response
- ✅ No file paths in response (production)
- ✅ Generic error message

### Test 3.3: Development vs Production Errors

```bash
# Development (detailed errors)
# Set in .env: ENVIRONMENT=development
# Restart server
curl http://localhost:8000/api/rag?query=

# Should include details (but sanitized)

# Production (generic errors)
# Set in .env: ENVIRONMENT=production
# Restart server
curl http://localhost:8000/api/rag?query=

# Should be generic: "An error occurred. Please contact support."
```

**Pass Criteria:**
- ✅ No API keys in any error
- ✅ No sensitive paths in errors
- ✅ Different verbosity for dev/prod
- ✅ Full errors logged (check console)

---

## ⏱️ TEST SUITE 4: Rate Limiting (CRITICAL #4)

### Test 4.1: Normal Usage (Should Work)

```bash
# Make 5 requests (well under limit)
for i in {1..5}; do
  curl -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/health
  echo "Request $i completed"
  sleep 0.5
done
```

**Expected Result:**
```
Request 1 completed
Request 2 completed
Request 3 completed
Request 4 completed
Request 5 completed
```
All succeed with 200 OK

### ❌ Test 4.2: Exceed Rate Limit (Should Fail)

```bash
# Spam requests to trigger limit
# /api/health has 60/minute limit

for i in {1..70}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-API-Key: YOUR_KEY" \
    http://localhost:8000/api/health)

  echo "Request $i: HTTP $response"

  # Stop if rate limited
  if [ "$response" = "429" ]; then
    echo "✅ Rate limit triggered at request $i"
    break
  fi
done
```

**Expected Result:**
```
Request 1: HTTP 200
Request 2: HTTP 200
...
Request 60: HTTP 200
Request 61: HTTP 429  ✅ Rate limit kicked in!
```

### Test 4.3: Check Rate Limit Response

```bash
# Make requests until rate limited
# Then check the 429 response

curl -v -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/health
# (repeat until 429)
```

**Expected Result:**
```json
{
  "status": "error",
  "message": "Rate limit exceeded. Please try again later.",
  "retry_after": "60 seconds"
}

HTTP Headers:
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

### Test 4.4: Different Limits for Different Endpoints

```bash
# Test /api/chat (20/minute limit)
for i in {1..25}; do
  curl -s -o /dev/null -w "Chat $i: %{http_code}\n" \
    -X POST \
    -H "X-API-Key: YOUR_KEY" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"hi"}]}' \
    http://localhost:8000/api/chat
done

# Should get 429 after ~20 requests
```

### Test 4.5: Rate Limit Resets After Time

```bash
# Hit rate limit
for i in {1..70}; do
  curl -s -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/health > /dev/null
done

# Try request (should fail)
curl -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/health
# Expected: 429 Too Many Requests

# Wait 60 seconds
echo "Waiting 60 seconds for rate limit reset..."
sleep 60

# Try again (should work)
curl -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/health
# Expected: 200 OK ✅
```

**Pass Criteria:**
- ✅ Rate limits enforced per endpoint
- ✅ 429 status code when exceeded
- ✅ Proper retry-after headers
- ✅ Limits reset after time window

---

## 🔗 TEST SUITE 5: Integration Tests

### Test 5.1: Full Secure Request Flow

```bash
# Complete flow: CORS + Auth + Rate Limit + Error Handling
curl -v -X POST \
  -H "Origin: http://localhost:8000" \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are the grammar rules?"}
    ]
  }' \
  http://localhost:8000/api/chat
```

**Expected Result:**
- ✅ CORS headers present
- ✅ Authentication succeeds
- ✅ Under rate limit
- ✅ Streaming response works
- ✅ No errors

### Test 5.2: RAG Search with Full Security

```bash
# Test RAG endpoint with all security
curl -v \
  -H "Origin: http://localhost:8000" \
  -H "X-API-Key: YOUR_KEY" \
  "http://localhost:8000/api/rag?query=past+tense&namespace=bibi_grammar&top_k=3"
```

**Expected Result:**
```json
{
  "status": "success",
  "query": "past tense",
  "namespace": "bibi_grammar",
  "results": [
    {
      "content": "...",
      "metadata": {...}
    }
  ]
}
```

### Test 5.3: Frontend Integration Test

**File:** `test_frontend.html` (create this)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Security Test</title>
</head>
<body>
    <h1>Frontend Security Test</h1>
    <button onclick="testAPI()">Test API Call</button>
    <pre id="result"></pre>

    <script>
        const API_KEY = 'YOUR_KEY_HERE';  // Replace with actual key

        async function testAPI() {
            try {
                const response = await fetch('/api/health', {
                    headers: {
                        'X-API-Key': API_KEY
                    }
                });

                const data = await response.json();
                document.getElementById('result').textContent =
                    JSON.stringify(data, null, 2);

                console.log('✅ API call successful:', data);
            } catch (error) {
                console.error('❌ API call failed:', error);
                document.getElementById('result').textContent =
                    'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

**Test Steps:**
1. Save file to `static/test_frontend.html`
2. Open browser: `http://localhost:8000/static/test_frontend.html`
3. Click "Test API Call" button
4. Check console and result display

**Expected Result:**
```json
{
  "status": "ok",
  "message": "BiBi RAG API đang hoạt động",
  "version": "2.0.0",
  ...
}
```

**Pass Criteria:**
- ✅ All requests work with proper auth
- ✅ No CORS errors in browser console
- ✅ Frontend can authenticate
- ✅ Rate limits respected

---

## 🤖 AUTOMATED TEST SUITE

### Run Pytest Tests

```bash
# Run all tests
pytest tests/test_security_fixes.py -v

# Run specific test class
pytest tests/test_security_fixes.py::TestAuthentication -v

# Run with coverage
pytest tests/test_security_fixes.py --cov=app --cov-report=html

# Run with detailed output
pytest tests/test_security_fixes.py -v -s --tb=short
```

**Expected Output:**
```
tests/test_security_fixes.py::TestCORS::test_cors_allows_whitelisted_origin PASSED
tests/test_security_fixes.py::TestCORS::test_cors_blocks_unknown_origin PASSED
tests/test_security_fixes.py::TestAuthentication::test_api_requires_key PASSED
tests/test_security_fixes.py::TestAuthentication::test_api_accepts_valid_key PASSED
tests/test_security_fixes.py::TestAuthentication::test_api_rejects_invalid_key PASSED
tests/test_security_fixes.py::TestErrorSanitization::test_error_does_not_leak_api_keys PASSED
tests/test_security_fixes.py::TestRateLimiting::test_rate_limit_enforced PASSED

======================== 7 passed in 3.45s ========================
```

---

## 📊 PERFORMANCE TEST

### Test Performance Impact

```bash
# Install Apache Bench
sudo apt-get install apache2-utils  # Linux
# or
brew install apache2-utils  # Mac

# Baseline test (before security)
ab -n 100 -c 10 http://localhost:8000/api/health

# After security test
ab -n 100 -c 10 \
  -H "X-API-Key: YOUR_KEY" \
  http://localhost:8000/api/health
```

**Expected Result:**
- Average request time should not increase significantly
- Should be < 100ms per request for health endpoint
- Rate limiting should kick in after ~60 requests

**Sample Output:**
```
Requests per second:    50.23 [#/sec] (mean)
Time per request:       19.907 [ms] (mean)
Time per request:       1.991 [ms] (mean, across all concurrent requests)

Percentage of the requests served within a certain time (ms)
  50%     18
  95%     45
  99%     78
```

---

## ✅ FINAL VERIFICATION CHECKLIST

Print this checklist and mark each item as you test:

### CORS Security
- [ ] ✅ Whitelisted origins allowed
- [ ] ❌ Random origins blocked
- [ ] ✅ No wildcard `*` in config
- [ ] ✅ CORS headers correct

### Authentication
- [ ] ❌ Requests without API key fail (401)
- [ ] ✅ Requests with valid key succeed
- [ ] ❌ Requests with invalid key fail (403)
- [ ] ✅ All protected endpoints require auth
- [ ] ✅ Frontend can authenticate

### Error Sanitization
- [ ] ✅ No API keys in error messages
- [ ] ✅ No file paths in production errors
- [ ] ✅ Different errors for dev/prod
- [ ] ✅ Full errors in server logs

### Rate Limiting
- [ ] ✅ Normal usage works
- [ ] ❌ Excessive requests blocked (429)
- [ ] ✅ Different limits per endpoint
- [ ] ✅ Rate limit headers present
- [ ] ✅ Limits reset after time

### Integration
- [ ] ✅ Full request flow works
- [ ] ✅ Frontend integration works
- [ ] ✅ Performance not degraded
- [ ] ✅ All automated tests pass

---

## 🚨 TROUBLESHOOTING

### Issue: CORS still allows all origins
**Solution:**
```bash
# Check .env file
cat .env | grep ALLOWED_ORIGINS

# Should be specific domains, not "*"
# Restart server after .env changes
```

### Issue: API key not working
**Solution:**
```bash
# Verify API key in .env
cat .env | grep API_SECRET_KEY

# Check logs for validation errors
# Look for: "❌ Invalid API key attempt"
```

### Issue: Rate limit not working
**Solution:**
```bash
# Check slowapi installed
pip show slowapi

# Verify limiter initialized
# Check logs for: "Rate limiting enabled"
```

### Issue: Tests failing
**Solution:**
```bash
# Update .env with test key
export API_SECRET_KEY="test-key-12345"

# Clear cache and rerun
pytest --cache-clear tests/test_security_fixes.py -v
```

---

## 📞 SUPPORT

If you encounter issues:

1. Check server logs in console
2. Review `SECURITY_FIX_PLAN.md` for implementation details
3. Verify all environment variables set correctly
4. Test each component individually
5. Check backup in `_backup/` if need to rollback

**Backup Location:** `_backup/20251105_080013/`

---

**Last Updated:** 2025-11-05
**Status:** Ready for Testing
