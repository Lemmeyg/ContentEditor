Here's the properly formatted Markdown version:

```markdown
# Content Editor Application PRD

## Problem
The User needs to quickly produce high quality content and articles but is not good at writing engaging and informative articles.

## Solution
This application will act as co-creator and editor for the user, guiding them through a process, reviewing and creating content to meet the goals of the user.

## Key Points
The process should follow the stages of:
1. Aims, goals and audience of the content
2. Narrative and hooks
3. Structure
4. Content and prose
5. Conclusion and CTA
6. Review and editing

## UX Layout
- **Menu/Settings Panel**: 
  - Far left of screen 
  - 20% screen width
- **Discussion Panel**:
  - Bottom of screen
  - 80% width × 30% height
- **Content Frame**:
  - Top right of screen
  - Remaining space (80% width × 70% height)

## AI Interaction Process
1. In discussion frame, AI prompts user with question/task
2. User responds in discussion box
3. AI reviews input and creates output in content frame
4. User reviews/edits content frame
5. User requests changes or approval in discussion frame

---

# AI Architecture Section

## OpenAI Assistant Integration & Context Management

### 1. Assistant Configuration
```
// lib/assistants.ts
export const CONTENT_ASSISTANT = {
  id: "asst_contentCreator123",
  model: "gpt-4-turbo",
  instructions: `
    You are a professional content strategist. Guide users through:
    1. Goal definition
    2. Narrative development
    3. Structural planning
    4. Content drafting
    5. CTA formulation
    6. Final review
    Maintain context across phases using thread history
  `,
  tools: [{
    type: "function",
    function: {
      name: "update_content_state",
      description: "Track content evolution through phases",
      parameters: {
        type: "object",
        properties: {
          phase: { type: "number" },
          approved_content: { type: "string" },
          user_feedback: { type: "string" }
        }
      }
    }
  }]
};
```

### 2. Context Management Implementation
```
sequenceDiagram
    participant User
    participant UI
    participant API
    participant OpenAI
    participant DB

    User->>UI: Start New Project
    UI->>API: Create Thread
    API->>OpenAI: POST /threads
    OpenAI-->>API: thread_123
    API->>DB: Store Thread ID
    User->>UI: Phase 1 Input
    UI->>API: POST /runs (thread_123)
    API->>OpenAI: Create Run with Assistant ID
    OpenAI-->>API: Run Status
    API->>OpenAI: Poll Run Completion
    OpenAI-->>API: Assistant Response
    API->>DB: Update Thread Messages
    API-->>UI: Formatted Content
```

### 3. Key Technical Changes

#### 3.1 Thread Management
```
// Server-side thread handling
let contentThread = await openai.beta.threads.create();

const maintainContext = async (threadId: string, userInput: string) => {
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: userInput
  });

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: CONTENT_ASSISTANT.id,
    instructions: CONTENT_ASSISTANT.instructions
  });

  while (run.status !== 'completed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    run = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  const messages = await openai.beta.threads.messages.list(threadId);
  return messages.data.content;
};
```

#### 3.2 Phase Transition Handling
```
// Updated phase handler with thread context
const handlePhase = async (phase: number, threadId: string) => {
  const prompt = PHASE_PROMPTS[phase];
  const messages = await openai.beta.threads.messages.list(threadId);
  
  const response = await openai.beta.threads.runs.create(threadId, {
    assistant_id: CONTENT_ASSISTANT.id,
    additional_instructions: `Current phase: ${phase} | ${prompt}`
  });

  return processAssistantResponse(response);
};
```

### 4. Context Retention Features

#### 4.1 Conversation Thread Structure
```
interface ContentThread {
  id: string;
  messages: Array;
  currentPhase: number;
  approvedContent: string;
}
```

#### 4.2 Context Window Management
| Strategy | Implementation | Benefit |
|----------|-----------------|---------|
| Thread Message Pruning | Keep last 15 messages + phase summaries | Maintains context while controlling token usage |
| Phase Summarization | GPT-4 generated summaries at phase transitions | Preserves key decisions |
| Vector Indexing | Store previous versions in Pinecone/Weaviate | Long-term context recall |

### 5. Security Updates
```
# .env.local
OPENAI_ASSISTANT_ID=asst_contentCreator123
THREAD_ENCRYPTION_KEY=enc-key-***
```

### 6. Enhanced Testing Requirements
- **Context Carryover Tests**: Validate phase-to-phase context retention
- **Thread Security Tests**: Ensure thread isolation between users
- **Version Control Tests**: Verify content history preservation

### 7. Implementation Notes from Search Results
> **Thread-Based Context ([Source 4])**:  
> "Threads contain the full message history and tool interactions, maintaining context until expiration"

> **Assistant Control ([Source 1])**:  
> "Assistants can be configured with persistent instructions and file-based knowledge"

> **State Management ([Source 6])**:  
> "API requires explicit context management through message history preservation"

---

## Implementation Ensures
- Dedicated Assistant with updatable system prompts
- Full conversation context via Threads API
- Phase-aware interaction history
- Secure thread isolation between sessions

## File Management

### Naming Convention
- Format: `{content-title}-{YYYY-MM-DD}`
- Example: `new-product-launch-2024-03-14`

### Error Handling
- Display toast notification for Google Drive failures
- Provide clipboard copy button for content backup
- No retry mechanism needed
