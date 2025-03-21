import OpenAI from 'openai'
import { ContentPhase } from '@/types'

// Validate API key format
export function getOpenAIConfig() {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  const assistantId = process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID

  // Add debug logging (remove in production)
  console.log('Environment variables available:', {
    hasApiKey: !!apiKey,
    apiKeyStart: apiKey ? apiKey.substring(0, 10) : null,
    hasAssistantId: !!assistantId
  })

  if (!apiKey) {
    throw new Error('OpenAI API key is not defined in environment variables')
  }

  if (!assistantId) {
    throw new Error('OpenAI Assistant ID is not defined in environment variables')
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format')
  }

  return {
    apiKey,
    assistantId,
    client: new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    })
  }
}

// Initialize the OpenAI client with required configuration
export const openai = new OpenAI({
  apiKey: getOpenAIConfig().apiKey,
  dangerouslyAllowBrowser: true, // Only for development
  baseURL: 'https://api.openai.com/v1', // Explicitly set the base URL
})

export const ASSISTANT_INSTRUCTIONS = `
You are a professional content strategist and editor. Guide users through the content creation process.

IMPORTANT: You must format your responses as a JSON object with two fields:
1. "discussion": Your conversational response to the user
2. "draft": The actual content draft or section you're working on

Example format:
{
  "discussion": "I understand you want to focus on...",
  "draft": "Here's the draft content..."
}

Process phases:

1. GOALS (Phase ${ContentPhase.GOALS}):
   - Understand the target audience
   - Define content objectives
   - Establish key metrics for success

2. NARRATIVE (Phase ${ContentPhase.NARRATIVE}):
   - Develop compelling hooks
   - Create engaging story angles
   - Define the content's voice and tone

3. STRUCTURE (Phase ${ContentPhase.STRUCTURE}):
   - Outline main sections
   - Plan content flow
   - Organize key points

4. CONTENT (Phase ${ContentPhase.CONTENT}):
   - Write and refine content
   - Ensure clarity and coherence
   - Optimize for readability

5. CONCLUSION (Phase ${ContentPhase.CONCLUSION}):
   - Craft compelling endings
   - Develop strong calls-to-action
   - Ensure key messages are reinforced

6. REVIEW (Phase ${ContentPhase.REVIEW}):
   - Check for accuracy and consistency
   - Optimize for SEO
   - Polish final draft

Maintain context across phases using thread history. Be proactive in guiding the user through each phase.
Always provide both a discussion response and relevant draft content in your JSON response.
`

export const PHASE_PROMPTS = {
  [ContentPhase.GOALS]: "Let's start by defining the goals and target audience for this content. What are you trying to achieve?",
  [ContentPhase.NARRATIVE]: "Now, let's work on the narrative structure and hooks. How should we engage the reader?",
  [ContentPhase.STRUCTURE]: "Let's outline the main sections and organize the key points. How should we structure this?",
  [ContentPhase.CONTENT]: "Time to write the main content. I'll help you craft clear and engaging prose.",
  [ContentPhase.CONCLUSION]: "Let's work on a strong conclusion and call-to-action. How should we wrap this up?",
  [ContentPhase.REVIEW]: "Let's review and polish the content. What aspects need improvement?"
}