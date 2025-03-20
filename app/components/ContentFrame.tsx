'use client'

import { useState, useEffect, useRef } from 'react'
import { ThreadMessage } from '@/types'
import { useOpenAI } from '@/providers/openai-provider'

interface MessageDisplay extends ThreadMessage {
  parsedContent?: {
    discussion: string;
    draft: string;
  };
}

export function ContentFrame() {
  const { messages: contextMessages, currentPhase, threadManager, setCurrentContent } = useOpenAI()
  const [messages, setMessages] = useState<MessageDisplay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [savedContent, setSavedContent] = useState('')

  useEffect(() => {
    console.log('ContentFrame mounted');
    loadThreadHistory()
  }, [])

  // Update messages when context messages change
  useEffect(() => {
    console.log('ContentFrame: contextMessages changed:', {
      messageCount: contextMessages?.length,
      messages: contextMessages
    });

    if (contextMessages?.length) {
      const parsedMessages = contextMessages.map((msg: ThreadMessage) => {
        const parsed = parseMessageContent(msg.content);
        console.log('Parsed message:', {
          role: msg.role,
          content: msg.content,
          parsed
        });
        return {
          ...msg,
          parsedContent: parsed
        };
      });
      console.log('Setting parsed messages:', parsedMessages);
      setMessages(parsedMessages);
    }
  }, [contextMessages])

  const loadThreadHistory = async () => {
    console.log('ContentFrame: Loading thread history');
    try {
      const history = await threadManager.getThreadHistory()
      console.log('ContentFrame: Received history:', history);
      const parsedMessages = history.map((msg: ThreadMessage) => ({
        ...msg,
        parsedContent: parseMessageContent(msg.content)
      }));
      console.log('ContentFrame: Setting parsed history:', parsedMessages);
      setMessages(parsedMessages)
    } catch (error) {
      console.error('Failed to load thread history:', error)
    }
  }

  // Log the current state before rendering
  useEffect(() => {
    console.log('ContentFrame: Current state:', {
      messageCount: messages.length,
      messages,
      currentPhase
    });
  }, [messages, currentPhase]);

  const parseMessageContent = (content: string): { discussion: string; draft: string } | undefined => {
    console.log('Parsing content:', content); // Debug log
    
    try {
      // Handle case where content is already an object
      const parsed = typeof content === 'object' ? content : JSON.parse(content);
      
      // Extract draft content with improved handling
      let draftContent = '';
      if (parsed.draft) {
        draftContent = parsed.draft
          .replace(/^###\s*/, '') // Remove markdown headers
          .replace(/\\n/g, '\n')  // Replace escaped newlines
          .replace(/\\\"/g, '"')  // Replace escaped quotes
          .replace(/\\/g, '')     // Remove remaining escapes
          .trim();

        // If draft is empty after processing, try to extract from raw content
        if (!draftContent && typeof content === 'string') {
          const draftMatch = content.match(/"draft":\s*"((?:\\.|[^"\\])*)"/)
          if (draftMatch) {
            draftContent = draftMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\\"/g, '"')
              .replace(/\\/g, '')
              .trim();
          }
        }
      }

      console.log('Parsed draft content:', draftContent); // Debug log

      return {
        discussion: parsed.discussion || "",
        draft: draftContent || ""
      };
    } catch (error) {
      console.error('Failed to parse message content:', error);
      
      // Fallback parsing for string content
      if (typeof content === 'string') {
        try {
          // Try to extract draft content using improved regex
          const draftMatch = content.match(/"draft":\s*"((?:\\.|[^"\\])*)"/)
          const discussionMatch = content.match(/"discussion":\s*"((?:\\.|[^"\\])*)"/)
          
          const draft = draftMatch ? 
            draftMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\\"/g, '"')
              .replace(/\\/g, '')
              .trim() : "";
              
          const discussion = discussionMatch ? 
            discussionMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\\"/g, '"')
              .replace(/\\/g, '')
              .trim() : content;

          console.log('Fallback parsed content:', { discussion, draft }); // Debug log
          
          return {
            discussion,
            draft
          };
        } catch (e) {
          console.error('Fallback parsing failed:', e);
          return {
            discussion: content,
            draft: ""
          };
        }
      }
      
      return {
        discussion: content,
        draft: ""
      };
    }
  }

  // Find the latest assistant message with Draft content
  console.log('ContentFrame: Finding latest draft from', messages.length, 'messages');
  const latestDraft = messages
    .filter(msg => {
      console.log('ContentFrame: Examining message:', {
        role: msg.role,
        hasContent: !!msg.content,
        parsedContent: msg.parsedContent,
        createdAt: msg.createdAt
      });
      const hasDraft = msg.role === 'assistant' && !!msg.parsedContent?.draft;
      console.log('ContentFrame: Message has draft:', hasDraft);
      return hasDraft;
    })
    .sort((a, b) => {
      console.log('ContentFrame: Sorting messages:', {
        a: new Date(a.createdAt).getTime(),
        b: new Date(b.createdAt).getTime()
      });
      return b.createdAt.getTime() - a.createdAt.getTime();
    })[0];
  
  console.log('ContentFrame: Selected latest draft:', {
    hasLatestDraft: !!latestDraft,
    content: latestDraft?.parsedContent
  });

  // Update content when new draft arrives
  useEffect(() => {
    if (latestDraft?.parsedContent?.draft && contentRef.current) {
      // Convert newlines to <br> and preserve paragraphs
      const formattedContent = latestDraft.parsedContent.draft
        .split('\n\n') // Split on double newlines for paragraphs
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
      
      // Always update content when a new draft arrives from the assistant
      if (latestDraft.role === 'assistant') {
        contentRef.current.innerHTML = formattedContent;
        setCurrentContent(formattedContent);
      }
    }
  }, [latestDraft]);

  const handleBlur = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML || '';
      setCurrentContent(newContent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Content Draft</h2>
        <p className="text-sm text-gray-600">Current Phase: {currentPhase}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {latestDraft?.parsedContent?.draft ? (
          <div className="prose max-w-none flex justify-center">
            <div className="w-[600px]">
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleBlur}
                className="whitespace-pre-wrap text-[12px] font-mono focus:outline-none border border-transparent focus:border-gray-300 rounded-md p-3 min-h-[200px] [&>p]:mb-4 last:[&>p]:mb-0"
              />
              <div className="text-xs mt-2 text-gray-500">
                Last updated: {new Date(latestDraft.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic text-sm">
            No content draft available yet. Start a discussion to generate content.
          </div>
        )}
      </div>
    </div>
  );
} 