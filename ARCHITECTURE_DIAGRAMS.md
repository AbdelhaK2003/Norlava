# Visitor Fact Approval System - Visual Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VISITOR INTERACTION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: CHAT & EXTRACT
═══════════════════════

  👤 Visitor                    🤖 Avatar                  💻 Backend
  ─────────────────────────────────────────────────────────────────
  
  "I love skiing"
      │
      ├──────────────────────────────────────>
      │ Send Message (Socket.io)
      │
      │                            Process & Respond
      │                                    │
      │                                    ├─> Query Profile
      │                                    ├─> Build AI Context
      │                                    ├─> Call Gemini API
      │                                    │
      │                        Stream Response
      │                        ↓
      │        "That's awesome! I love skiing too!"
      │      <────────────────────────────────────
      │
      │                            [BACKGROUND]
      │                            Extract Facts
      │                                    │
      │                                    ├─> Gemini: "What fact?"
      │                                    ├─> Parse Response
      │                                    ├─> Check Duplicates
      │                                    └─> Save to pendingFacts
      │
      └─ Chat continues, facts accumulate


PHASE 2: DASHBOARD REVIEW
═════════════════════════

  👨 Profile Owner           📊 Dashboard                🗄️  Database
  ────────────────────────────────────────────────────────────────
  
  Opens Dashboard
      │
      ├──────────────────────────────────>
      │ GET /api/facts/pending-facts
      │
      │                            Query Database
      │                                    │
      │                                    ├─> Find Profile
      │                                    └─> Parse pendingFacts
      │
      │        Return Array of Facts
      │      <────────────────────────────
      │
      │ Sees 3 pending facts:
      │ • "I love skiing"
      │ • "I work in tech"
      │ • "I'm from California"
      │
      │ [Approve First] ✓
      │      │
      │      ├──────────────────────────────>
      │      │ POST /api/facts/approve-fact
      │      │ { factIndex: 0 }
      │      │
      │      │                        Update learnedFacts
      │      │                        Update aiContext
      │      │                        Save to DB
      │      │
      │      │        Success Response
      │      │      <────────────────────────
      │      │
      │      ├─ Remove from list (optimistic)
      │      └─ Toast: "✅ Fact approved!"


PHASE 3: AI LEARNING
════════════════════

  👥 New Visitor              🤖 Avatar                  💻 Backend
  ────────────────────────────────────────────────────────────────
  
  "What do you like to do?"
      │
      ├──────────────────────────────────>
      │ Send Message
      │
      │                            Build AI Context
      │                                    │
      │                                    ├─> Get Profile
      │                                    ├─> Parse learnedFacts
      │                                    ├─> Build Prompt:
      │                                    │   "FACTS I'VE LEARNED:"
      │                                    │   • I love skiing
      │                                    │   • I work in tech
      │                                    │   • I'm from California
      │                                    │
      │                                    └─> Call Gemini
      │
      │        "I love skiing and tech work!"
      │      <────────────────────────────────
      │
      └─ Avatar now references learned facts!


