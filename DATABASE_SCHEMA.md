# Database Schema Design for Session Persistence

## Overview
This schema supports saving design feedback sessions with screenshots, conversations, assessments, and the ability to resume sessions.

## Core Entities

### 1. **Session**
Represents a single design feedback session.

```typescript
Session {
  id: string (UUID, Primary Key)
  createdAt: DateTime
  updatedAt: DateTime
  title: string? (optional user-provided title, default: "Design Review - [date]")
  context: string? (user-provided context about the design)
  enabledDimensions: string[] (array of DimensionKey values)

  // Assessment scores from initial analysis
  overallRating: string? (Strong|Good|Fair|Needs Work)
  visualDesignRating: string?
  hierarchyRating: string?
  accessibilityRating: string?
  interactionRating: string?
  uxRating: string?
  contentRating: string?

  // Metadata
  status: string (active|archived|deleted)
  lastViewedAt: DateTime
  messageCount: int (denormalized for quick sorting)
  imageCount: int (denormalized)
}
```

### 2. **Image**
Stores uploaded screenshots for each session.

```typescript
Image {
  id: string (UUID, Primary Key)
  sessionId: string (Foreign Key -> Session.id)
  createdAt: DateTime

  // Image data
  url: string (S3/CDN URL or base64 data URL)
  thumbnailUrl: string? (optimized thumbnail for list views)
  originalFilename: string?
  mimeType: string (image/png, image/jpeg, etc.)
  fileSize: int (bytes)

  // Display metadata
  orderIndex: int (0, 1, 2, 3 for display order)
  width: int?
  height: int?
}
```

### 3. **Message**
Stores conversation messages (initial feedback + follow-ups).

```typescript
Message {
  id: string (UUID, Primary Key)
  sessionId: string (Foreign Key -> Session.id)
  createdAt: DateTime

  // Message data
  role: string (user|assistant)
  content: text (markdown content)

  // Metadata
  orderIndex: int (for sorting within session)
  messageType: string (initial_analysis|deep_dive|follow_up|explain)
  relatedDimension: string? (if it's a deep_dive, which dimension)

  // For tracking which images were in context
  imageIds: string[] (array of Image.id references)
}
```

## Additional Considerations

### 4. **Tag** (Optional - for organization)
Allow users to tag sessions for easier retrieval.

```typescript
Tag {
  id: string (UUID, Primary Key)
  name: string (unique)
  color: string? (hex color for UI)
  createdAt: DateTime
}

SessionTag {
  sessionId: string (Foreign Key -> Session.id)
  tagId: string (Foreign Key -> Tag.id)
  PRIMARY KEY (sessionId, tagId)
}
```

## Indexes Needed

```sql
-- Session queries
CREATE INDEX idx_session_created ON Session(createdAt DESC);
CREATE INDEX idx_session_updated ON Session(updatedAt DESC);
CREATE INDEX idx_session_status ON Session(status);
CREATE INDEX idx_session_last_viewed ON Session(lastViewedAt DESC);

-- Image queries
CREATE INDEX idx_image_session ON Image(sessionId, orderIndex);

-- Message queries
CREATE INDEX idx_message_session ON Message(sessionId, orderIndex);

-- Tag queries (if implemented)
CREATE INDEX idx_session_tag_session ON SessionTag(sessionId);
CREATE INDEX idx_session_tag_tag ON SessionTag(tagId);
```

## Queries You'll Need

### 1. List Sessions (with pagination)
```typescript
// Get recent sessions with summary data
SELECT
  id,
  title,
  createdAt,
  updatedAt,
  lastViewedAt,
  overallRating,
  messageCount,
  imageCount,
  status
FROM Session
WHERE status != 'deleted'
ORDER BY lastViewedAt DESC
LIMIT 20 OFFSET 0;
```

### 2. Get Full Session Details
```typescript
// Get session with all images and messages
const session = await db.session.findUnique({
  where: { id: sessionId },
  include: {
    images: {
      orderBy: { orderIndex: 'asc' }
    },
    messages: {
      orderBy: { orderIndex: 'asc' }
    }
  }
});
```

