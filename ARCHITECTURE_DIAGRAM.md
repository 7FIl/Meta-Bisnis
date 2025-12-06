# Business Type Integration - Visual Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          page.js (Home)                                 │
│                     - State Management                                  │
│                     - Firebase Sync                                     │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  [currentBusinessType] ────────────────────────┐                │ │
│  │  [currentBusinessSubtype] ──────────────────┐  │                │ │
│  │                                              │  │                │ │
│  └──────────────────────────────────────────────┼──┼────────────────┘ │
│                                                │  │                    │
│  DashboardView (Conditional Route)             │  │                    │
│  ┌───────────────────────────────────────────────┼──┼──────────────┐   │
│  │                                               │  │              │   │
│  │  ┌─────────────────────────────────────────────┘  │              │   │
│  │  │                                                │              │   │
│  │  ├─→ MenuPengaturan (Settings Form)              │              │   │
│  │  │   • Receives: currentBusinessType             │              │   │
│  │  │   • Receives: currentBusinessSubtype          │              │   │
│  │  │   • Contains: BUSINESS_TYPES dropdown         │              │   │
│  │  │   • Emits: onUpdateSettings()                 │              │   │
│  │  │                                               │              │   │
│  │  ├─→ MarketIntelligence (Trend Component)        │              │   │
│  │  │   • Receives: businessType                    │              │   │
│  │  │   • Receives: businessSubtype                 │              │   │
│  │  │   • Calls: POST /api/news (with type)         │              │   │
│  │  │   • Displays: Relevant trends                 │              │   │
│  │  │                                               │              │   │
│  │  └─→ MenuChatAI (Chat Component)                 │              │   │
│  │      • Receives: businessType                    │              │   │
│  │      • Receives: businessSubtype                 │              │   │
│  │      • Calls: POST /api/chat (with type)         │              │   │
│  │      • Shows: Contextual AI responses            │              │   │
│  │                                                  │              │   │
│  └──────────────────────────────────────────────────┼──────────────┘   │
│                                                      │                  │
└──────────────────────────────────────────────────────┼──────────────────┘
                                                       │
                    ┌──────────────────────────────────┼──────────────────┐
                    │                                  │                  │
                    ↓                                  ↓                  ↓
            ┌─────────────────┐           ┌──────────────────┐   ┌──────────────┐
            │ Firebase        │           │ /api/news        │   │ /api/chat    │
            │ Firestore       │           │ (Tavily Route)   │   │ (Kolosal)    │
            │                 │           │                  │   │              │
            │ users/{uid}/    │           │ Input:           │   │ Input:       │
            │ ├─businessType  │           │ • businessType   │   │ • businessType
            │ ├─businessSub   │           │ • businessSub    │   │ • businessSub
            │ └─...           │           │ • location       │   │ • topic      │
            │                 │           │ • description    │   │              │
            │                 │           │                  │   │ System       │
            │                 │           │ Processing:      │   │ Prompt:      │
            │                 │           │ 1. Priority sort │   │ "Kamu        │
            │                 │           │ 2. Build query   │   │ sedang       │
            │                 │           │    with context  │   │ membantu     │
            │                 │           │ 3. Tavily API    │   │ F&B type..." │
            │                 │           │ 4. Translate     │   │              │
            │                 │           │ 5. Return news   │   │ Output:      │
            │                 │           │                  │   │ Contextual   │
            │                 │           │ Output:          │   │ Response     │
            │                 │           │ • Summary (ID)   │   │              │
            │                 │           │ • News items     │   └──────────────┘
            │                 │           │                  │
            └─────────────────┘           └──────────────────┘
```

---

## Data Flow Sequence

```
USER INTERACTION:
════════════════════════════════════════════════════════════════════════

1. User opens Menu Pengaturan (Settings)
   ↓
   └─→ MenuPengaturan renders with current values
       • Loads BUSINESS_TYPES constant
       • Shows category dropdown
       • Shows sub-category dropdown (if category selected)

2. User selects "F&B (Makanan & Minuman)"
   ↓
   └─→ Sub-category dropdown populates with:
       ["Restoran", "Kafe", "Bakso", "Warung", ...]

3. User selects "Kafe / Coffee Shop"
   ↓
   └─→ Form now has:
       • businessName: "Kopi Pintar"
       • businessType: "F&B (Makanan & Minuman)"
       • businessSubtype: "Kafe / Coffee Shop"
       • businessLocation: "Jakarta"
       • businessDescription: "Specialty coffee..."

4. User clicks "Simpan Perubahan"
   ↓
   └─→ handleUpdateSettings() in page.js:
       • Updates state: setCurrentBusinessType()
       • Saves to Firebase: saveUserSettings(uid, {..., businessType})
       • Shows toast: "Pengaturan berhasil diperbarui!"

