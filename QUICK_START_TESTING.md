# 🚀 QUICK START - Testing Security Fixes

**5 phút để test xem security fixes có hoạt động không!**

---

## 📋 Checklist Nhanh

- [ ] Generate API key
- [ ] Start server
- [ ] Test authentication
- [ ] Test rate limiting
- [ ] Test error sanitization
- [ ] Test CORS

---

## Step 1: Generate API Key (30 giây)

```bash
# Generate secure API key
python scripts/generate_api_key.py
```

**Output mẫu:**
```
======================================================================
🔑 BiBi API Key Generated
======================================================================

📋 API Key (add to .env file):
   API_SECRET_KEY=bibi_abc123xyz...

🔐 Hash (for verification/storage):
   def456...

⚠️  IMPORTANT INSTRUCTIONS:
   1. Copy the line above and add to your .env file
   ...
======================================================================
```

**Action:** Copy dòng `API_SECRET_KEY=...` và tạo/update file `.env`:

```bash
# Tạo/update .env file
nano .env

# Paste vào:
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
API_SECRET_KEY=bibi_<your-generated-key-here>
OPENAI_API_KEY=sk-<your-openai-key>
PINECONE_API_KEY=pcsk_<your-pinecone-key>
PINECONE_INDEX=bibi-chatbot-k12
```

---

## Step 2: Install Dependencies (30 giây)

```bash
# Install slowapi (new dependency)
pip install slowapi
```

---

## Step 3: Start Server (10 giây)

```bash
# Start FastAPI server
uvicorn main:app --reload --port 8000
```

**Check server logs - Should see:**
```
✅ Đã kết nối thành công với dịch vụ RAG - Pinecone index: bibi-chatbot-k12
🔒 Environment: development (Production: False)
🔒 CORS enabled for origins: ['http://localhost:8000', 'http://127.0.0.1:8000']
🔒 API Authentication: ENABLED (key: bibi_abc12...)
🔒 Rate limiting enabled: 1000/hour (global)
```

✅ **Nếu thấy logs như trên = SUCCESS!**

---

## Step 4: Test Authentication (1 phút)

### Test 4a: No API Key (Should FAIL)

```bash
# Try without API key
curl http://localhost:8000/api/health
```

**Expected Output:**
```json
{
  "detail": "Missing API key. Include 'X-API-Key' header in your request."
}
```

✅ **Nếu thấy error = Authentication đang hoạt động!**

### Test 4b: With Valid API Key (Should WORK)

```bash
# Replace YOUR_KEY với key từ .env
curl -H "X-API-Key: bibi_YOUR_KEY_HERE" http://localhost:8000/api/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "message": "BiBi RAG API đang hoạt động",
  "version": "2.0.0",
  ...
}
```

✅ **Nếu thấy status: ok = Authentication SUCCESS!**

### Test 4c: Invalid API Key (Should FAIL)

```bash
# Try with wrong key
curl -H "X-API-Key: wrong-key-12345" http://localhost:8000/api/health
```

**Expected Output:**
```json
{
  "detail": "Invalid API key. Please check your credentials."
}
```

✅ **Nếu thấy error = Authentication đang block invalid keys!**

---

## Step 5: Test Rate Limiting (1 phút)

```bash
# Spam 70 requests (limit is 60/minute for health endpoint)
for i in {1..70}; do
  response=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "X-API-Key: YOUR_KEY" \
    http://localhost:8000/api/health)
  echo "Request $i: HTTP $response"

  # Stop when rate limited
  if [ "$response" = "429" ]; then
    echo "✅ Rate limit triggered at request $i!"
    break
  fi
done
```

**Expected:** First ~60 requests = 200, then 429 (Too Many Requests)

✅ **Nếu thấy 429 after ~60 requests = Rate Limiting WORKS!**

---

## Step 6: Test Error Sanitization (1 phút)

### Trigger error by using invalid API key in .env:

```bash
# 1. Stop server (Ctrl+C)

# 2. Edit .env - temporarily break OPENAI_API_KEY
nano .env
# Change to: OPENAI_API_KEY=sk-invalid-test

# 3. Restart server
uvicorn main:app --reload --port 8000

# 4. Try to use chat endpoint
curl -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}' \
  http://localhost:8000/api/chat
```