```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard.tsx                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Hero Section                                             │  │
│  │ • Avatar                                                 │  │
│  │ • Quick Stats (Visitors, Messages)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NEW: Statistics Section                                  │  │
│  │ ┌────────────┬─────────────┬─────────────┬──────────────┐ │
│  │ │ Messages   │   Visitors  │ Learned     │ Pending      │ │
│  │ │   142      │     23      │    5        │      3       │ │
│  │ └────────────┴─────────────┴─────────────┴──────────────┘ │
│  │           ^                                                 │
│  │           └─ Statistics.tsx component                       │
│  │               • Real-time metrics                           │
│  │               • Color-coded cards                           │
│  │               • Auto-refresh                               │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NEW: Pending Facts Section                               │  │
│  │ ┌────────────────────────────────────────────────────┐   │  │
│  │ │ "I love skiing"                    [✓] [✗]        │   │  │
│  │ ├────────────────────────────────────────────────────┤   │  │
│  │ │ "I work in tech"                   [✓] [✗]        │   │  │
│  │ ├────────────────────────────────────────────────────┤   │  │
│  │ │ "I'm from California"              [✓] [✗]        │   │  │
│  │ └────────────────────────────────────────────────────┘   │  │
│  │           ^                                                 │
│  │           └─ PendingFacts.tsx component                     │
│  │               • Approve button                              │
│  │               • Reject button                               │
│  │               • Optimistic updates                          │
│  │               • Toast notifications                         │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Memory Carousel (Existing)                               │  │
│  │ • Visitor Questions                                      │  │
│  │ • New Facts (old system)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (PostgreSQL)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Profile Table                                            │   │
│  │ ┌──────────────┬────────────────────────────────────┐   │   │
│  │ │ userId       │ "user123"                          │   │   │
│  │ │ aiContext    │ "You are Marie. You are..."        │   │   │
│  │ │ writingStyle │ "I love emojis and exclamation..." │   │   │
│  │ │ pendingFacts │ ["I love skiing", "I work in..."]  │◄──┼──┐│
│  │ │ learnedFacts │ ["I love skiing", "From CA"]       │◄──┼┐ ││
│  │ └──────────────┴────────────────────────────────────┘   │ │││
│  └──────────────────────────────────────────────────────────┘ │││
│           ▲                      ▲                             │││
│           │                      │                             │││
│           │              [Facts API Routes]                    │││
│           │              facts.ts                              │││
│           │              ├─ GET /pending-facts ───────────────┘││
│           │              ├─ GET /statistics ──────────────────┘│
│           │              ├─ POST /approve-fact                 │
│           │              │   └─ Update learnedFacts             │
│           │              │   └─ Update aiContext               │
│           │              └─ POST /reject-fact                   │
│           │                                                     │
│           │                                                     │
│    [Backend Logic]                              [Frontend]     │
│    server/index.ts                             React Components│
│    ├─ Send Message Handler                     ├─ PendingFacts │
│    │   ├─ Save to DB                           ├─ Statistics   │
│    │   ├─ Get Profile                          └─ Dashboard    │
│    │   ├─ Build AI Context                                     │
│    │   │   └─ Include learnedFacts             API Calls       │
│    │   ├─ Stream Gemini Response               ├─ GET facts    │
│    │   └─ Extract Facts (async)                ├─ POST approve │
│    │       ├─ Call Gemini                      ├─ POST reject  │
│    │       ├─ Parse Result                     └─ GET stats    │
│    │       └─ Save to pendingFacts                             │
│    │                                                             │
│    └─ Facts Extracted                                           │
│        └─ Stored in pendingFacts (DB)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
Frontend State
══════════════

PendingFacts.tsx:
  ├─ facts: Array<{fact: string, index: number}>
  │         │
  │         └─ Local state from API response
  │
  ├─ loading: boolean
  │         │
  │         └─ Shows skeleton while fetching
  │
  ├─ approvingIndex: number | null
  │         │
  │         └─ Shows loader on approve button
  │
  └─ rejectingIndex: number | null
            │
            └─ Shows loader on reject button

Statistics.tsx:
  ├─ stats: { totalMessages, uniqueVisitors, learnedFacts, pendingFacts }
  │         │
  │         └─ Real-time counts from API
  │
  └─ loading: boolean
            │
            └─ Shows skeleton while fetching


Backend State
═════════════

Profile (Database):
  ├─ pendingFacts: string (JSON array)
  │    │
  │    ├─ Cleared on approve (splice)
  │    └─ Cleared on reject (splice)
  │
  └─ learnedFacts: string (JSON array)
       │
       └─ Updated on approve (push + update aiContext)
```

