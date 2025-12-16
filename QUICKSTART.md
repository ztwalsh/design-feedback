# Quick Start Guide

## Installation

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How It Works

### 1. Upload a Screenshot
- Drag and drop any design screenshot (PNG, JPG, WebP)
- Or click the dropzone to browse files

### 2. Receive Feedback
- Automatically transitions to chat interface
- Initial feedback appears immediately
- Image displays on the right panel

### 3. Ask Follow-up Questions
- Type questions in the input field at the bottom
- Press Enter or click Send
- Receive contextual responses

### 4. Start Over
- Click "New Screenshot" button in the image panel
- Returns to upload interface
- Ready for a new design

## Current State

✅ **Implemented:**
- Modern dark UI with smooth animations
- Drag & drop file upload
- Split-panel layout (responsive)
- Chat interface with message history
- Markdown rendering in messages
- State management for view transitions

⏳ **Coming Soon (Add Claude API):**
- Real AI-powered design analysis
- Context-aware follow-up responses
- Design principle recommendations
- Reference to best practices

## Adding Claude API

See the main README.md for detailed instructions on integrating the Anthropic Claude API for real design feedback.

### Quick Overview:

1. Install Anthropic SDK
2. Add API key to environment variables
3. Create server actions for API calls
4. Replace placeholder feedback functions
5. Update chat message handler

## Key Files to Modify for API Integration

- `app/page.tsx` - Line 25: `getInitialFeedback()` function
- `components/WorkingState.tsx` - Line 36: `handleSendMessage()` function

Look for `// TODO: Replace with actual Claude API call` comments.

