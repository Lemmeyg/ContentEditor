# Technical Product Requirements Document
## Content Creation Assistant Platform with Customizable Templates
*Version 1.2 | March 2025*

## 1. User Workflow & Technical Mapping

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant DB
    participant OpenAI
    participant Google

    User->>UI: Select Content Type (Project/Blog/LinkedIn)
    User->>UI: Choose/Customize Template
    UI->>DB: Fetch/Store Custom Template
    UI->>API: Fetch Assistant Config (GET /api/assistants)
    API->>OpenAI: List Assistants (HTTP GET)
    OpenAI-->>API: Assistant IDs
    API-->>UI: Render Assistant Selector
    User->>UI: Chat Input (Markdown supported)
    UI->>API: Stream Request with Template (POST /api/chat)
    API->>DB: Merge Template with Assistant Config
    API->>OpenAI: Create Thread & Run (HTTP POST)
    OpenAI-->>API: Stream Response (NDJSON)
    API-->>UI: Real-Time Markdown Rendering
    User->>UI: Export to Google Docs
    UI->>API: Convert to GDocs Format (POST /api/export)
    API->>Google: Create Document (Drive API v3)
    Google-->>UI: Document URL
```

## 2. Technical Stack Requirements

### 2.1 Core Stack
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Database | PostgreSQL | 15 | Content History, Custom Templates |

### 2.2 OpenAI Assistant Configuration

```typescript
// lib/assistants.ts
export const ASSISTANTS = {
  PROJECT_OVERVIEW: {
    id: "asst_project123",
    model: "gpt-4-turbo",
    instructions: `
      - Generate markdown-structured project briefs
      - Include sections: Objectives, Stakeholders, Timeline
      - Use tables for milestone planning
    `,
    tools: [{ type: "file_search" }],
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          sections: { type: "array", items: { type: "string" } },
          content: {
            type: "object",
            properties: {
              objectives: { type: "string" },
              stakeholders: { type: "array", items: { type: "string" } },
              timeline: { type: "string" },
              milestones: { type: "array", items: { type: "object" } }
            }
          }
        }
      }
    }
  },
  // Similar updates for BLOG_POST and LINKEDIN
}
```

## 3. Critical Implementation Details

### 3.1 Real-Time Chat System

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, assistantId, customTemplate } = await req.json();
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const mergedConfig = await mergeTemplateWithAssistant(assistantId, customTemplate);
  
  const stream = await openai.beta.threads.createAndRunPoll({
    assistant_id: mergedConfig.id,
    stream: true,
    thread: { messages }
  });

  return new StreamingTextResponse(stream);
}
```

### 3.3 Template Management System

```typescript
// lib/templates.ts
import { prisma } from './prisma';

export async function saveCustomTemplate(userId: string, template: object) {
  return prisma.customTemplate.upsert({
    where: { userId },
    update: { template },
    create: { userId, template }
  });
}

export async function getCustomTemplate(userId: string) {
  return prisma.customTemplate.findUnique({
    where: { userId }
  });
}

export async function mergeTemplateWithAssistant(assistantId: string, customTemplate: object, mediaElements = []) {
  const assistant = ASSISTANTS[assistantId];
  
  // Create media placeholders for the template
  const mediaPlaceholders = mediaElements.map((media, index) => 
    `[${media.type.toUpperCase()}_${index+1}]`
  );
  
  const mediaInstructions = mediaElements.length > 0 
    ? `\n\nIncorporate these media elements at appropriate positions: ${
        mediaElements.map((media, index) => 
          `${media.type.toUpperCase()}_${index+1}: ${media.description}`
        ).join(', ')
      }`
    : '';
  
  return {
    ...assistant,
    instructions: `${assistant.instructions}${mediaInstructions}\n\nUse this custom structure: ${JSON.stringify(customTemplate)}`,
    mediaElements
  };
}
```

## 4. Key Infrastructure Requirements

