'use client'

import { useOpenAI } from '@/providers/openai-provider'
import { AssistantSelector } from './assistant-selector'
import { Assistant } from '../config/assistants'

export function MenuPanel() {
  const { setAssistant } = useOpenAI()

  const handleAssistantChange = (assistant: Assistant) => {
    setAssistant(assistant);
  };

  return (
    <aside className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Content Editor</h2>
        <p className="text-sm text-gray-500 mt-1">AI-Powered Content Creation</p>
      </div>

      {/* Assistant Selector */}
      <div className="border-b border-gray-200">
        <AssistantSelector onAssistantChange={handleAssistantChange} />
      </div>

      {/* Settings Footer */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <button 
          className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  )
} 