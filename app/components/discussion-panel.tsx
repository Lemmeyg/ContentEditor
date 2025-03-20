'use client'

import { useState, useEffect, useRef } from 'react'
import { useOpenAI } from '@/providers/openai-provider'

export function DiscussionPanel() {
  const { messages, sendMessage, isLoading } = useOpenAI()
  const [input, setInput] = useState('')
  const messagesStartRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToTop()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const content = input.trim()
    setInput('')
    await sendMessage(content)
  }

  const parseMessageContent = (content: string): string => {
    try {
      const parsed = JSON.parse(content)
      return parsed.discussion || content
    } catch {
      return content
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
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
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
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