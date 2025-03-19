import OpenAI from 'openai'

export const CONTENT_ASSISTANT = {
  id: process.env.OPENAI_ASSISTANT_ID,
  model: "gpt-4-turbo-preview",
  instructions: `
    You are a professional content strategist. Guide users through:
    1. Goal definition
    2. Narrative development
    3. Structural planning
    4. Content drafting
    5. CTA formulation
    6. Final review
    Maintain context across phases using thread history
  `,
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Thread management functions
export async function createThread() {
  return await openai.beta.threads.create()
}

export async function addMessageToThread(threadId: string, content: string) {
  return await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  })
} 