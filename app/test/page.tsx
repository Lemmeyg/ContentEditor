'use client'

import { useState } from 'react'
import { testOpenAIConnection, testAssistantAccess } from '@/lib/openai/test-connection'
import { useOpenAI } from '@/providers/openai-provider'

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('')
  const [assistantStatus, setAssistantStatus] = useState<string>('')
  const [messageStatus, setMessageStatus] = useState<string>('')
  const { sendMessage, messages } = useOpenAI()

  const runConnectionTest = async () => {
    setConnectionStatus('Testing...')
    const success = await testOpenAIConnection()
    setConnectionStatus(success ? 'Success ✅' : 'Failed ❌')
  }

  const runAssistantTest = async () => {
    setAssistantStatus('Testing...')
    const success = await testAssistantAccess()
    setAssistantStatus(success ? 'Success ✅' : 'Failed ❌')
  }

  const testMessage = async () => {
    setMessageStatus('Sending...')
    try {
      await sendMessage('Hello, this is a test message. Please respond with a simple confirmation.')
      setMessageStatus('Success ✅')
    } catch (error) {
      console.error('Message test failed:', error)
      setMessageStatus('Failed ❌')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">OpenAI Integration Tests</h1>
      
      <div className="space-y-6">
        {/* Connection Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">1. API Connection Test</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={runConnectionTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Test Connection
            </button>
            <span className="text-sm">{connectionStatus}</span>
          </div>
        </div>

        {/* Assistant Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">2. Assistant Access Test</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={runAssistantTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Test Assistant
            </button>
            <span className="text-sm">{assistantStatus}</span>
          </div>
        </div>

        {/* Message Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">3. Message Exchange Test</h2>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={testMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Send Test Message
            </button>
            <span className="text-sm">{messageStatus}</span>
          </div>
          
          {/* Message Display */}
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Recent Messages:</h3>
            <div className="border rounded p-4 max-h-40 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-2 p-2 rounded ${
                    message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs text-gray-500">{message.role}:</div>
                  <div className="text-sm">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 