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

export function DiscussionPanel() {
  const { threadManager, currentPhase } = useOpenAI()
  const [messages, setMessages] = useState<MessageDisplay[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadThreadHistory()
  }, [])

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
    console.log('Parsing message content:', content)
    try {
      // Parse the JSON structure
      const parsed = JSON.parse(content)
      
      // Return only the text content
      return {
        discussion: typeof parsed.discussion === 'string' ? parsed.discussion.trim() : '',
        draft: typeof parsed.draft === 'string' ? parsed.draft.trim() : ''
      }
    } catch (error) {
      console.error('Failed to parse message:', error)
      return undefined
    }
  }

  const getDisplayContent = (message: MessageDisplay): string => {
    // Return just the raw text content
    if (message.parsedContent?.discussion) {
      return message.parsedContent.discussion
    }
    return message.content
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    try {
      // Add user message
      console.log('Sending user message:', input)
      const userMessage = await threadManager.addMessage(input)
      console.log('Received user message response:', userMessage)
      setMessages(prev => [{
        ...userMessage,
        parsedContent: parseMessageContent(userMessage.content)
      }, ...prev])
      setInput('')

      // Get assistant response
      console.log('Requesting assistant response...')
      const assistantMessage = await threadManager.getAssistantResponse()
      console.log('Received assistant response:', assistantMessage)
      setMessages(prev => [{
        ...assistantMessage,
        parsedContent: parseMessageContent(assistantMessage.content)
      }, ...prev])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Discussion</h2>
        <p className="text-sm text-gray-600">Current Phase: {currentPhase}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.role === 'assistant' ? 'Assistant' : 'You'}
              </div>
              <div className="whitespace-pre-wrap">
                {getDisplayContent(message)}
              </div>
              <div className="text-xs mt-1 opacity-70">
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
} 