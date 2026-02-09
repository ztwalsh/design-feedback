# Google Analytics Setup Guide

## ✅ What's Already Done

I've added comprehensive Google Analytics tracking to your app. Here's what's been implemented:

### 1. Analytics Utility (`lib/analytics.ts`)
Created a type-safe analytics helper with tracking functions for all key user actions.

### 2. Events Being Tracked

#### **User Engagement**
- ✅ **Image Upload** - Tracks when user uploads images (count + whether they added context)
- ✅ **Analysis Start** - When analysis begins (image count + enabled dimensions)
- ✅ **Analysis Complete** - When feedback is received (duration + rating)
- ✅ **Deep Dive Request** - When user clicks dimension card for detailed analysis
- ✅ **Follow-up Question** - When user asks a question (question length)
- ✅ **Explain Request** - When user selects text and clicks "Explain" (text length)
- ✅ **Copy Prompt** - When user copies feedback as a prompt
- ✅ **Add Image During Session** - When user uploads more images mid-conversation
- ✅ **Image View** - When user opens image modal
- ✅ **Dimension Toggle** - When user enables/disables feedback dimensions

#### **Navigation**
- ✅ **Start Over** - When user clicks "Start Over" button
- ✅ **Page Views** - Automatic tracking via Next.js layout

#### **Error Tracking** (Ready to use)
- ⏸️ **API Errors** - Track failed API calls
- ⏸️ **General Errors** - Track application errors

## 🚀 Setup Instructions

### Step 1: Get Your GA Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property (if you don't have one)
3. Select **Web** as the platform
4. Get your **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Add Measurement ID to Environment

Open your `.env` file and replace the placeholder:

```env
# Change this:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# To your actual ID:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABC1234567
```

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Verify It's Working

1. Open your app at http://localhost:3000
2. Open browser DevTools → Console
3. You should see GA tracking calls (or "GA not loaded" in development if you haven't added the ID yet)
4. In GA, go to **Reports → Realtime** to see live events

## 📊 Events in Google Analytics

Once set up, you'll see these events in your GA dashboard:

### Standard Events
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `image_upload` | User uploads screenshots | `image_count`, `has_context` |
| `analysis_start` | Analysis begins | `image_count`, `dimensions`, `dimension_count` |
| `analysis_complete` | Feedback received | `image_count`, `duration_seconds`, `overall_rating` |
| `deep_dive_request` | Dimension deep dive | `dimension` |
| `follow_up_question` | User asks question | `question_length` |
| `explain_request` | User requests explanation | `text_length` |
| `copy_prompt` | User copies prompt | None |
| `add_image_session` | User adds image mid-session | None |
| `start_over` | User starts new session | None |
| `image_view` | User opens image modal | `image_index` |
| `dimension_toggle` | User toggles dimension | `dimension`, `enabled` |

### Event Categories
All events are tagged with a category for easier filtering:
- `engagement` - User interactions
- `analysis` - Analysis-related events
- `navigation` - Page/flow navigation
- `settings` - User preferences
- `error` - Error tracking

## 🔍 Useful GA Reports

### 1. User Engagement Flow
**Reports → Engagement → Events**

See which features users interact with most:
- How many deep dives are requested?
- How often do users ask follow-ups?
- Do users prefer certain dimensions?

### 2. Analysis Funnel
**Reports → Explorations → Funnel**

Create a funnel:
1. `image_upload` → User uploads images
2. `analysis_start` → Analysis begins
3. `analysis_complete` → User gets feedback
4. `deep_dive_request` or `follow_up_question` → User engages further

### 3. Average Analysis Time
**Reports → Explorations → Custom**

Metric: `analysis_complete` → Parameter: `duration_seconds`

See how long analyses take based on:
- Number of images
- Dimensions selected
- Overall rating received

### 4. Dimension Popularity
**Reports → Explorations → Custom**

Filter by event: `deep_dive_request`
Dimension: `dimension` parameter

See which dimensions users care about most.

### 5. Error Tracking
**Reports → Explorations → Custom**

Filter by event: `error` or `api_error`

Monitor errors in production.

## 🎯 Custom Dashboards

### Recommended Custom Dashboard

Create a dashboard with these widgets:

1. **Daily Active Users** (standard metric)
2. **Total Analyses** (`analysis_complete` count)
3. **Average Analysis Duration** (`duration_seconds` average)
4. **Most Popular Dimensions** (`deep_dive_request` by dimension)
5. **Engagement Rate** (% of users who ask follow-ups)
6. **Copy-to-Cursor Rate** (`copy_prompt` / `analysis_complete`)
7. **Multi-Image Sessions** (`image_upload` where `image_count` > 1)
8. **Error Rate** (`error` events / total events)

## 🔧 Advanced: Error Tracking

To add error tracking to your API calls, use these functions:

```typescript
import { trackApiError, trackError } from '@/lib/analytics';

// In API routes
try {
  const response = await fetch('/api/analyze');
  if (!response.ok) {
    trackApiError(response.status, '/api/analyze');
  }
} catch (error) {
  trackError('fetch_failed', error.message);
}
```

## 📈 Privacy Considerations

The current setup:
- ✅ Only tracks anonymous user interactions
- ✅ No personal information collected
- ✅ No user IDs or identifying data
- ✅ Image content is NOT sent to GA (only metadata like count)
- ✅ Message content is NOT sent to GA (only length)

If you add user authentication later, consider:
- Adding cookie consent banner
- Documenting GA usage in privacy policy
- Using User-ID feature for cross-device tracking (optional)

## 🧪 Testing in Development

To test without affecting production data:

1. Create a separate GA property for development
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-DEV1234567
   ```
3. Check console for tracking calls
4. View real-time events in GA dashboard

## 🚀 Next Steps

1. Get your GA Measurement ID
2. Add it to `.env` file
3. Restart the dev server
4. Test by uploading a design and checking GA Realtime
5. Set up custom dashboards in GA
6. Monitor engagement and iterate on features

## 💡 Tips

- **Set up goals** in GA for key conversions (e.g., completing analysis, asking follow-ups)
- **Create audiences** for power users (e.g., users with >5 deep dives)
- **Set up alerts** for sudden drops in usage or error spikes
- **Use UTM parameters** if you promote the app on multiple channels

## Need Help?

Common issues:
- **Events not showing?** → Check that `NEXT_PUBLIC_` prefix is included in env var
- **GA not loading?** → Verify the Measurement ID format is `G-XXXXXXXXXX`
- **Localhost not tracked?** → GA may filter localhost; deploy to test
- **Console errors?** → Make sure to restart dev server after adding env var