5. Firebase persists:
   ├─→ users/{uid}/businessType = "F&B (Makanan & Minuman)"
   ├─→ users/{uid}/businessSubtype = "Kafe / Coffee Shop"
   └─→ DashboardView re-renders with new props


DATA USAGE IN OTHER FEATURES:
════════════════════════════════════════════════════════════════════════

A. MARKET INTELLIGENCE (Berita & Tren Pasar)
   ─────────────────────────────────────────

   User clicks "Refresh" on Berita & Tren Pasar
   ↓
   MarketIntelligence.fetchRelevantNews() calls:
   POST /api/news with {
     businessName: "Kopi Pintar",
     businessType: "F&B (Makanan & Minuman)",      ← NEW CONTEXT
     businessSubtype: "Kafe / Coffee Shop",        ← NEW CONTEXT
     businessLocation: "Jakarta",
     businessDescription: "Specialty coffee..."
   }
   ↓
   /api/news route processes:
   
   1. determineSearchTopic():
      Priority: "Kafe / Coffee Shop" > "F&B" > description > name
      Result: "Kafe / Coffee Shop"
   
   2. buildSearchQuery():
      "Latest viral trends for 'Kafe / Coffee Shop' 
       in F&B industry in Jakarta. Focus on viral products,
       business opportunities, competitive advantages..."
   
   3. fetchNewsFromTavily():
      POST to https://api.tavily.com/search with:
      • query: [above optimized query]
      • search_depth: "advanced"
      • include_answer: true
      • max_results: 5
   
   4. Tavily returns: answer + 5 results about:
      • Coffee trends in Jakarta
      • Competitive strategies
      • Social media tactics
      • Seasonal opportunities
   
   5. translateToIndonesian():
      Kolosal AI translates answer to Indonesian
      Result: Summary in Indonesian
   
   6. Response sent back:
      {
        success: true,
        summary: "Tren terbaru kopi di Jakarta menunjukkan...",
        news: [
          { title, url, source, snippet, published_date },
          ...
        ]
      }
   ↓
   MarketIntelligence displays:
   • Summary: "Tren terbaru kopi di Jakarta..."
   • News items: 5 relevant coffee/F&B articles


B. CHAT AI (Konsultasi Bisnis)
   ─────────────────────────

   User opens Chat AI and asks: "Bagaimana cara jual lebih banyak?"
   ↓
   MenuChatAI sends to /api/chat:
   POST /api/chat with {
     message: "Bagaimana cara jual lebih banyak?",
     businessName: "Kopi Pintar",
     businessType: "F&B (Makanan & Minuman)",      ← NEW CONTEXT
     businessSubtype: "Kafe / Coffee Shop",        ← NEW CONTEXT
     topic: "sales"
   }
   ↓
   /api/chat route processes:
   
   1. Extracts: businessType + businessSubtype
   
   2. Builds businessContext string:
      " Kamu sedang membantu bisnis tipe 'F&B (Makanan & Minuman)' 
        (Kafe / Coffee Shop)."
   
   3. For "sales" topic, builds system prompt:
      "Kamu adalah Meta Bisnis, asisten penjualan UMKM Indonesia.
       Kamu sedang membantu bisnis tipe 'F&B' (Kafe / Coffee Shop).
       Jawab dalam Bahasa Indonesia berupa strategi penjualan..."
   
   4. Sends to Kolosal AI with:
      • System: [above contextual prompt]
      • User: "Bagaimana cara jual lebih banyak?"
   
   5. Kolosal responds with:
      "Untuk coffee shop, fokus pada:
       • Instagram reels nyobain specialty drinks baru
       • Loyalty program untuk member setia
       • Kolaborasi dengan kantor di area
       • Premium blend seasonal untuk increase AOV
       • Ambient music & cozy seating untuk dwell time..."
   
   6. Response sent back to frontend with contextual answer
   ↓
   MenuChatAI displays coffee shop-specific sales strategy


C. NEXT LOGIN (Persistence)
   ────────────────────────

   User logs out, closes app, comes back tomorrow
   ↓
   page.js useEffect onAuthStateChanged fires:
   
   1. Detects user login
   
   2. Calls: getUserSettings(currentUser.uid)
   
   3. Firebase returns:
      {
        businessName: "Kopi Pintar",
        businessType: "F&B (Makanan & Minuman)",     ← PERSISTED
        businessSubtype: "Kafe / Coffee Shop",       ← PERSISTED
        businessLocation: "Jakarta",
        businessDescription: "..."
      }
   
   4. Restores state:
      setCurrentBusinessType("F&B (Makanan & Minuman)")
      setCurrentBusinessSubtype("Kafe / Coffee Shop")
   
   5. DashboardView renders with business type pre-loaded
   ↓
   All features work with saved context automatically
