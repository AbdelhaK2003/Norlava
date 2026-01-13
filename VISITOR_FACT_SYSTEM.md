# Visitor Fact Approval System - Implementation Guide

## Overview
A complete system for extracting facts from visitor conversations, queuing them for user approval, and automatically integrating approved facts into the AI's knowledge base.

## Architecture

### Data Flow
```
Visitor Message → AI Response
         ↓
   Fact Extraction (Gemini)
         ↓
   Add to pendingFacts (DB)
         ↓
   User Reviews in Dashboard
         ↓
   Approve/Reject Decision
         ↓
   Move to learnedFacts + Update aiContext
         ↓
   AI uses learned facts in next conversation
```

## Implementation Details

### 1. Backend Components

#### A. Fact Extraction (server/index.ts)
**When:** After AI generates a response to visitor message
**How:** 
- Analyzes visitor message with Gemini 2.5 Flash
- Extracts biographical facts about the profile owner
- Stores facts in `Profile.pendingFacts` (JSON array)
- Avoids duplicates by checking existing pending facts

```typescript
// Fact Extraction Prompt
"Extract any facts about ${hostUser.firstName} that the visitor revealed or mentioned"
- Explicit facts ("I go to Harvard")
- Soft facts ("You're really chill")
- Convert 2nd person to 1st person
- IGNORE temporary states and greetings
```

**Key Features:**
- Runs asynchronously (non-blocking chat)
- JSON parsing/stringifying for array management
- Duplicate detection using case-insensitive comparison
- Logs extracted facts to console for debugging

#### B. Facts API Routes (server/routes/facts.ts)
**Endpoint:** `/api/facts`

**1. GET /pending-facts**
- Returns array of pending facts awaiting approval
- Requires JWT authentication
- Returns: `["fact1", "fact2", ...]`

**2. GET /statistics**
- Real-time conversation metrics
- Returns:
  ```json
  {
    "totalMessages": 142,
    "uniqueVisitors": 23,
    "learnedFacts": 5,
    "pendingFacts": 3
  }
  ```

**3. POST /approve-fact**
- Move fact from pending to learned
- Update aiContext with learned facts section
- Body: `{ "factIndex": 0 }`
- Returns updated pendingFacts and learnedFacts arrays

**4. POST /reject-fact**
- Remove fact from pending queue
- Body: `{ "factIndex": 0 }`
- Returns updated pendingFacts array

#### C. AI Context Integration
**When:** AI generates response
**Updates:**
1. Parse learned facts from `Profile.learnedFacts`
2. Add to aiBrain prompt:
   ```
   FACTS I'VE LEARNED FROM VISITOR CONVERSATIONS:
   • I am creative and love design
   • I work in tech industry
   • I'm passionate about environmental sustainability
   ```
3. Learned facts included BEFORE writing style instruction
4. Affects all subsequent responses

### 2. Frontend Components

#### A. PendingFacts.tsx
**Location:** `src/components/PendingFacts.tsx`
**Features:**
- Displays pending facts as scrollable list
- Approve button (green checkmark) → moves to learned
- Reject button (red X) → deletes pending fact
- Optimistic UI updates (remove immediately, rollback on error)
- Loading states and animations
- Toast notifications for success/failure

**Props:** None (uses API directly)
**State Management:**
- facts: `Array<{fact: string, index: number}>`
- loading: boolean
- approvingIndex: number | null
- rejectingIndex: number | null

#### B. Statistics.tsx
**Location:** `src/components/Statistics.tsx`
**Features:**
- 4-card grid layout
- Real-time metrics with animations
- Color-coded cards (blue, purple, emerald, amber)
- Instant loads on page load (no skeleton)
- Auto-refresh every 30 seconds (optional)

**Stats Cards:**
1. Total Messages (blue)
2. Unique Visitors (purple)
3. Learned Facts (emerald)
4. Pending Review (amber - highlighted if > 0)

