# Session Persistence Implementation Checklist

## What You're Missing (Database-wise)

### 🔴 Required (Core functionality)
- [ ] **Database** - PostgreSQL (recommend Supabase)
- [ ] **ORM** - Prisma or Drizzle for type-safe queries
- [ ] **Schema** - Tables for Session, Image, Message
- [ ] **Image Storage** - Supabase Storage, S3, or file system
- [ ] **Connection String** - DATABASE_URL in .env

### 🟡 Recommended (Better UX)
- [ ] **Session Indexing** - For fast queries on recent sessions
- [ ] **Image Thumbnails** - Smaller versions for list views
- [ ] **Search** - Full-text search on messages/context
- [ ] **Tags** - Organize sessions by project/client

### 🟢 Optional (Nice to have)
- [ ] **Authentication** - User accounts with Supabase Auth
- [ ] **Soft Delete** - Archive instead of deleting
- [ ] **Export** - Download session as PDF/JSON
- [ ] **Sharing** - Share session link with others

## Database Tables Needed

```
┌─────────────┐
│   Session   │  (Main record)
│─────────────│
│ id          │ UUID, PK
│ title       │ string
│ context     │ text
│ createdAt   │ timestamp
│ updatedAt   │ timestamp
│ ratings     │ JSONB or separate columns
└─────────────┘
       │
       │ 1:N
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│    Image    │    │   Message   │
│─────────────│    │─────────────│
│ id          │    │ id          │
│ sessionId   │ FK │ sessionId   │ FK
│ url         │    │ role        │
│ orderIndex  │    │ content     │ text
│ mimeType    │    │ orderIndex  │
└─────────────┘    └─────────────┘
```

## New Features You'll Build

### 1. **Session List Page** (`/sessions`)
```
┌─────────────────────────────────────────────┐
│  📁 My Design Reviews                       │
│  ─────────────────────────────────────────  │
│                                             │
│  [Search sessions...]                       │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 🖼️ Checkout Flow Review             │  │
│  │ 2 images • 8 messages                │  │
│  │ Overall: Good • 2 hours ago          │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 🖼️ Dashboard Redesign                │  │
│  │ 3 images • 12 messages               │  │
│  │ Overall: Strong • Yesterday          │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [Load more...]                             │
└─────────────────────────────────────────────┘
```

### 2. **Auto-save Current Session**
- Save session when analysis completes
- Auto-save new messages as they're sent
- Update lastViewedAt timestamp

### 3. **Restore Session**
- Load session from database
- Populate images, messages, assessment cards
- Resume conversation from where you left off

### 4. **Session Actions**
- Rename session
- Archive session
- Delete session
- Duplicate session

## API Routes You'll Need

### New Routes
```typescript
// List sessions
GET /api/sessions
→ Returns array of sessions with metadata

// Get single session
GET /api/sessions/[id]
→ Returns full session with images + messages

// Create session
POST /api/sessions
Body: { images, context, enabledDimensions }
→ Returns session with ID

// Update session
PATCH /api/sessions/[id]
Body: { title?, assessment?, message? }
→ Returns updated session

// Delete session
DELETE /api/sessions/[id]
→ Returns success

// Upload image to existing session
POST /api/sessions/[id]/images
Body: { imageData }
→ Returns image metadata
```

### Modified Routes
```typescript
// Existing: POST /api/analyze
// Add: Save message to session after streaming

// Existing: app/actions.ts - askFollowUpQuestion
// Add: Save user question + assistant response to session
```

## Code Changes Needed

### 1. Database Setup
```typescript
// lib/db.ts - NEW FILE
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 2. Prisma Schema
```prisma
// prisma/schema.prisma - NEW FILE
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Session {
  id                    String    @id @default(uuid())
  title                 String
  context               String?
  enabledDimensions     String[]

  // Ratings
  overallRating         String?
  visualDesignRating    String?
  hierarchyRating       String?
  accessibilityRating   String?
  interactionRating     String?
  uxRating              String?
  contentRating         String?

  // Metadata
  status                String    @default("active")
  messageCount          Int       @default(0)
  imageCount            Int       @default(0)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  lastViewedAt          DateTime  @default(now())

  images                Image[]
  messages              Message[]

  @@index([lastViewedAt])
  @@index([createdAt])
  @@index([status])
}

model Image {
  id               String   @id @default(uuid())
  sessionId        String
  url              String   @db.Text
  thumbnailUrl     String?  @db.Text
  mimeType         String
  orderIndex       Int
  createdAt        DateTime @default(now())

  session          Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, orderIndex])
}

model Message {
  id               String   @id @default(uuid())
  sessionId        String
  role             String
  content          String   @db.Text
  messageType      String   @default("follow_up")
  relatedDimension String?
  orderIndex       Int
  createdAt        DateTime @default(now())

  session          Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, orderIndex])
}
```

### 3. Update WorkingState Component
```typescript
// components/WorkingState.tsx
// Add: sessionId prop
// Add: Auto-save messages after each AI response
// Add: Save to database instead of just local state

interface WorkingStateProps {
  sessionId?: string; // NEW: Load existing session
  // ... existing props
}
```

### 4. Add Session List Page
```typescript
// app/sessions/page.tsx - NEW FILE
// Show list of all saved sessions
// Click to restore and continue conversation
```

### 5. Update Navigation
```typescript
// Add link to /sessions in header
// Add "Save Session" confirmation after analysis
// Add breadcrumbs when viewing a session
```

## Environment Variables Needed

```env
# .env.local

# Existing
ANTHROPIC_API_KEY=sk-ant-...

# NEW - Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# NEW - Image Storage (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhb..."
SUPABASE_SERVICE_ROLE_KEY="eyJhb..." # For server-side operations
```

## Estimated Implementation Time

- **Database Setup**: 1 hour
- **Schema Creation**: 1 hour
- **API Routes**: 3-4 hours
- **Session List UI**: 2-3 hours
- **Save/Restore Logic**: 2-3 hours
- **Testing & Polish**: 2 hours

**Total: ~12-15 hours** for full implementation

## Want me to implement this?

I can help you:
1. Set up Supabase (or your preferred database)
2. Create the Prisma schema
3. Build the API routes
4. Update the UI for saving/loading sessions
5. Add the session list page

Just let me know which database option you prefer!
