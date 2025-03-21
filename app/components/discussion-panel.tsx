'use client'

import { useState, useEffect, useRef } from 'react'
import { useOpenAI } from '@/providers/openai-provider'

export function DiscussionPanel() {
  const { messages, sendMessage, isLoading } = useOpenAI()
  const [input, setInput] = useState('')
  const messagesStartRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToTop = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToTop()
    // Focus input field after AI response (when not loading and messages exist)
    if (!isLoading && messages.length > 0 && inputRef.current) {
      inputRef.current.focus()
    }
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const content = input.trim()
    setInput('')
    await sendMessage(content)
  }

  const parseMessageContent = (content: string): string => {
    // Always try to extract just the message content
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.discussion) {
          // Clean the discussion content before returning
          return parsed.discussion
            .replace(/^(?:The user says?:?\s*|The user said:?\s*)/i, '')
            .replace(/\s*Current state of the content:[\s\S]*$/, '')
            .trim();
        }
      } catch {}
      
      // If JSON parsing fails or no discussion field, clean the raw string
      return content
        .replace(/^(?:The user says?:?\s*|The user said:?\s*)/i, '')
        .replace(/\s*Current state of the content:[\s\S]*$/, '')
        .trim();
    }
    return content;
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Discussion</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div ref={messagesStartRef} />
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{parseMessageContent(message.content)}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
            disabled={isLoading}
            className="flex-1 min-h-[40px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {isLoading ? (
              <span className="material-icons animate-spin text-sm">refresh</span>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 