#### C. Dashboard Integration
**Location:** `src/pages/Dashboard.tsx`
**Changes:**
- Added imports for Statistics and PendingFacts
- Positioned after hero section, before memory carousel
- Section headers with colored bars
- Both components load independently

### 3. Database Schema

#### Profile Model (Prisma)
```prisma
model Profile {
  ...existing fields...
  bio           String?      // Free-text biography
  writingStyle  String?      // Sample of user's writing for AI to mimic
  learnedFacts  String?      // JSON array: ["fact1", "fact2", ...]
  pendingFacts  String?      // JSON array: ["fact1", "fact2", ...]
}
```

**Migration:** `20260113194314_add_pending_facts`

### 4. API Integration (lib/api.ts)
**Axios Instance Configuration:**
- Auto-includes JWT token in Authorization header
- baseURL: VITE_API_URL or localhost:3000/api
- withCredentials: true for CORS

**Usage:**
```typescript
const { data } = await api.get('/facts/pending-facts');
await api.post('/facts/approve-fact', { factIndex: 0 });
```

## User Workflow

### 1. Visitor Interaction Phase
```
Visitor → Chat with Avatar → Asks about profile owner → AI responds
         ↓
    Fact Extraction (background)
         ↓
    Fact added to pendingFacts
```

### 2. Review Phase (Dashboard)
```
User opens Dashboard → Sees "Visitor Discoveries" section
         ↓
Pending facts displayed with context
         ↓
User clicks Approve ✓ or Reject ✗
         ↓
Optimistic update (instant removal from list)
         ↓
API call confirms change
```

### 3. Learning Phase
```
Approved fact moved to learnedFacts
         ↓
Added to Profile.aiContext
         ↓
AI includes in next conversation with any visitor
         ↓
Avatar gradually learns from interactions
```

## Key Design Decisions

### 1. Pending Facts Queue
- **Why:** Prevents bad data from affecting AI immediately
- **Benefit:** User controls what AI learns
- **Risk Mitigation:** Approval gate before integration

### 2. Optimistic UI Updates
- **What:** Remove from list immediately on approve/reject
- **Why:** Feels responsive and fast
- **Rollback:** Refetch statistics on error
- **Loader States:** Show during API call to indicate progress

### 3. Learned Facts in aiContext
- **When Updated:** On fact approval
- **Format:** Bullet-pointed list in prompt
- **Placement:** After bio/writingStyle section
- **Effect:** Immediate on next message

### 4. Asynchronous Extraction
- **Where:** Background task in send-message handler
- **Why:** Doesn't block chat UX
- **Failure Handling:** Logged to console, doesn't crash conversation

### 5. JSON Array Storage
- **Why:** Simple and readable
- **Trade-offs:** Not searchable vs. relational, but sufficient for MVP
- **Format:** `["fact1", "fact2", ...]` (plain strings)

## Testing Checklist

### Manual Testing
```
1. [ ] Visit public profile as visitor
2. [ ] Chat and reveal facts about profile owner
3. [ ] Open dashboard and see "Visitor Discoveries"
4. [ ] Approve 1-2 facts
5. [ ] Reject 1-2 facts
6. [ ] Statistics update in real-time
7. [ ] Refresh page - stats persist
8. [ ] Chat with same profile again
9. [ ] AI mentions approved facts in response
10. [ ] Network tab shows correct API calls
```

### API Testing
```bash
# Get pending facts
curl -X GET http://localhost:3000/api/facts/pending-facts \
  -H "Authorization: Bearer $TOKEN"

# Get statistics
curl -X GET http://localhost:3000/api/facts/statistics \
  -H "Authorization: Bearer $TOKEN"

# Approve fact
curl -X POST http://localhost:3000/api/facts/approve-fact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"factIndex": 0}'
```

