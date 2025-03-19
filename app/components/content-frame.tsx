'use client'

import { useState, useEffect } from 'react'
import { useOpenAI } from '@/providers/openai-provider'
import { ContentPhase } from '@/types'

export function ContentFrame() {
  const { currentPhase, isLoading } = useOpenAI()
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save functionality
  useEffect(() => {
    const saveContent = async () => {
      if (!content) return
      setIsSaving(true)
      // Simulate saving to backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastSaved(new Date())
      setIsSaving(false)
    }

    const timeoutId = setTimeout(saveContent, 2000)
    return () => clearTimeout(timeoutId)
  }, [content])

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case ContentPhase.GOALS:
        return 'Content Goals & Target Audience'
      case ContentPhase.NARRATIVE:
        return 'Narrative Structure & Hooks'
      case ContentPhase.STRUCTURE:
        return 'Content Structure'
      case ContentPhase.CONTENT:
        return 'Main Content'
      case ContentPhase.CONCLUSION:
        return 'Conclusion & Call to Action'
      case ContentPhase.REVIEW:
        return 'Final Review & Optimization'
      default:
        return 'Content Editor'
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Phase Title */}
      <div className="border-b border-gray-200 p-2 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{getPhaseTitle()}</h2>
        {isLoading && (
          <span className="text-sm text-gray-500">AI Assistant is thinking...</span>
        )}
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center gap-2">
        <ToolbarButton icon="format_bold" tooltip="Bold" />
        <ToolbarButton icon="format_italic" tooltip="Italic" />
        <ToolbarButton icon="format_underline" tooltip="Underline" />
        <div className="w-px h-4 bg-gray-300 mx-2" />
        <ToolbarButton icon="format_list_bulleted" tooltip="Bullet List" />
        <ToolbarButton icon="format_list_numbered" tooltip="Numbered List" />
        <div className="w-px h-4 bg-gray-300 mx-2" />
        <ToolbarButton icon="link" tooltip="Insert Link" />
        <ToolbarButton icon="image" tooltip="Insert Image" />
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div
          className="max-w-3xl mx-auto prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
          contentEditable
          onInput={(e) => setContent(e.currentTarget.textContent || '')}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ outline: 'none' }}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 p-2 flex justify-between items-center text-sm text-gray-500">
        <div>Words: {content.split(/\s+/).filter(Boolean).length}</div>
        <div className="flex items-center gap-4">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <span className="material-icons animate-spin text-sm">refresh</span>
              Saving...
            </span>
          ) : lastSaved ? (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          ) : null}
          <button 
            className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
            disabled={isSaving || !content}
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({ icon, tooltip }: { icon: string; tooltip: string }) {
  return (
    <button
      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
      title={tooltip}
    >
      <span className="material-icons text-gray-600">{icon}</span>
    </button>
  )
} 