## API Endpoint Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      Facts API Routes                           │
│                    /api/facts/* (JWT Auth)                     │
│                                                                 │
│  ┌─ GET /pending-facts ────────────────────────────────────┐  │
│  │  • Query Database                                       │  │
│  │  • Parse pendingFacts JSON                              │  │
│  │  • Return array of strings                              │  │
│  │  • Response: ["fact1", "fact2", ...]                    │  │
│  │  • Status: 200 OK / 404 Profile not found / 500 Error  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ GET /statistics ───────────────────────────────────────┐  │
│  │  • Count messages (WHERE hostId = userId)               │  │
│  │  • Count unique visitors (DISTINCT visitorId)           │  │
│  │  • Parse and count learnedFacts array                   │  │
│  │  • Parse and count pendingFacts array                   │  │
│  │  • Response: {                                          │  │
│  │      totalMessages: 142,                                │  │
│  │      uniqueVisitors: 23,                                │  │
│  │      learnedFacts: 5,                                   │  │
│  │      pendingFacts: 3                                    │  │
│  │    }                                                    │  │
│  │  • Status: 200 OK / 404 Profile not found / 500 Error  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ POST /approve-fact ────────────────────────────────────┐  │
│  │  Request Body: { factIndex: number }                    │  │
│  │  Process:                                               │  │
│  │    1. Validate factIndex bounds                         │  │
│  │    2. Parse pendingFacts array                          │  │
│  │    3. Parse learnedFacts array                          │  │
│  │    4. splice(factIndex, 1) from pending                 │  │
│  │    5. push to learned                                   │  │
│  │    6. Update aiContext with learned facts               │  │
│  │    7. Save Profile                                      │  │
│  │  Response: {                                            │  │
│  │      success: true,                                     │  │
│  │      pendingFacts: [...],                               │  │
│  │      learnedFacts: [...]                                │  │
│  │    }                                                    │  │
│  │  Status: 200 OK / 400 Invalid Index / 404 / 500 Error  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ POST /reject-fact ─────────────────────────────────────┐  │
│  │  Request Body: { factIndex: number }                    │  │
│  │  Process:                                               │  │
│  │    1. Validate factIndex bounds                         │  │
│  │    2. Parse pendingFacts array                          │  │
│  │    3. splice(factIndex, 1) from pending                 │  │
│  │    4. Save Profile                                      │  │
│  │  Response: {                                            │  │
│  │      success: true,                                     │  │
│  │      pendingFacts: [...]                                │  │
│  │    }                                                    │  │
│  │  Status: 200 OK / 400 Invalid Index / 404 / 500 Error  │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Fact Extraction Flow (Detailed)

```
Visitor Message Received
       │
       ▼
Save to Database
       │
       ▼
Get Profile with aiContext
       │
       ▼
Build AI Prompt (with learnedFacts)
       │
       ▼
Stream Response to Visitor
       │
       ▼
Add to Session History
       │
       ▼
[BACKGROUND - Async Task]
       │
       ├─ Get Gemini Instance
       │
       ├─ Create Extraction Prompt:
       │  "Extract facts about ${name} that visitor mentioned"
       │
       ├─ Call Gemini API
       │
       ├─ Parse Response:
       │  "NONE" or "I love skiing\nI work in tech"
       │
       ├─ Split by newlines
       │
       ├─ Filter empty/short facts
       │
       ├─ For each fact:
       │  ├─ Check duplicate against pendingFacts
       │  ├─ If new: Add to pending array
       │  └─ Save to Database
       │
       ▼
Chat completes, facts queued for approval
       │
       ▼
User sees in Dashboard
```

## Timeline: Fact to Learning

```
Time  Event                           Status
────  ──────────────────────────────  ─────────────────────────
0s    Visitor: "I love skiing"        💬 Message received
  
0.1s  AI: "That's awesome!"           🤖 Response streaming
  
0.2s  Message saved to DB             💾 Persisted
  
1.5s  Fact extraction starts          ⏳ Background task
  
2.5s  "I love skiing" extracted       ✨ Fact identified
  
3.0s  Saved to pendingFacts           📋 Queued for approval
  
120s  User opens Dashboard            👨 Reviews facts
  
121s  Clicks Approve ✓                ✅ Optimistic update
  
122s  API call completes              💾 In learnedFacts now
  
123s  Next visitor message            🤖 AI uses learned fact
  
        "I love skiing too!"
```

---

This visual architecture helps understand:
- How data flows through the system
- Where components interact
- The sequence of operations
- The state management strategy
- The API contract
