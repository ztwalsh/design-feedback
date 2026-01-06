'use server';

import Anthropic from '@anthropic-ai/sdk';
import { loadKnowledge, formatKnowledgeForPrompt } from '@/lib/knowledge';

// Verify API key is loaded
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
}

// Load knowledge files once at startup
const knowledgeFiles = loadKnowledge();
const knowledgeContext = formatKnowledgeForPrompt(knowledgeFiles);

const anthropic = new Anthropic({
  apiKey: apiKey,
});

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

/**
 * Detect media type from base64 data URL or default to jpeg
 */
function detectMediaType(dataUrl: string): 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' {
  if (dataUrl.startsWith('data:image/png')) return 'image/png';
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  if (dataUrl.startsWith('data:image/gif')) return 'image/gif';
  return 'image/jpeg'; // default for jpg/jpeg
}

/**
 * Analyze a design screenshot and provide initial comprehensive feedback
 */
export async function analyzeDesign(imageBase64: string, fullDataUrl?: string): Promise<string> {
  try {
    // Check API key
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.error('❌ Invalid API key detected');
      return '⚠️ API key is not configured. Please add your Anthropic API key to .env.local file.\n\nThe file should contain:\n```\nANTHROPIC_API_KEY=sk-ant-your-key-here\n```\n\nThen restart the dev server with: npm run dev';
    }

    // Detect the correct media type
    const mediaType = fullDataUrl ? detectMediaType(fullDataUrl) : 'image/jpeg';
    
    console.log('📸 Analyzing design...');
    console.log('   Media type:', mediaType);
    console.log('   Image size:', imageBase64.length, 'characters');

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Please analyze this design screenshot and provide detailed feedback following the structure outlined in your system prompt.',
            },
          ],
        },
      ],
      system: DESIGN_SYSTEM_PROMPT,
    });

    console.log('✅ Analysis complete');

    const textContent = message.content.find((block) => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return 'Unable to analyze the design. Please try again.';
  } catch (error: any) {
    console.error('❌ Error analyzing design:');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error status:', error?.status);
    console.error('Full error:', error);
    
    // Check for specific error types
    if (error?.status === 401) {
      return '🔑 **Authentication Error**: Your API key is invalid.\n\n1. Check that your `.env.local` file contains: `ANTHROPIC_API_KEY=sk-ant-...`\n2. Verify the key is correct at https://console.anthropic.com/\n3. Restart the dev server: `npm run dev`';
    }
    
    if (error?.status === 429) {
      return '⏱️ **Rate Limit**: Too many requests. Please wait a moment and try again.';
    }
    
    if (error?.status === 400) {
      // Check for billing/credit issues
      if (error?.message?.includes('credit balance')) {
        return `💳 **Billing Issue**: Your Anthropic credit balance is too low.\n\nPlease add credits at: https://console.anthropic.com/settings/billing`;
      }
      return `⚠️ **Bad Request**: ${error?.message || 'Invalid request format'}`;
    }
    
    if (error?.message?.includes('fetch')) {
      return '🌐 **Network Error**: Unable to reach Anthropic API. Check your internet connection.';
    }
    
    const errorMsg = error?.message || 'Unknown error';
    return `❌ **Error**: ${errorMsg}\n\nPlease check the console for more details.`;
  }
}

/**
 * Answer follow-up questions about a design
 */
export async function askFollowUpQuestion(
  imageBase64: string,
  fullDataUrl: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  newQuestion: string
): Promise<string> {
  try {
    // Check API key
    if (!apiKey || apiKey === 'your_api_key_here') {
      return '⚠️ API key is not configured properly.';
    }

    // Detect the correct media type
    const mediaType = detectMediaType(fullDataUrl);
    
    console.log('💬 Asking follow-up question...');

    // Build the conversation with the image in the first message
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: conversationHistory[0]?.content || 'Please analyze this design.',
          },
        ],
      },
    ];

    // Add the rest of the conversation history (skip the first message as we already added it)
    for (let i = 1; i < conversationHistory.length; i++) {
      const msg = conversationHistory[i];
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add the new question
    messages.push({
      role: 'user',
      content: newQuestion,
    });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2048,
      messages,
      system: DESIGN_SYSTEM_PROMPT,
    });

    console.log('✅ Follow-up answered');

    const textContent = response.content.find((block) => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return 'Unable to process your question. Please try again.';
  } catch (error: any) {
    console.error('❌ Error answering follow-up:');
    console.error('Error:', error?.message);
    
    if (error?.status === 401) {
      return '🔑 Authentication error. Please check your API key.';
    }
    
    if (error?.status === 429) {
      return '⏱️ Rate limit reached. Please wait a moment and try again.';
    }
    
    const errorMsg = error?.message || 'Unknown error';
    return `❌ Error: ${errorMsg}`;
  }
}
