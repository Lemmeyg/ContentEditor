'use client'

import { useState, useEffect } from 'react'
import { ThreadMessage } from '@/types'
import { useOpenAI } from '@/context/OpenAIContext'

interface MessageDisplay extends ThreadMessage {
  parsedContent?: {
    discussion: string;
    draft: string;
  };
}

export function ContentFrame() {
  const { threadManager, currentPhase, messages: contextMessages } = useOpenAI()
  const [messages, setMessages] = useState<MessageDisplay[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadThreadHistory()
  }, [])

  // Update messages when context messages change
  useEffect(() => {
    setMessages(contextMessages.map(msg => ({
      ...msg,
      parsedContent: parseMessageContent(msg.content)
    })))
  }, [contextMessages])

  const loadThreadHistory = async () => {
    try {
      const history = await threadManager.getThreadHistory()
      setMessages(history.map(msg => ({
        ...msg,
        parsedContent: parseMessageContent(msg.content)
      })))
    } catch (error) {
      console.error('Failed to load thread history:', error)
    }
  }

  const parseMessageContent = (content: string): { discussion: string; draft: string } | undefined => {
    console.log('Parsing content:', content); // Debug log
    
    try {
      // If content is already a string, try to parse it as JSON
      const parsed = typeof content === 'object' ? content : JSON.parse(content);
      
      // Extract draft content - handle cases where it starts with ### or has escaped newlines
      let draftContent = '';
      if (parsed.draft) {
        draftContent = parsed.draft
          .replace(/^###\s*/, '') // Remove ### prefix
          .replace(/\\n/g, '\n')  // Replace escaped newlines
          .replace(/\\/g, '')     // Remove remaining escapes
          .trim();
      }

      // Return parsed content
      return {
        discussion: parsed.discussion || "",
        draft: draftContent || ""
      };
    } catch (error) {
      console.error('Failed to parse message content:', error);
      // If parsing fails, check if the content contains a draft marker
      if (typeof content === 'string' && content.includes('"draft"')) {
        try {
          // Try to extract draft content using regex
          const draftMatch = content.match(/"draft":\s*"([^"]*)"/);
          const discussionMatch = content.match(/"discussion":\s*"([^"]*)"/);
          
          return {
            discussion: discussionMatch ? discussionMatch[1].replace(/\\n/g, '\n') : "",
            draft: draftMatch ? draftMatch[1].replace(/\\n/g, '\n') : ""
          };
        } catch {
          return {
            discussion: content,
            draft: ""
          };
        }
      }
      
      return {
        discussion: content,
        draft: ""
      };
    }
  }

  // Find the latest assistant message with Draft content
  const latestDraft = messages
    .filter(msg => msg.role === 'assistant' && msg.parsedContent?.draft)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Content Draft</h2>
        <p className="text-sm text-gray-600">Current Phase: {currentPhase}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {latestDraft?.parsedContent?.draft ? (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">
              {latestDraft.parsedContent.draft}
            </div>
            <div className="text-xs mt-2 text-gray-500">
              Last updated: {new Date(latestDraft.createdAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic">
            No content draft available yet. Start a discussion to generate content.
          </div>
        )}
      </div>
    </div>
  )
} 