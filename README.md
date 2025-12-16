# Design Feedback Tool

A modern, AI-powered design feedback tool built with Next.js 14, TypeScript, and Tailwind CSS. Upload design screenshots and receive detailed feedback through an intuitive chat interface.

## ✨ Features

- **Modern Dark UI**: Sleek, professional interface inspired by OpenAI's AgentKit
- **Drag & Drop Upload**: Easy screenshot upload with visual feedback
- **Split-Panel Layout**: Image viewer alongside chat interface
- **Real-time Chat**: Interactive feedback with markdown formatting support
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Polished transitions and interactions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository and navigate to the project:

```bash
cd design-feedback
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
design-feedback/
├── app/
│   ├── layout.tsx          # Root layout with dark theme and Inter font
│   ├── page.tsx            # Main page with state management
│   └── globals.css         # Global styles with custom animations
├── components/
│   ├── LandingState.tsx    # Initial upload interface
│   ├── WorkingState.tsx    # Split-panel chat + image view
│   ├── ChatMessage.tsx     # Message bubble with markdown support
│   └── ImagePanel.tsx      # Image display with reset button
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## 🎨 Design System

### Color Palette

- **Background**: `gray-950` - Main app background
- **Panels**: `gray-900` - Secondary surfaces
- **Borders**: `gray-800` / `gray-700` - Dividers and outlines
- **Input Fields**: `gray-800` background with `gray-700` borders
- **Text Primary**: `gray-100` - Main text
- **Text Secondary**: `gray-400` - Subtitles and hints
- **Text Muted**: `gray-500` - Placeholders

### Typography

- **Font**: Inter (via Google Fonts with system fallback)
- **Headings**: Semi-bold weight
- **Body**: Normal weight
- **Code**: Monospace font

### Components

#### Landing State
- Centered layout with large dropzone
- Dashed border with hover effects
- Upload icon and instructions
- Supports PNG, JPG, WebP

#### Working State
- 60/40 split (chat/image) on desktop
- Vertical stack on mobile
- Persistent chat header
- Fixed input at bottom
- Scrollable message area

#### Chat Messages
- User messages: Right-aligned, gray-800 background
- Assistant messages: Left-aligned, gray-900 with border
- Full markdown support with custom styling
- Smooth fade-in animations

#### Image Panel
- Centered image display
- Maintains aspect ratio
- "New Screenshot" button to reset
- Subtle border and rounded corners

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **File Upload**: react-dropzone
- **Markdown**: react-markdown with remark-gfm

## 🔮 Next Steps: Claude API Integration

The current version includes placeholder feedback. To add real AI-powered analysis:

1. Install the Anthropic SDK:

```bash
npm install @anthropic-ai/sdk
```

2. Add your API key to `.env.local`:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

3. Create a server action in `app/actions.ts`:

```typescript
'use server';

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzDesign(imageBase64: string) {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: 'Analyze this design and provide detailed feedback...',
          },
        ],
      },
    ],
  });

  return message.content[0].text;
}
```

4. Update the placeholder sections in:
   - `app/page.tsx` - `getInitialFeedback()` function
   - `components/WorkingState.tsx` - `handleSendMessage()` function

## 📱 Responsive Behavior

- **Desktop (>768px)**: Side-by-side split panel
- **Mobile (<768px)**: Vertical stack (image top, chat bottom)
- **Touch-friendly**: Adequate tap targets and spacing

## 🎭 Animations

- Fade-in on landing state mount
- Message animations when added to chat
- Smooth hover transitions on interactive elements
- Auto-scroll to new messages
- Loading dots while processing

## 🧪 Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

