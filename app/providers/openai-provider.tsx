'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ThreadManager } from '@/lib/openai/thread-manager'
import { ThreadMessage } from '@/types'
import { Assistant, assistants } from '../config/assistants'

interface OpenAIContextType {
  messages: ThreadMessage[]
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
  threadManager: ThreadManager
  currentContent: string
  setCurrentContent: (content: string) => void
  currentAssistant: Assistant
  setAssistant: (assistant: Assistant) => Promise<void>
}

const OpenAIContext = createContext<OpenAIContextType | null>(null)

export function OpenAIProvider({ children }: { children: React.ReactNode }) {
  const [threadManager] = useState(() => new ThreadManager())
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentContent, setCurrentContent] = useState<string>('')
  const [currentAssistant, setCurrentAssistant] = useState<Assistant>(assistants[0])

  // Debug logging for isLoading changes
  useEffect(() => {
    console.log('OpenAIProvider: isLoading changed to:', isLoading, new Date().toISOString())
  }, [isLoading])

  const setLoadingWithLog = (value: boolean) => {
    console.log('OpenAIProvider: Setting isLoading to:', value, new Date().toISOString(), new Error().stack)
    setIsLoading(value)
  }

  useEffect(() => {
    const initThread = async () => {
      setLoadingWithLog(true)
      try {
        await threadManager.createThread()
      } catch (error) {
        console.error('Failed to initialize thread:', error)
      } finally {
        setLoadingWithLog(false)
      }
    }

    initThread()
  }, [])

  const sendMessage = async (content: string) => {
    console.log('OpenAIProvider: sendMessage called')
    setLoadingWithLog(true)
    try {
      console.log('OpenAIProvider: Creating message with content')
      const messageWithContent = JSON.stringify({
        discussion: content,
        currentDraft: currentContent
      })

      console.log('OpenAIProvider: Adding user message')
      const userMessage = await threadManager.addMessage(messageWithContent)
      setMessages(prev => [userMessage, ...prev])

      console.log('OpenAIProvider: Getting assistant response')
      const assistantMessage = await threadManager.getAssistantResponse()
      setMessages(prev => [assistantMessage, ...prev])
      console.log('OpenAIProvider: Message exchange complete')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      console.log('OpenAIProvider: Setting loading to false')
      setLoadingWithLog(false)
    }
  }

  const setAssistant = async (assistant: Assistant) => {
    console.log('OpenAIProvider: setAssistant called')
    setLoadingWithLog(true)
    try {
      await threadManager.updateAssistant(assistant.id)
      setCurrentAssistant(assistant)
      
      setMessages([])
      await threadManager.createThread()
      
      await sendMessage(`I've switched to the ${assistant.name} assistant. ${assistant.description}`)
    } catch (error) {
      console.error('Failed to switch assistant:', error)
    } finally {
      setLoadingWithLog(false)
    }
  }

  return (
    <OpenAIContext.Provider
      value={{
        messages,
        isLoading,
        sendMessage,
        threadManager,
        currentContent,
        setCurrentContent,
        currentAssistant,
        setAssistant
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