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
  threadManager: ThreadManager
  currentContent: string
  setCurrentContent: (content: string) => void
}

const OpenAIContext = createContext<OpenAIContextType | null>(null)

export function OpenAIProvider({ children }: { children: React.ReactNode }) {
  const [threadManager] = useState(() => new ThreadManager())
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<ContentPhase>(ContentPhase.GOALS)
  const [currentContent, setCurrentContent] = useState<string>('')

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
      // Create a message that includes both the user's input and current content state
      const messageWithContent = JSON.stringify({
        discussion: content,
        currentDraft: currentContent
      })

      // Add user message
      const userMessage = await threadManager.addMessage(messageWithContent)
      setMessages(prev => [userMessage, ...prev])

      // Get assistant response
      const assistantMessage = await threadManager.getAssistantResponse()
      setMessages(prev => [assistantMessage, ...prev])
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
        threadManager,
        currentContent,
        setCurrentContent
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