# Voice Chat Testing Checklist

## Prerequisites
- [ ] Gemini API key set in `.env` or `server/.env`
- [ ] Modern browser (Chrome, Edge, or Firefox recommended)
- [ ] Microphone connected and working
- [ ] HTTPS connection (or localhost for testing)

## Setup Steps

### 1. Environment Configuration
```bash
# In server/.env or .env
GEMINI_API_KEY=your_actual_api_key_here
SIMULATED_AI=false
NODE_ENV=development
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Backend
```bash
npm run server
```
**Expected Output:**
```
🔍 Server Starting...
📂 Current Working Directory: ...
🔗 DATABASE_URL: ...
🚀 Voxterna Backend running on port 3000
```

### 4. Start Frontend
```bash
npm run dev
```
**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Testing Flow

### Test 1: Basic Voice Session
1. [ ] Open browser to `http://localhost:5173`
2. [ ] Log in or navigate to `/interact/username`
3. [ ] Click **"START VOICE"** button
4. [ ] Grant microphone permissions when prompted
5. [ ] Wait for status to show **"🟢 LIVE"**
6. [ ] Speak: "Hello, can you hear me?"
7. [ ] Verify:
   - [ ] Text appears in chat overlay
   - [ ] Avatar responds with voice
   - [ ] Avatar lips move (isSpeaking animation)
   - [ ] Response is contextually relevant

### Test 2: Hybrid Mode (Voice + Text)
1. [ ] While in voice mode, type a message in the text input
2. [ ] Press Enter or click Send
3. [ ] Verify:
   - [ ] Message appears in chat
   - [ ] Avatar responds with voice
   - [ ] Both voice and text inputs work seamlessly

### Test 3: Conversation History
1. [ ] Have a 3-5 message conversation in voice mode
2. [ ] End voice mode (click "END CALL")
3. [ ] Refresh the page
4. [ ] Start voice mode again
5. [ ] Verify:
   - [ ] Previous messages visible in chat
   - [ ] Avatar remembers context from earlier
   - [ ] New conversation continues smoothly

### Test 4: Fact Learning
1. [ ] In voice mode, say: "You love playing guitar"
2. [ ] Wait for response
3. [ ] Later, ask: "What do you love doing?"
4. [ ] Verify:
   - [ ] Avatar mentions guitar in response
   - [ ] Fact was learned and stored
   - [ ] Check database for new LEARNED_FROM_GUEST entry

### Test 5: Question Tracking
1. [ ] Ask a biographical question: "Where did you go to school?"
2. [ ] Verify:
   - [ ] Avatar responds (may say "I don't know" if not trained)
   - [ ] Check database for GUEST_QUESTION entry
   - [ ] Host can see this question in training mode

### Test 6: Error Handling
1. [ ] Deny microphone access
2. [ ] Verify error message appears
3. [ ] Grant access and try again
4. [ ] Test with invalid Gemini API key
5. [ ] Verify graceful error handling

### Test 7: Session Cleanup
1. [ ] Start voice mode
2. [ ] Close browser tab
3. [ ] Check server logs for cleanup message
4. [ ] Verify no memory leaks

## Browser Console Checks

### Expected Logs (Frontend)
```
🆕 New Visitor Session Started: [UUID]
🎙️ Starting voice mode...
🎤 Audio recording started
✅ Voice session ready
✅ Voice mode started
```

### Expected Logs (Backend)
```
🎙️ Starting live voice session: username:visitor-id
✅ Voice session ready: username:visitor-id
🧠 Adaptive Learning: Analyzing message for new facts...
💡 LEARNED NEW FACT: "..." (if applicable)
👋 Ended voice session: username:visitor-id
```

## Network Tab Checks
1. [ ] Open DevTools → Network tab
2. [ ] Filter: WS (WebSocket)
3. [ ] Verify:
   - [ ] Socket.io connection established
   - [ ] `start-voice-session` emitted
   - [ ] `voice-text-chunk` events streaming
   - [ ] No disconnections or errors

## Performance Metrics

### Latency Test
1. [ ] Say "Hello" and measure time to first response
2. [ ] Target: < 2 seconds
3. [ ] Check browser console for timestamps
4. [ ] If slow, check:
   - [ ] Internet connection
   - [ ] Gemini API response time
   - [ ] Server CPU usage

### Audio Quality Test
1. [ ] Speak clearly: "The quick brown fox jumps over the lazy dog"
2. [ ] Verify transcription accuracy in chat
3. [ ] If poor quality, adjust:
   - [ ] Microphone settings
   - [ ] Sample rate in audio-utils.ts
   - [ ] Noise suppression settings

## Troubleshooting

### Issue: "Failed to start voice mode"
**Checks:**
- [ ] Microphone permissions granted?
- [ ] Browser supports Web Audio API?
- [ ] HTTPS or localhost?
- [ ] Check console for specific error

### Issue: "No response from avatar"
**Checks:**
- [ ] Gemini API key valid?
- [ ] Server logs show errors?
- [ ] WebSocket connected?
- [ ] Rate limit exceeded?

### Issue: "Choppy or robotic voice"
**Checks:**
- [ ] Browser TTS settings
- [ ] System audio settings
- [ ] Try different browser
- [ ] Check available voices in browser

### Issue: "Voice not stopping"
**Checks:**
- [ ] Click "END CALL"
- [ ] Refresh page
- [ ] Check if multiple sessions active
- [ ] Restart server

## Database Verification

### Check Messages Table
```sql
SELECT * FROM Message 
WHERE visitorId = 'your-visitor-id' 
ORDER BY createdAt DESC 
LIMIT 10;
```

### Check Memories Table
```sql
SELECT * FROM Memory 
WHERE type IN ('LEARNED_FROM_GUEST', 'GUEST_QUESTION') 
ORDER BY createdAt DESC 
LIMIT 10;
```

## Multi-User Testing
1. [ ] Open two browser windows (incognito + normal)
2. [ ] Both start voice mode on same profile
3. [ ] Verify:
   - [ ] Conversations are isolated
   - [ ] No cross-talk between sessions
   - [ ] Each has unique visitorId

## Mobile Testing (Optional)
1. [ ] Open on mobile browser
2. [ ] Try voice mode
3. [ ] Note: May require HTTPS in production

## Production Readiness

Before deploying:
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS origins in server/index.ts
- [ ] Set strong JWT_SECRET
- [ ] Use production database (not SQLite)
- [ ] Enable HTTPS
- [ ] Test on production domain
- [ ] Monitor API costs
- [ ] Set up error logging

## Success Criteria
✅ All tests pass
✅ No console errors
✅ Smooth user experience
✅ Conversation history preserved
✅ Facts and questions saved
✅ Performance acceptable (< 2s latency)

---

## Notes
- First run may be slower (model initialization)
- Gemini API may have rate limits
- TTS voice quality depends on browser
- Some browsers need HTTPS for microphone access

## Next Steps
1. ✅ Complete all tests
2. 🎨 Customize voice/persona
3. 📊 Monitor performance
4. 🚀 Deploy to production
