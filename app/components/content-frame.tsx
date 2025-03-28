'use client'

import { useOpenAI } from '@/providers/openai-provider'
import { useEffect } from 'react'

export function ContentFrame() {
  const { currentContent, setCurrentContent, isLoading } = useOpenAI()

  // Debug logging for isLoading changes
  useEffect(() => {
    console.log('ContentFrame: isLoading state changed to:', isLoading, new Date().toISOString())
  }, [isLoading])

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Content Draft</h2>
      </div>

      {/* Content Area with Loading Overlay Container */}
      <div className="flex-1 relative">
        {/* Main Content Area */}
        <div className="absolute inset-0 p-4">
          <textarea
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            className="w-full h-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your content will appear here..."
            disabled={isLoading}
          />
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-[9999]">
            <div className="w-[70%] h-[70%] bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-lg flex items-center justify-center">
              <div className="text-gray-600 text-base">AI is thinking...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 