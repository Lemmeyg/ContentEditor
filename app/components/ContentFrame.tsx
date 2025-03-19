'use client'

import { useState, useEffect } from 'react'
import { ThreadMessage } from '@/types'
import { useOpenAI } from '@/providers/openai-provider'

interface MessageDisplay extends ThreadMessage {
  parsedContent?: {
    discussion: string;
    draft: string;
  };
}

export function ContentFrame() {
  const { messages: contextMessages, currentPhase, threadManager } = useOpenAI()
  const [messages, setMessages] = useState<MessageDisplay[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Content Draft</h2>
        <p className="text-sm text-gray-600">Current Phase: {currentPhase}</p>
      </div>

      {(() => {
        console.log('ContentFrame: Render state:', {
          hasLatestDraft: !!latestDraft,
          parsedContent: latestDraft?.parsedContent,
          draftContent: latestDraft?.parsedContent?.draft,
          messageCount: messages.length
        });
        
        return (
          <div className="flex-1 p-4 overflow-y-auto">
            {latestDraft?.parsedContent?.draft ? (
              <div className="prose max-w-none">
                {(() => {
                  console.log('ContentFrame: Rendering draft content:', latestDraft.parsedContent.draft);
                  return (
                    <div className="whitespace-pre-wrap">
                      {latestDraft.parsedContent.draft}
                    </div>
                  );
                })()}
                <div className="text-xs mt-2 text-gray-500">
                  Last updated: {new Date(latestDraft.createdAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">
                {(() => {
                  console.log('ContentFrame: No draft content available');
                  return 'No content draft available yet. Start a discussion to generate content.';
                })()}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
} 