### Edge Cases to Test
- [ ] Empty pendingFacts array
- [ ] Approve same fact twice (should fail gracefully)
- [ ] Reject with invalid index
- [ ] Multiple users simultaneously approving facts
- [ ] Statistics update after approval
- [ ] Learned facts persist across page reloads
- [ ] Duplicate fact detection works
- [ ] AI context properly formatted with multiple facts
- [ ] Writing style still applied after learning facts
- [ ] "Still learning" response still triggers when needed

## Performance Considerations

### Fact Extraction
- **Latency:** ~1-2 seconds (background task)
- **Cost:** 1 Gemini API call per visitor message
- **Optimization:** Could batch multiple messages for extraction

### Statistics Queries
- **Query:** Count aggregate (very fast)
- **Caching:** Optional interval-based refresh (30sec)
- **Bottleneck:** None expected for typical usage

### Database Operations
- **Read:** pendingFacts JSON parse
- **Write:** Profile update with JSON stringify
- **Scale:** Fine up to 100+ pending facts per profile

## Future Enhancements

1. **Duplicate Prevention**
   - Embedding-based similarity search
   - Prevent semantically identical facts

2. **Fact Categories**
   - Tag facts as: Career, Personal, Interests, Goals
   - Better organization and context

3. **Visitor Sourcing**
   - Show which visitor revealed each fact
   - Build relationship history

4. **Fact Confidence Scoring**
   - AI generates confidence: "This is 85% likely a real fact"
   - Filter by confidence threshold

5. **Fact Editing**
   - User can edit extracted facts before approval
   - Fix grammar or clarify meaning

6. **Bulk Actions**
   - Approve all/reject all buttons
   - Batch operations

7. **Fact Analytics**
   - Most common topics mentioned by visitors
   - Trending facts over time
   - Visitor demographic insights

## Troubleshooting

### Facts Not Extracting
**Symptom:** pendingFacts stays empty
**Checks:**
1. Check server logs: `💡 PENDING FACT FOR APPROVAL`
2. Verify Gemini API key configured
3. Check console errors in send-message handler
4. Ensure message contains actual facts

### Statistics Not Updating
**Symptom:** Numbers don't change after approval
**Checks:**
1. Clear browser cache
2. Check API response in network tab
3. Verify endpoint returning correct counts
4. Check database was actually updated

### Approved Facts Not Used by AI
**Symptom:** AI doesn't mention learned facts
**Checks:**
1. Verify learnedFacts field has data
2. Check aiContext includes learned facts section
3. Verify AI prompt includes learned facts
4. Send new message to AI (previous context cached)

## Files Modified/Created

### New Files
- `src/components/PendingFacts.tsx` - Fact approval UI
- `src/components/Statistics.tsx` - Real-time statistics
- `server/routes/facts.ts` - Fact management API

### Modified Files
- `server/index.ts` - Fact extraction logic + learned facts in AI context
- `server/routes/facts.ts` - AI context integration on approve
- `src/pages/Dashboard.tsx` - Added Statistics and PendingFacts sections
- `server/prisma/schema.prisma` - pendingFacts field (migration applied)

### Database Migrations
- `20260113194314_add_pending_facts` - Added pendingFacts to Profile

## Security Considerations

1. **Authentication:** All fact endpoints require JWT token
2. **Authorization:** Users can only manage their own facts
3. **Input Validation:** factIndex checked against array bounds
4. **XSS Prevention:** React auto-escapes strings in JSX
5. **SQL Injection:** Prisma parameterized queries prevent injection

## Conclusion

The Visitor Fact Approval System provides a non-invasive way for avatars to learn from conversations while maintaining user control. By requiring explicit approval, we ensure quality data integration and build trust with users that their avatar is learning what they want it to learn.

The system is production-ready with:
- ✅ Complete backend implementation
- ✅ Real-time statistics
- ✅ Optimistic UI updates
- ✅ Proper error handling
- ✅ TypeScript type safety
- ✅ Comprehensive logging

Future improvements can add sophistication without changing the core architecture.
