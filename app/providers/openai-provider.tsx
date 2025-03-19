'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ThreadManager } from '@/lib/openai/thread-manager'
import { ContentPhase, ThreadMessage } from '@/types'
import { PHASE_PROMPTS } from '@/lib/openai/config'

interface OpenAIContextType {
  messages: ThreadMessage[]
  isLoading: boolean
  currentPhase: ContentPhase
  sendMessage: (content: string) => Promise<void>
  setPhase: (phase: ContentPhase) => Promise<void>
}

const OpenAIContext = createContext<OpenAIContextType | null>(null)

export function OpenAIProvider({ children }: { children: React.ReactNode }) {
  const [threadManager] = useState(() => new ThreadManager())
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<ContentPhase>(ContentPhase.GOALS)

  useEffect(() => {
    const initThread = async () => {
      setIsLoading(true)
      try {
        await threadManager.createThread()
      } catch (error) {
        console.error('Failed to initialize thread:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initThread()
  }, [])

  const sendMessage = async (content: string) => {
    setIsLoading(true)
    try {
      // Add user message
      const userMessage = await threadManager.addMessage(content)
      setMessages(prev => [...prev, userMessage])

      // Get assistant response
      const assistantMessage = await threadManager.getAssistantResponse()
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setPhase = async (phase: ContentPhase) => {
    setCurrentPhase(phase)
    await sendMessage(PHASE_PROMPTS[phase])
  }

  return (
    <OpenAIContext.Provider
      value={{
        messages,
        isLoading,
        currentPhase,
        sendMessage,
        setPhase,
      }}
    >
      {children}
    </OpenAIContext.Provider>
  )
}

export function useOpenAI() {
  const context = useContext(OpenAIContext)
  if (!context) {
    throw new Error('useOpenAI must be used within an OpenAIProvider')
  }
  return context
} 