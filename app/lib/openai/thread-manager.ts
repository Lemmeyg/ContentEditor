import { openai } from './config'
import { ThreadMessage } from '@/types'
import { MessageContent } from 'openai/resources/beta/threads/messages'

interface AssistantResponse {
  discussion: string;
  draft: string;
}

interface AssistantSchemaResponse {
  name: string;
  strict: boolean;
  schema: {
    type: string;
    properties: {
      discussion: {
        type: string;
        description: string;
      };
      draft: {
        type: string;
        description: string;
      };
    };
    required: string[];
    additionalProperties: boolean;
  };
}

export class ThreadManager {
  private threadId: string | null = null
  private runId: string | null = null

  private getMessageContent(content: any[]): string {
    // Find the first text content block
    const textContent = content.find(
      (c): c is { type: 'text'; text: { value: string } } => c.type === 'text'
    )
    
    if (!textContent) {
      throw new Error('No text content found in message')
    }

    const rawText = textContent.text.value.trim()
    console.log('Raw text from OpenAI:', rawText)

    // For user messages that include currentDraft, parse and format appropriately
    try {
      const parsed = JSON.parse(rawText)
      if (parsed.currentDraft !== undefined) {
        return JSON.stringify({
          discussion: parsed.discussion || "",
          draft: parsed.currentDraft || ""
        })
      }
      
      // Handle existing message formats
      if (!rawText.startsWith('{')) {
        return JSON.stringify({
          discussion: rawText,
          draft: ""
        })
      }

      // Extract the actual text content from the JSON structure
      const extractTextContent = (text: string): { discussion: string; draft: string } => {
        // Try to parse the JSON first
        try {
          const parsed = JSON.parse(text)
          
          // If we have a response field, try to parse that
          if (parsed.response) {
            try {
              const innerParsed = JSON.parse(parsed.response)
              return {
                discussion: innerParsed.discussion || "",
                draft: innerParsed.draft || ""
              }
            } catch {
              // If parsing response fails, use it as is
              return {
                discussion: parsed.response,
                draft: ""
              }
            }
          }
          
          // Return the discussion and draft fields if they exist
          return {
            discussion: parsed.discussion || "",
            draft: parsed.draft || ""
          }
        } catch {
          // If parsing fails, try regex extraction
          const discussionMatch = text.match(/"discussion":\s*"([^"]*)"/)
          const draftMatch = text.match(/"draft":\s*"([^"]*)"/)
          
          return {
            discussion: discussionMatch ? discussionMatch[1] : text,
            draft: draftMatch ? draftMatch[1] : ""
          }
        }
      }

      const { discussion, draft } = extractTextContent(rawText)
      console.log('Extracted content:', { discussion, draft })
      
      // Return the extracted content in our standard JSON format
      return JSON.stringify({
        discussion: discussion.trim(),
        draft: draft.trim()
      })

    } catch (error) {
      console.error('Content extraction failed:', error)
      return JSON.stringify({
        discussion: rawText,
        draft: ""
      })
    }
  }

  async createThread(): Promise<string> {
    try {
      const thread = await openai.beta.threads.create()
      this.threadId = thread.id
      console.log('✅ Thread created:', thread.id)
      return thread.id
    } catch (error: any) {
      console.error('❌ Failed to create thread:', error)
      throw error
    }
  }

  async addMessage(content: string): Promise<ThreadMessage> {
    if (!this.threadId) {
      throw new Error('Thread not initialized')
    }

    try {
      // Parse the content to check if it includes currentDraft
      let messageContent = content;
      try {
        const parsed = JSON.parse(content);
        if (parsed.currentDraft !== undefined) {
          messageContent = `The user says: ${parsed.discussion}\n\nCurrent state of the content:\n${parsed.currentDraft}`;
        }
      } catch {
        // If parsing fails, use the content as is
      }

      const message = await openai.beta.threads.messages.create(this.threadId, {
        role: 'user',
        content: messageContent,
      })

      console.log('✅ Message added to thread')
      return {
        id: message.id,
        role: 'user',
        content: this.getMessageContent(message.content),
        createdAt: new Date(message.created_at * 1000),
      }
    } catch (error: any) {
      console.error('❌ Failed to add message:', error)
      throw error
    }
  }

  async getAssistantResponse(): Promise<ThreadMessage> {
    if (!this.threadId) {
      throw new Error('Thread not initialized')
    }

    const assistantId = process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID
    if (!assistantId) {
      throw new Error('NEXT_PUBLIC_OPENAI_ASSISTANT_ID is not configured')
    }

    try {
      // Create a run
      console.log('Creating run with assistant:', assistantId)
      const run = await openai.beta.threads.runs.create(this.threadId, {
        assistant_id: assistantId,
      })
      this.runId = run.id
      console.log('✅ Run created:', run.id)

      // Poll for completion
      const completedRun = await this.waitForRunCompletion()
      console.log('✅ Run completed:', completedRun.status)

      // Get the latest message
      const messages = await openai.beta.threads.messages.list(this.threadId)
      const latestMessage = messages.data[0]

      if (!latestMessage || !latestMessage.content.length) {
        throw new Error('No response received from assistant')
      }

      console.log('✅ Got assistant response')
      return {
        id: latestMessage.id,
        role: 'assistant',
        content: this.getMessageContent(latestMessage.content),
        createdAt: new Date(latestMessage.created_at * 1000),
      }
    } catch (error: any) {
      console.error('❌ Failed to get assistant response:', {
        message: error.message,
        status: error.status,
        type: error.type
      })
      throw error
    }
  }

  private async waitForRunCompletion() {
    if (!this.threadId || !this.runId) {
      throw new Error('Thread or run not initialized')
    }

    try {
      let run = await openai.beta.threads.runs.retrieve(this.threadId, this.runId)
      console.log('Initial run status:', run.status)

      while (run.status === 'in_progress' || run.status === 'queued') {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        run = await openai.beta.threads.runs.retrieve(this.threadId, this.runId)
        console.log('Run status:', run.status)
      }

      if (run.status === 'failed') {
        throw new Error(`Assistant run failed: ${run.last_error?.message || 'Unknown error'}`)
      }

      return run
    } catch (error: any) {
      console.error('❌ Error while waiting for run completion:', error)
      throw error
    }
  }

  async getThreadHistory(): Promise<ThreadMessage[]> {
    if (!this.threadId) {
      throw new Error('Thread not initialized')
    }

    try {
      const messages = await openai.beta.threads.messages.list(this.threadId)
      console.log('✅ Retrieved thread history:', messages.data.length, 'messages')

      // Return messages in reverse chronological order (newest first)
      return messages.data
        .sort((a, b) => b.created_at - a.created_at)
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: this.getMessageContent(message.content),
          createdAt: new Date(message.created_at * 1000),
        }))
    } catch (error: any) {
      console.error('❌ Failed to get thread history:', error)
      throw error
    }
  }
} 