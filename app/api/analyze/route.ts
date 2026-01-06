import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { loadKnowledge, formatKnowledgeForPrompt } from '@/lib/knowledge';

const apiKey = process.env.ANTHROPIC_API_KEY;

const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Load knowledge files once
const knowledgeFiles = loadKnowledge();
const knowledgeContext = formatKnowledgeForPrompt(knowledgeFiles);

const DESIGN_SYSTEM_PROMPT = `You are a senior design critic with expertise in UI/UX, accessibility, visual design, and content strategy. Provide constructive, actionable feedback organized by design discipline.

## Response Format

Structure your feedback around these seven areas:

### 🎨 Visual Design
Assess color, typography, spacing, imagery, and overall aesthetic coherence. Comment on brand consistency and visual polish.

### 📐 Information Hierarchy
Evaluate content organization, visual weight distribution, scanning patterns, and how effectively the design guides attention.

### ♿ Accessibility
Check color contrast, text legibility, touch targets, keyboard navigation considerations, and inclusive design practices.

### 🖱️ Interaction Design
Analyze interactive elements, affordances, feedback mechanisms, and the clarity of actionable components.

### 🧠 UX Efficacy
Assess user flow clarity, cognitive load, task completion paths, and overall usability.

### ✏️ Content
Evaluate the written content: clarity, tone, grammar, microcopy effectiveness, error messages, labels, and whether the content follows best practices from the knowledge base (content principles, casing, punctuation, interface content elements).

### 📊 Overall Assessment
Synthesize the above into key strengths, priority improvements, and overall impression.

---

When analyzing MULTIPLE images, reference them by number (Image 1, Image 2, etc.) and note differences, improvements, or compare states as appropriate based on the user's context.

At the end of your INITIAL analysis only, include these exact rating lines:
\`\`\`
RATING_OVERALL: [Strong|Good|Fair|Needs Work]
RATING_VISUAL_DESIGN: [Strong|Good|Fair|Needs Work]
RATING_HIERARCHY: [Strong|Good|Fair|Needs Work]
RATING_ACCESSIBILITY: [Strong|Good|Fair|Needs Work]
RATING_INTERACTION: [Strong|Good|Fair|Needs Work]
RATING_UX: [Strong|Good|Fair|Needs Work]
RATING_CONTENT: [Strong|Good|Fair|Needs Work]
\`\`\`

Rating criteria:
- **Strong**: Exceptional, follows best practices, polished
- **Good**: Solid work with minor improvements needed
- **Fair**: Acceptable but has notable issues
- **Needs Work**: Significant improvements required

Be direct, specific, and actionable. Skip generic advice.${knowledgeContext}`;

function detectMediaType(dataUrl: string): 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' {
  if (dataUrl.startsWith('data:image/png')) return 'image/png';
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  if (dataUrl.startsWith('data:image/gif')) return 'image/gif';
  return 'image/jpeg';
}

interface ImageData {
  base64: string;
  fullUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const { images, userContext } = await request.json() as { images: ImageData[]; userContext?: string };

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build content array with all images
    const contentParts: Anthropic.Messages.ContentBlockParam[] = [];
    
    images.forEach((img, index) => {
      const mediaType = detectMediaType(img.fullUrl);
      contentParts.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: img.base64,
        },
      });
      // Add image label for multiple images
      if (images.length > 1) {
        contentParts.push({
          type: 'text',
          text: `[Image ${index + 1} above]`,
        });
      }
    });
    
    // Build analysis prompt based on number of images and context
    let analysisPrompt: string;
    if (images.length === 1) {
      analysisPrompt = userContext 
        ? `Context: "${userContext}"\n\nPlease analyze this design screenshot with this context in mind.`
        : 'Please analyze this design screenshot and provide detailed feedback.';
    } else {
      analysisPrompt = userContext
        ? `Context: "${userContext}"\n\nPlease analyze these ${images.length} design screenshots with this context in mind. Reference each image by number when providing feedback.`
        : `Please analyze these ${images.length} design screenshots. Reference each image by number when providing feedback, and note any differences or patterns across them.`;
    }
    
    contentParts.push({
      type: 'text',
      text: analysisPrompt,
    });

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: DESIGN_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
    });

    // Create a ReadableStream to send chunks
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Streaming error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