```

---

## Search Query Evolution

```
BEFORE (Without Business Type):
════════════════════════════════════════════════════════════════════════

User: Kopi Pintar, Jakarta

Query to Tavily:
  "Latest viral market trends for Kopi Pintar (Business Industry) 
   in Jakarta. Focus on viral products on TikTok/Instagram, 
   business opportunities, and practical strategies."

Tavily Results (Mixed, not specific to coffee):
  ✗ Article about "Kopi" (coffee bean definition)
  ✗ Article about Indonesia economy
  ✓ Article about coffee trends
  ✗ Article about retail trends
  ✓ Article about F&B market


AFTER (With Business Type):
════════════════════════════════════════════════════════════════════════

User: Kopi Pintar, Jakarta
Type: F&B (Makanan & Minuman)
Subtype: Kafe / Coffee Shop

Query to Tavily:
  "Latest viral market trends for 'Kafe / Coffee Shop' 
   in F&B industry in Jakarta. Focus on viral products on TikTok/Instagram, 
   business opportunities, competitive advantages, and practical strategies. 
   Exclude definition of terms, acronyms, and foreign reference."

Tavily Results (Highly relevant to coffee shops):
  ✓ Specialty coffee trends in Jakarta
  ✓ Instagram strategy for coffee shops
  ✓ Seasonal menu opportunities
  ✓ Competitor positioning
  ✓ Customer loyalty tactics

IMPROVEMENT: 100% relevant vs 40% relevant = +60% better
```

---

## State Management Flow

```
Page.js (Root Component)
├── State:
│   ├─ currentBusinessName
│   ├─ currentUserName
│   ├─ currentBusinessLocation
│   ├─ currentBusinessDescription
│   ├─ currentBusinessType          ← NEW
│   ├─ currentBusinessSubtype       ← NEW
│   └─ other state...
│
├── Functions:
│   ├─ handleUpdateSettings({...}, businessType, businessSubtype)
│   └─ Firebase persist
│
└── Props down to:
    └── DashboardView
        ├─ businessType={currentBusinessType}
        ├─ businessSubtype={currentBusinessSubtype}
        │
        └─ Passes to:
           ├─ MenuPengaturan
           │  ├─ Displays current values
           │  ├─ User changes values
           │  └─ Calls onUpdateSettings()
           │
           ├─ MarketIntelligence
           │  └─ Sends to /api/news
           │
           └─ MenuChatAI
              ├─ Adds to request payload
              └─ /api/chat includes in system prompt
```

---

## Database Schema

```
Firebase Firestore
├── users/{uid}
│   ├── email: string
│   ├── displayName: string
│   ├── businessName: string
│   ├── userName: string
│   ├── businessLocation: string
│   │   └─ Format: "Province, City" or "Province"
│   ├── businessDescription: string
│   │   └─ Example: "Specialty coffee shop with focus on sustainability"
│   ├── businessType: string                 ← NEW
│   │   └─ Example: "F&B (Makanan & Minuman)"
│   ├── businessSubtype: string              ← NEW
│   │   └─ Example: "Kafe / Coffee Shop"
│   ├── employees: array
│   │   └─ [{id, name}, ...]
│   ├── businessData: object
│   └── createdAt: timestamp
```

---

## API Endpoints

### POST /api/news
```
Request:
{
  businessName: "Kopi Pintar",
  businessLocation: "Jakarta",
  businessDescription: "Specialty coffee...",
  businessType: "F&B (Makanan & Minuman)",    ← NEW
  businessSubtype: "Kafe / Coffee Shop"       ← NEW
}

Processing:
1. determineSearchTopic() uses businessSubtype/Type
2. buildSearchQuery() adds industry context
3. Tavily API gets precise query
4. Kolosal AI translates answer

Response:
{
  success: true,
  summary: "Tren terbaru di industri kopi...",
  news: [
    { title, url, source, snippet, published_date },
    ...
  ]
}
```

### POST /api/chat
```
Request:
{
  message: "User question",
  businessName: "Kopi Pintar",
  businessType: "F&B (Makanan & Minuman)",    ← NEW
  businessSubtype: "Kafe / Coffee Shop",      ← NEW
  topic: "sales" | "finance" | "analysis"
}

Processing:
1. businessContext string created
2. System prompt personalized:
   "...Kamu sedang membantu F&B (Kafe / Coffee Shop)..."
3. Kolosal AI response is contextual

Response:
{
  reply: "Coffee shop specific advice...",
  ...
}
```

---

**Diagram Version:** 1.0
**Last Updated:** December 6, 2025
**Audience:** Developers, Product Managers, QA Engineers
