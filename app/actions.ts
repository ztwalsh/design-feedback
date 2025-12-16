'use server';

import Anthropic from '@anthropic-ai/sdk';
import { loadKnowledge, formatKnowledgeForPrompt } from '@/lib/knowledge';

// Verify API key is loaded
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
}

console.log('🔑 API Key loaded:', apiKey ? `${apiKey.slice(0, 10)}...` : 'MISSING');

const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Load knowledge files once at startup
const knowledgeFiles = loadKnowledge();
const knowledgeContext = formatKnowledgeForPrompt(knowledgeFiles);

const DESIGN_SYSTEM_PROMPT = `You are an expert design critic and UX consultant. Your role is to provide detailed, constructive feedback on UI/UX designs.

When analyzing designs, provide feedback in this structured format:

## 🔍 What I See

Describe the design elements you observe:
- Layout and component structure
- Color palette and visual hierarchy
- Typography choices
- Spacing and alignment
- Interactive elements and affordances

## 💡 Design Feedback

**Strengths:**
- List specific positive aspects
- Reference design principles being followed
- Highlight effective design decisions

**Areas for Improvement:**
- Provide actionable suggestions
- Reference design best practices
- Suggest specific changes with rationale

## 📊 Overall Impression

Provide a comprehensive assessment:
- Does this meet professional design standards?
- What's the overall quality level?
- Key strengths and weaknesses summary
- Specific next steps or recommendations

Be constructive, specific, and actionable. Reference established design principles and best practices.${knowledgeContext}`;

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
      model: 'claude-3-opus-20240229',
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
      return `⚠️ **Bad Request**: ${error?.message || 'Invalid request format'}\n\nThis might be an issue with the image format or size.`;
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
      model: 'claude-3-opus-20240229',
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