### 4.1 Environment Variables
```
POSTGRES_URL=postgres://user:pass@host:5432/customtemplates
OPENAI_API_KEY=your_openai_key
STABILITY_API_KEY=your_stability_ai_key
MEDIA_STORAGE_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### 4.3 Database Schema Updates

```sql
CREATE TABLE custom_templates (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  template JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media_assets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carousels (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slides JSONB NOT NULL,
  settings JSONB NOT NULL,
  html_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Testing Requirements
1. Integration Tests: Jest (Template merging and database operations)
2. E2E Tests: Cypress (User flow from template selection to content generation)
3. Unit Tests: Jest (Component rendering and state management)
4. Load Testing: k6 (API performance under high concurrent user load)
5. Media Generation Tests: Validate image and carousel generation processes

## 6. Deployment Architecture
```json
// vercel.json
{
  "env": {
    "POSTGRES_URL": "@custom-templates-db-url",
    "OPENAI_API_KEY": "@openai-api-key",
    "STABILITY_API_KEY": "@stability-api-key"
  }
}
```

## 7. Risk Mitigation
1. Rate Limiting: Implement to prevent API abuse and control costs
2. Error Handling: Graceful degradation when OpenAI API is unavailable
3. Content Moderation: Filter inappropriate content from AI outputs
4. Cost Management: Track token usage and implement budget controls
5. Template Validation: Zod schema validation for user-submitted templates
6. Media Content Filtering: Ensure generated images comply with acceptable use policies

## 8. User Interface Updates

### 8.1 Template Management UI

```typescript
// components/TemplateManager.tsx
import { useState, useEffect } from 'react';
import { Button, Input, TextArea } from '@/components/ui';

export function TemplateManager() {
  const [template, setTemplate] = useState({});

  useEffect(() => {
    // Fetch user's custom template on component mount
  }, []);

  const handleSave = async () => {
    // Save template to database
  };

  return (
    <div>
      <h2>Custom Template</h2>
      <TextArea
        value={JSON.stringify(template, null, 2)}
        onChange={(e) => setTemplate(JSON.parse(e.target.value))}
      />
      <Button onClick={handleSave}>Save Template</Button>
    </div>
  );
}
```

### 8.2 Template Selection in Chat UI

```typescript
// components/ChatInterface.tsx
import { useState } from 'react';
import { Select } from '@/components/ui';

export function ChatInterface() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // ... existing chat logic

  return (
    <div>
      <Select
        options={[
          { label: 'Default', value: null },
          { label: 'Custom', value: 'custom' },
          // ... other template options
        ]}
        onChange={setSelectedTemplate}
      />
      {/* ... chat input and messages */}
    </div>
  );
}
```

## 9. Media Generation Agent Integration

### 9.1 Architecture for Multiple Agent Types

```typescript
// lib/agents.ts
export const AGENTS = {
  OPENAI: {
    type: 'text',
    provider: 'openai',
    config: { /* OpenAI-specific configuration */ },
    handlers: {
      stream: streamOpenAIResponse,
      process: processOpenAIContent
    }
  },
  DALL_E: {
    type: 'image',
    provider: 'openai',
    config: {
      model: "dall-e-3",
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    },
    handlers: {
      process: processImageGeneration,
      cache: cacheGeneratedImage
    }
  },
  STABLE_DIFFUSION: {
    type: 'image',
    provider: 'stability-ai',
    config: {
      engine: "stable-diffusion-xl-1024-v1-0",
      dimensions: { width: 1024, height: 1024 },
      cfg_scale: 7
    },
    handlers: {
      process: processStabilityImage,
      cache: cacheGeneratedImage
    }
  },
  CAROUSEL_BUILDER: {
    type: 'carousel',
    provider: 'internal',
    config: {
      maxSlides: 10,
      formats: ['image', 'text', 'mixed'],
      transitions: ['fade', 'slide', 'zoom']
    },
    handlers: {
      process: buildCarouselFromElements,
      export: exportCarouselToHTML
    }
  }
}
```

### 9.2 Media Agent Orchestration

```typescript
// lib/mediaOrchestrator.ts
import { AGENTS } from './agents';

export async function generateMediaContent(mediaType, prompt, options = {}) {
  // Select appropriate agent based on media type and options
  const agent = selectAppropriateAgent(mediaType, options);
  
  // Generate the media content
  const mediaContent = await agent.handlers.process({
    prompt,
    config: { ...agent.config, ...options }
  });
  
  // Cache if applicable
  if (agent.handlers.cache) {
    await agent.handlers.cache(mediaContent);
  }
  
  return mediaContent;
}

function selectAppropriateAgent(mediaType, options) {
  if (mediaType === 'image') {
    return options.provider === 'stability-ai' ? AGENTS.STABLE_DIFFUSION : AGENTS.DALL_E;
  } else if (mediaType === 'carousel') {
    return AGENTS.CAROUSEL_BUILDER;
  }
  
  return AGENTS.OPENAI; // Default to text generation
}
```

### 9.3 Media Generation API Endpoints

```typescript
// app/api/media/route.ts
export async function POST(req: Request) {
  const { mediaType, prompt, options } = await req.json();
  
  try {
    const mediaContent = await generateMediaContent(mediaType, prompt, options);
    
    return new Response(JSON.stringify({
      success: true,
      mediaUrl: mediaContent.url,
      mediaId: mediaContent.id,
      metadata: mediaContent.metadata
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 9.4 Carousel Builder Component

```typescript
// components/CarouselBuilder.tsx
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button, Panel, Select } from '@/components/ui';

export function CarouselBuilder() {
  const [slides, setSlides] = useState([]);
  const [transition, setTransition] = useState('fade');
  
  const addImageSlide = async () => {
    // Open image generation dialog or select from gallery
    const image = await openImageSelector();
    if (image) {
      setSlides([...slides, { type: 'image', content: image }]);
    }
  };
  
  const addTextSlide = () => {
    setSlides([...slides, { type: 'text', content: '' }]);
  };
  
  const generateCarousel = async () => {
    // Call carousel builder agent
    const carousel = await generateMediaContent('carousel', '', {
      slides,
      transition
    });
    
    // Return or embed the carousel
    return carousel;
  };
  
  return (
    <Panel>
      <h2>Carousel Builder</h2>
      
      <div className="slide-controls">
        <Button onClick={addImageSlide}>Add Image Slide</Button>
        <Button onClick={addTextSlide}>Add Text Slide</Button>
        <Select
          label="Transition"
          options={[
            { label: 'Fade', value: 'fade' },
            { label: 'Slide', value: 'slide' },
            { label: 'Zoom', value: 'zoom' }
          ]}
          value={transition}
          onChange={setTransition}
        />
      </div>
      
      <DragDropContext onDragEnd={reorderSlides}>
        <Droppable droppableId="slides">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="slides-container"
            >
              {slides.map((slide, index) => (
                <Draggable key={index} draggableId={`slide-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="slide-item"
                    >
                      {/* Slide editor UI */}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <Button primary onClick={generateCarousel}>Generate Carousel</Button>
    </Panel>
  );
}
```

### 9.5 Client-Side Media Integration

```typescript
// components/ContentEditor.tsx
import { useState } from 'react';
import { Button, Dropdown } from '@/components/ui';
import { CarouselBuilder } from './CarouselBuilder';

export function ContentEditor() {
  const [content, setContent] = useState('');
  const [mediaElements, setMediaElements] = useState([]);
  
  const insertImagePrompt = async () => {
    const prompt = await openPromptDialog('Describe the image you want to generate');
    if (!prompt) return;
    
    // Show loading indicator
    const imageResponse = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaType: 'image',
        prompt,
        options: { provider: 'openai' }
      })
    });
    
    const imageData = await imageResponse.json();
    if (imageData.success) {
      const newMedia = {
        type: 'image',
        id: imageData.mediaId,
        url: imageData.mediaUrl,
        description: prompt
      };
      
      setMediaElements([...mediaElements, newMedia]);
      setContent(content + `\n\n![${prompt}](${newMedia.url})\n\n`);
    }
  };
  
  const insertCarousel = async () => {
    const carousel = await openCarouselBuilder();
    if (carousel) {
      setMediaElements([...mediaElements, {
        type: 'carousel',
        id: carousel.id,
        slides: carousel.slides,
        description: `Carousel with ${carousel.slides.length} slides`
      }]);
      
      setContent(content + `\n\n[CAROUSEL_${mediaElements.length + 1}]\n\n`);
    }
  };
  
  return (
    <div className="content-editor">
      <div className="toolbar">
        <Dropdown label="Insert Media">
          <Button onClick={insertImagePrompt}>Generate Image</Button>
          <Button onClick={insertCarousel}>Create Carousel</Button>
        </Dropdown>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="content-textarea"
      />
      
      <div className="media-sidebar">
        <h3>Media Elements</h3>
        {mediaElements.map((media, index) => (
          <div key={index} className="media-item">
            {media.type === 'image' && (
              <img src={media.url} alt={media.description} className="thumbnail" />
            )}
            {media.type === 'carousel' && (
              <div className="carousel-preview">
                Carousel: {media.slides.length} slides
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```