**Expected Output:**
```json
{
  "status": "error",
  "message": "Service authentication error. Please contact support."
}
```

✅ **Check: NO "sk-..." visible in response = Error Sanitization WORKS!**

**Restore your real OpenAI key after test!**

---

## Step 7: Test CORS (1 phút)

### Test from browser console:

1. Open browser: `http://localhost:8000`
2. Open DevTools Console (F12)
3. Run this JavaScript:

```javascript
// Test API call with CORS
fetch('http://localhost:8000/api/health', {
    headers: {
        'X-API-Key': 'YOUR_KEY_HERE'
    }
})
.then(r => r.json())
.then(data => console.log('✅ CORS works!', data))
.catch(err => console.error('❌ CORS blocked!', err));
```

**Expected:** No CORS errors in console, data displayed

✅ **Nếu thấy data = CORS configuration works!**

### Test blocked origin:

```bash
# Try from invalid origin (should be blocked)
curl -v -X OPTIONS \
  -H "Origin: http://evil-site.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:8000/api/health
```

**Expected:** No `access-control-allow-origin: http://evil-site.com` header

✅ **Nếu không thấy CORS header cho evil-site = Blocking works!**

---

## ✅ Final Checklist

| Test | Status | Notes |
|------|--------|-------|
| ✅ API key generated | [ ] | Ran `python scripts/generate_api_key.py` |
| ✅ Server starts without errors | [ ] | See security logs in console |
| ✅ Auth: No key = 401 | [ ] | `curl http://localhost:8000/api/health` |
| ✅ Auth: Valid key = 200 | [ ] | `curl -H "X-API-Key: ..." ...` |
| ✅ Auth: Invalid key = 403 | [ ] | `curl -H "X-API-Key: wrong" ...` |
| ✅ Rate limit: 429 after 60 req | [ ] | Spam health endpoint |
| ✅ Error: No API keys leaked | [ ] | Break OPENAI_API_KEY, test chat |
| ✅ CORS: localhost allowed | [ ] | Fetch from browser console |
| ✅ CORS: other origins blocked | [ ] | Try evil-site.com origin |

---

## 🐛 Troubleshooting

### Issue: "slowapi not found"
```bash
pip install slowapi>=0.1.9
```

### Issue: "API_SECRET_KEY not set"
```bash
# Generate key
python scripts/generate_api_key.py

# Add to .env
echo "API_SECRET_KEY=bibi_..." >> .env
```

### Issue: "All requests return 401"
**Solution:** Check API key in `.env` matches key in curl command

### Issue: "Rate limiting not working"
**Solution:**
```bash
# Check slowapi installed
pip show slowapi

# Restart server
# Check logs for: "🔒 Rate limiting enabled"
```

### Issue: "CORS errors in browser"
**Solution:**
```bash
# Check .env has correct origins
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

# Restart server
```

---

## 📊 Summary - What Changed?

| Before | After |
|--------|-------|
| ❌ `allow_origins=["*"]` | ✅ `allow_origins=ALLOWED_ORIGINS` |
| ❌ No authentication | ✅ X-API-Key header required |
| ❌ Errors leak API keys | ✅ All errors sanitized |
| ❌ Unlimited requests | ✅ Rate limits per endpoint |
| ❌ `print()` statements | ✅ Proper `logger` usage |

---

## 🚀 Next Steps

1. **Update Frontend**: Add `X-API-Key` header to all API calls
   ```javascript
   // In static/js/controllers/api.js
   const headers = {
       'Content-Type': 'application/json',
       'X-API-Key': 'bibi_your_key_here'
   };
   ```

2. **Deploy to Production**:
   - Add environment variables to Render.com:
     - `ENVIRONMENT=production`
     - `ALLOWED_ORIGINS=https://your-domain.com`
     - `API_SECRET_KEY=bibi_...`

3. **Monitor**:
   - Check logs for 401/403 (auth failures)
   - Check logs for 429 (rate limit hits)
   - Monitor for any error leaks

---

## 📞 Need Help?

- Review full plan: `SECURITY_FIX_PLAN.md`
- Detailed testing: `TESTING_GUIDE.md`
- Check server logs for clues
- Verify all environment variables set correctly

---

**Congratulations! 🎉**

Bạn đã implement và test thành công 4 CRITICAL security fixes!
Your API is now much more secure. 🔒
