'use client'

import { useState, useEffect, useRef } from 'react'
import { ThreadMessage } from '@/types'
import { useOpenAI } from '@/providers/openai-provider'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
  const [contentHistory, setContentHistory] = useState<string[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
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

  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML;
      // Only add to history if content has changed
      if (newContent !== contentHistory[currentHistoryIndex]) {
        // Remove any future history entries if we're not at the latest point
        const newHistory = contentHistory.slice(0, currentHistoryIndex + 1);
        setContentHistory([...newHistory, newContent]);
        setCurrentHistoryIndex(newHistory.length);
        setCurrentContent(newContent);
      }
    }
  };

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      const previousContent = contentHistory[currentHistoryIndex - 1];
      if (contentRef.current && previousContent) {
        contentRef.current.innerHTML = previousContent;
        setCurrentHistoryIndex(currentHistoryIndex - 1);
        setCurrentContent(previousContent);
      }
    }
  };

  // Update content when new draft arrives
  useEffect(() => {
    if (latestDraft?.parsedContent?.draft && contentRef.current) {
      // Convert newlines to <br> and preserve paragraphs
      const formattedContent = latestDraft.parsedContent.draft
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
      
      if (latestDraft.role === 'assistant') {
        contentRef.current.innerHTML = formattedContent;
        setCurrentContent(formattedContent);
        // Reset history with new content
        setContentHistory([formattedContent]);
        setCurrentHistoryIndex(0);
      }
    }
  }, [latestDraft]);

  const handleBlur = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML || '';
      setCurrentContent(newContent);
    }
  };

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML;
      handleContentChange();
      contentRef.current.focus();
    }
  };

  const handleCopy = async () => {
    if (contentRef.current) {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || contentRef.current.innerText;
      try {
        await navigator.clipboard.writeText(selectedText);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand('insertText', false, text);
      handleContentChange();
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!contentRef.current) return;

    if (format === 'docx') {
      // Create a new document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: contentRef.current.innerText,
                  size: 24, // 12pt font
                }),
              ],
            }),
          ],
        }],
      });

      // Generate and save the document
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Create a temporary div for better rendering
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentRef.current.innerHTML;
      tempDiv.style.width = '600px'; // Match content width
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      document.body.appendChild(tempDiv);

      try {
        // Convert the content to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // Higher resolution
          useCORS: true,
          logging: false,
        });

        // Create PDF
        const pdf = new jsPDF({
          unit: 'px',
          format: 'a4',
        });

        // Calculate dimensions to fit the page
        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add the content
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight
        );

        // Save the PDF
        pdf.save(`content-export-${new Date().toISOString().split('T')[0]}.pdf`);
      } finally {
        // Clean up
        document.body.removeChild(tempDiv);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
        <h2 className="text-lg font-semibold text-gray-800">Content Draft</h2>
        <p className="text-sm text-gray-600">Current Phase: {currentPhase}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={currentHistoryIndex <= 0}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Undo last change"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Undo
            </button>
          </div>
        </div>
        {/* Formatting Toolbar */}
        <div className="flex gap-1 mt-2 border-t pt-2">
          <button
            onClick={() => handleFormat('bold')}
            className="p-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
            title="Bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.8 10.5c.7-.6 1.2-1.5 1.2-2.5 0-2.2-1.8-4-4-4H5v12h6.3c2.2 0 4-1.8 4-4 0-1-.4-1.9-1.1-2.5zM8 6h2c.6 0 1 .4 1 1s-.4 1-1 1H8V6zm2.5 8H8v-2h2.5c.6 0 1 .4 1 1s-.4 1-1 1z"/>
            </svg>
          </button>
          <button
            onClick={() => handleFormat('italic')}
            className="p-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
            title="Italic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 4H8v2h2.5L7 14H4v2h7v-2H8.5L12 6h3V4z"/>
            </svg>
          </button>
          <button
            onClick={() => handleFormat('underline')}
            className="p-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
            title="Underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12c2.2 0 4-1.8 4-4V3h-2v5c0 1.1-.9 2-2 2s-2-.9-2-2V3H6v5c0 2.2 1.8 4 4 4zm-7 5h14v2H3v-2z"/>
            </svg>
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" /> {/* Divider */}
          <button
            onClick={handleCopy}
            className="p-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
            title="Copy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zm0-2h8a4 4 0 014 4v11a4 4 0 01-4 4H6a4 4 0 01-4-4V5a4 4 0 014-4z" />
            </svg>
          </button>
          <button
            onClick={handlePaste}
            className="p-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
            title="Paste"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M3 5a2 2 0 012-2h8.5L16 5.5V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v10h10V6h-2V4H5v1z" />
            </svg>
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" /> {/* Divider */}
          <div className="relative group">
            <button
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
              title="Export document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button
                onClick={() => handleExport('docx')}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                  <path d="M3 8a2 2 0 012-2h2.93a.25.25 0 01.25.25v1.5a.25.25 0 01-.25.25H5a.25.25 0 00-.25.25v6.5a.25.25 0 00.25.25h6.5a.25.25 0 00.25-.25v-2.93a.25.25 0 01.25-.25h1.5a.25.25 0 01.25.25V14a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Word (.docx)
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                PDF (.pdf)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {latestDraft?.parsedContent?.draft ? (
          <div className="prose max-w-none flex justify-center">
            <div className="w-[600px]">
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentChange}
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