### 3. Create New Session
```typescript
// Transaction to create session + images + initial message
await db.$transaction(async (tx) => {
  const session = await tx.session.create({
    data: {
      title: `Design Review - ${new Date().toLocaleDateString()}`,
      context: userContext,
      enabledDimensions: dimensions,
      status: 'active',
      lastViewedAt: new Date(),
    }
  });

  const images = await tx.image.createMany({
    data: imageData.map((img, idx) => ({
      sessionId: session.id,
      url: img.url,
      mimeType: img.mimeType,
      orderIndex: idx,
    }))
  });

  return session;
});
```

### 4. Update Session with Feedback
```typescript
// After receiving feedback, update assessment and add message
await db.$transaction([
  db.session.update({
    where: { id: sessionId },
    data: {
      overallRating: assessment.overall,
      visualDesignRating: assessment.visualDesign,
      // ... other ratings
      messageCount: { increment: 1 },
    }
  }),
  db.message.create({
    data: {
      sessionId: sessionId,
      role: 'assistant',
      content: feedback,
      messageType: 'initial_analysis',
      orderIndex: 0,
    }
  })
]);
```

### 5. Resume Session
```typescript
// Update lastViewedAt when user opens a session
await db.session.update({
  where: { id: sessionId },
  data: { lastViewedAt: new Date() }
});
```

## Image Storage Options

### Option 1: Base64 in Database (Simplest)
- **Pros**: No external dependencies, works immediately
- **Cons**: Large database size, slow queries, not scalable
- **Recommendation**: Good for MVP/prototype

```typescript
Image {
  url: string // Store full data:image/png;base64,... string
}
```

### Option 2: S3/R2/Cloud Storage (Recommended)
- **Pros**: Scalable, fast, CDN-ready, cheaper long-term
- **Cons**: Requires external service setup
- **Recommendation**: Best for production

```typescript
Image {
  url: string // https://bucket.s3.amazonaws.com/images/uuid.png
  thumbnailUrl: string // https://bucket.s3.amazonaws.com/thumbnails/uuid.jpg
}
```

### Option 3: Local File System
- **Pros**: No external dependencies, medium complexity
- **Cons**: Not great for serverless, harder to scale
- **Recommendation**: Good for self-hosted

```typescript
Image {
  url: string // /uploads/sessions/uuid/image-0.png
}
```

## Database Options for Next.js

### 1. **Vercel Postgres** (Recommended for Vercel deployment)
```bash
npm install @vercel/postgres
```
- Managed PostgreSQL
- Auto-scales
- Zero-config on Vercel
- **Cost**: Free tier available, then $20/mo

### 2. **Prisma + PostgreSQL** (Most flexible)
```bash
npm install prisma @prisma/client
npm install -D prisma
```
- Works with any PostgreSQL provider (Supabase, Neon, Railway, local)
- Type-safe ORM
- Great developer experience
- **Cost**: Free with most providers, pay for hosting

### 3. **Drizzle ORM + PostgreSQL** (Lightweight alternative)
```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```
- Lighter than Prisma
- Great TypeScript support
- More control
- **Cost**: Same as Prisma option

### 4. **Supabase** (Batteries included)
```bash
npm install @supabase/supabase-js
```
- PostgreSQL + Auth + Storage + Real-time
- Built-in image storage
- Great free tier
- **Cost**: Free tier generous, then $25/mo

## Recommended Stack

**For your use case, I recommend:**

**Prisma + Supabase + Supabase Storage**

**Why:**
- Supabase free tier is generous (500MB database, 1GB storage)
- Built-in storage for images (no S3 setup needed)
- Prisma gives you excellent type safety
- Easy to set up and migrate
- Can scale when needed

## Next Steps

1. Choose your database provider
2. Install dependencies
3. Set up database connection
4. Create Prisma schema (or Drizzle schema)
5. Run migrations
6. Update API routes to save/load sessions
7. Add session list UI
8. Add session restore functionality

Would you like me to implement this with a specific database choice?
